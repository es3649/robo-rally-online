#include <ArduinoBLE.h> // builtin
#include <SPI.h> // builtin
#include <MFRC522.h> // https://github.com/miguelbalboa/rfid

#define DEBUG true

#define BOT_NAME "Axel-V8"
#define STEPS_TO_MOVE_ONE_SPACE 100
#define STEPS_TO_ROTATE 100

#define STATUS_LED_PIN A3
#define RFID_RST_PIN A7
// #define SD_CS_PIN 10
#define DAC_CS_PIN 9
#define LASER_PIN 8
#define RFID_CS_PIN 7 
#define MTR_CLK_PIN 6
#define MTR_ENABLE_PIN 5
#define MTR_RESET_PIN 4
#define MTRL_ORIENTATION_PIN 2
#define MTRR_ORIENTATION_PIN 3

/**
 * States have the following LED status descriptions
 * CONNECTING: flashing quickly (~every 1/2 sec)    -_-_-_-_
 * DEFAULT: short flash every ~2 sec                -_______
 * SHUTDOWN: slowly breathing (~11s cycles)
 * LASER: same as DEFAULT, but the laser is on      -_______
 * RFID: two quick pulses, followed by ~1s off      -_-_____
 * ERROR: flashing slowly (~every 2 sec)            ----____
 */
namespace State {
  const uint8_t DEFAULT = 1;
  const uint8_t SHUTDOWN = 2;
  const uint8_t LASER = 3;
  const uint8_t RFID = 4;
};

uint8_t cur_state = State::DEFAULT;
uint8_t last_idempotence_code = 0;

namespace Movement {
  const uint8_t NONE = 0;
  const uint8_t MOVE_FORWARD = 1;
  const uint8_t MOVE_BACK = 2;
  const uint8_t MOVE_LEFT = 3;
  const uint8_t MOVE_RIGHT = 4;
  const uint8_t TURN_LEFT = 5;
  const uint8_t TURN_RIGHT = 6;
};

uint8_t movement = Movement::NONE;
int steps;

/******************************* BLUETOOTH SETUP *******************************/
// define the UUIDs for our characteristics
const char* SERVICE_ID                          = "346642f1-0000-49fc-a6a6-8a782eb06f26";
const char* STATE_CHARACTERISTIC                = "346642f1-0001-49fc-a6a6-8a782eb06f26";
const char* SOUND_CHARACTERISTIC                = "346642f1-0002-49fc-a6a6-8a782eb06f26";
const char* MOVEMENT_DIRECTION_CHARACTERISTIC   = "346642f1-0003-49fc-a6a6-8a782eb06f26";
const char* IDEMPOTENCY_CHARACTERISTIC          = "346642f1-0004-49fc-a6a6-8a782eb06f26";
const char* RFID_CHARACTERISTIC                 = "346642f1-0005-49fc-a6a6-8a782eb06f26";

BLEService controlService(SERVICE_ID);
BLEByteCharacteristic stateCharacteristic(STATE_CHARACTERISTIC, BLERead);
BLEByteCharacteristic soundCharacteristic(SOUND_CHARACTERISTIC, BLERead);
BLEByteCharacteristic movementDirectionCharacteristic(MOVEMENT_DIRECTION_CHARACTERISTIC, BLERead);
BLEByteCharacteristic idempotencyCharacteristic(IDEMPOTENCY_CHARACTERISTIC, BLERead);
BLEUnsignedIntCharacteristic rfidCharacteristic(RFID_CHARACTERISTIC, BLEWrite);

BLEDevice central;

void connect() {
  // if not initialized: initialize
  BLE.advertise();

  // flash the STATUS LED quickly while awaiting a connection
  do {
    central = BLE.central();
    digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
    delay(500);
  } while (!central);

  BLE.stopAdvertise();

  #ifdef DEBUG
    Serial.println("Connected to central device!");
    Serial.print("MAC Address: ");
    Serial.println(central.address());
  #endif

  updateBLEValues();
}

void updateBLEValues() {
  // check if the state code changed
  uint8_t written_idempotency;
  idempotencyCharacteristic.readValue(written_idempotency);

  if (written_idempotency != last_idempotence_code) {
    // update all the values
    stateCharacteristic.readValue(cur_state);
    movementDirectionCharacteristic.readValue(movement);
    last_idempotence_code = written_idempotency;
    if (movement != Movement::NONE) {
      move();
    }

    #ifdef DEBUG
      Serial.print("Read state: ");
      Serial.println(cur_state);
      Serial.print("Read movement: ");
      Serial.println(movement);
    #endif
  }
}

/******************************* RFID READER SETUP *******************************/
MFRC522 rfid(RFID_CS_PIN, RFID_RST_PIN); 

void readRFID() {
  static byte nuid_PICC[4];
  // if there is no card present, or we can't read it, continue
  if(!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // check if this is a recognized card type
  MFRC522::PICC_Type picc_type = rfid.PICC_GetType(rfid.uid.sak);
  if (picc_type != MFRC522::PICC_TYPE_MIFARE_MINI &&
      picc_type != MFRC522::PICC_TYPE_MIFARE_1K &&
      picc_type != MFRC522::PICC_TYPE_MIFARE_4K) {
    return;
  }

  // if any byte is different, we actually got a new code
  if (rfid.uid.uidByte[0] != nuid_PICC[0] || 
      rfid.uid.uidByte[1] != nuid_PICC[1] || 
      rfid.uid.uidByte[2] != nuid_PICC[2] || 
      rfid.uid.uidByte[3] != nuid_PICC[3] ) {
    #ifdef DEBUG
      Serial.print("Detected new card. NUID tag is: ");
      Serial.println();
    #endif
    // save the most recent code
    uint32_t value = 0;
    for (uint8_t i = 0; i < 4; i++) {
      value <<= 8;
      nuid_PICC[i] = rfid.uid.uidByte[i];
      value |= rfid.uid.uidByte[i];
    }

    // write the new card value to the bluetooth characteristic
    rfidCharacteristic.writeValue(value);
  }
}

/******************************* L6208 DRIVER SETUP *******************************/
// TODO tune this: I think the technical minimum in the datasheet is 1us, but that's probably too short
#define MOTOR_STEP_DELAY_US 1000
inline void disableMotors() {
  digitalWrite(MTR_ENABLE_PIN, LOW);
}

inline void enableMotors() {
  digitalWrite(MTR_ENABLE_PIN, HIGH);
  // there is a max 1050ns delay we will need to respect before sending data signals
  delayMicroseconds(2);
}

inline void setMotorClockwise(const uint8_t& controller_pin) {
  digitalWrite(controller_pin, HIGH);
}

inline void setMotorWiddershins(const uint8_t& controller_pin) {
  digitalWrite(controller_pin, LOW);
}

void move() {
  if (movement == Movement::MOVE_FORWARD || movement == Movement::TURN_RIGHT) {
    // left motor needs to move clockwise
    setMotorClockwise(MTRL_ORIENTATION_PIN);
  } else {
    // needs to move widdershins
    setMotorWiddershins(MTRL_ORIENTATION_PIN);
  }

  if (movement == Movement::MOVE_BACK || movement == Movement::TURN_RIGHT) {
    // right motor needs to move clockwise
    setMotorClockwise(MTRR_ORIENTATION_PIN);
  } else {
    // right motor needs to move widdershins
    setMotorWiddershins(MTRR_ORIENTATION_PIN);
  }

  if (movement == Movement::MOVE_FORWARD || movement == Movement::MOVE_BACK) {
    steps = STEPS_TO_MOVE_ONE_SPACE;
  } else {
    steps = STEPS_TO_ROTATE;
  }

  // enable the motors
  enableMotors();
}

void moveStep() {
  // use the correct number of steps for forward/back movement, lateral movement, or rotation
  static int steps_taken = 0;

  // begin rotating the motors
  if (steps_taken < steps) {
    PinStatus clk_state = digitalRead(MTR_CLK_PIN);
    digitalWrite(MTR_CLK_PIN, !clk_state);
    delayMicroseconds(MOTOR_STEP_DELAY_US);
    if (clk_state == LOW) {
      steps_taken++;
    }
  } else {
    // set the clock low
    disableMotors();
    // set that there's no movement
    movement = Movement::NONE;
    // reset the step counts
    steps = 0;
    steps_taken = 0;
  }
}

/******************************* ERROR STATE DEFN *******************************/
/**
 * perpetually goes into an error state
 * (use only when an un-resolvable error occurs)
 */
void errorState() {
  while (1) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(2000);
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(2000);
  }
}

/******************************* SHUTDOWN STATE DEFN *******************************/
void shutdown() {
  // later: play a shutdown noise

  static int step = 1;
  static uint8_t intensity = 0;
  analogWrite(STATUS_LED_PIN, intensity);
  
  delay(10);
  if (intensity < 255 && intensity > 0) {
    intensity += step;
    analogWrite(STATUS_LED_PIN, intensity);
  } else {
    step *= -1;
  }

  // sometimes we still need to move while shutdown
  if (steps) {
    moveStep();
  }
}

/******************************* LASER STATE DEFN *******************************/
void laser() {
  // light off; laser on
  digitalWrite(STATUS_LED_PIN, LOW);
  digitalWrite(LASER_PIN, HIGH);

  // laser off, back to default
  digitalWrite(LASER_PIN, LOW);
  cur_state = State::DEFAULT;
}

/******************************* DEFAULT STATE DEFN *******************************/
void statusLEDUpdate() {
  static int last_status_led_swap = 0;
  int now = millis();
  PinStatus led_status = digitalRead(STATUS_LED_PIN);
  int diff = now - last_status_led_swap;
  switch (cur_state) {
    case State::DEFAULT:
    case State::LASER:
      if (diff < 250) {
        digitalWrite(STATUS_LED_PIN, HIGH);
      } else {
        digitalWrite(STATUS_LED_PIN, LOW);
      }
      break;
    case State::RFID:
      if (diff < 250) {
        digitalWrite(STATUS_LED_PIN, HIGH);
      } else if (diff > 250) {
        digitalWrite(STATUS_LED_PIN, LOW);
      } else if (diff > 500) {
        digitalWrite(STATUS_LED_PIN, HIGH);
      } else if (diff > 750) {
        digitalWrite(STATUS_LED_PIN, LOW);
      }
      break;
  }

  if (diff > 2000) {
    last_status_led_swap = now;
  }
}

void defaultState() {
  statusLEDUpdate();

  if (movement != Movement::NONE) {
    moveStep();
  }
}

/******************************* SETUP AND LOOP *******************************/
void setup() {
  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(RFID_RST_PIN, OUTPUT);
  pinMode(LASER_PIN, OUTPUT);
  pinMode(RFID_CS_PIN, OUTPUT);
  pinMode(MTR_CLK_PIN, OUTPUT);
  pinMode(MTR_RESET_PIN, OUTPUT);
  digitalWrite(MTR_RESET_PIN, HIGH);
  pinMode(MTR_ENABLE_PIN, OUTPUT);
  disableMotors();
  pinMode(MTRL_ORIENTATION_PIN, OUTPUT);
  pinMode(MTRR_ORIENTATION_PIN, OUTPUT);

  digitalWrite(STATUS_LED_PIN, HIGH);
  
  
  #ifdef DEBUG
    Serial.begin(9600);
    while (!Serial) {}
    Serial.println("Resetting L6208(s)");
  #endif

  // hold the reset pin low for >1us, then raise it again
  digitalWrite(MTR_RESET_PIN, LOW);
  delayMicroseconds(15);
  digitalWrite(MTR_RESET_PIN, HIGH);

  #ifdef DEBUG
    Serial.println("L6208(s) reset");
    Serial.println("Initializing RFID reader");
  #endif
  // setup the RFID reader
  SPI.begin();
  rfid.PCD_Init();

  #ifdef DEBUG
    Serial.println("RFID reader ready");
    Serial.println("Starting Bluetooth® Low Energy");
  #endif

  if(!BLE.begin()) {
  #ifdef DEBUG
      Serial.println("Failed to start Bluetooth®!");
  #endif
    errorState();
  }

  BLE.setLocalName(BOT_NAME);
  BLE.setAdvertisedService(controlService);
  controlService.addCharacteristic(stateCharacteristic);
  controlService.addCharacteristic(soundCharacteristic);
  controlService.addCharacteristic(movementDirectionCharacteristic);
  controlService.addCharacteristic(idempotencyCharacteristic);
  controlService.addCharacteristic(rfidCharacteristic);

  stateCharacteristic.writeValue(-1);
  #ifdef DEBUG
    Serial.println("Bluetooth® Low Energy initialized");
  #endif

  // start connecting
  connect();
}

void loop() {
  // check the connection status, if we were disconnected, return to pairing mode
  if (!central.connected()) {
    // switch back to connecting state
    connect();
  } else {
    // update values from BLE
    updateBLEValues();
  }

  statusLEDUpdate();

  switch (cur_state) {
  case State::DEFAULT:
    defaultState();
    break;
  case State::SHUTDOWN:
    shutdown();
    break;
  case State::LASER:
    laser();
    break;
  case State::RFID:
    readRFID();
    break;
  default:
    cur_state = State::DEFAULT;
    break;
  }
}