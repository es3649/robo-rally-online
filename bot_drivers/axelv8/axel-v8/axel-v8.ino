#include <ArduinoBLE.h> // builtin
#include <SPI.h> // builtin
#include <sstream>
#include <iomanip>
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
enum State {
    CONNECTING,
    DEFAULT,
    SHUTDOWN,
    LASER,
    RFID
};

State cur_state = State::CONNECTING;

enum Movement {
  NONE,
  MOVE_FORWARD,
  MOVE_BACK,
  MOVE_LEFT,
  MOVE_RIGHT,
  TURN_LEFT,
  TURN_RIGHT
};

Movement action = Movement::NONE;

/******************************* BLUETOOTH SETUP *******************************/
// define the UUIDs for our characteristics
const char* SERVICE_ID                          = "346642f1-0000-49fc-a6a6-8a782eb06f26";
const char* STATE_CHARACTERISTIC                = "346642f1-0001-49fc-a6a6-8a782eb06f26";
const char* SOUND_CHARACTERISTIC                = "346642f1-0002-49fc-a6a6-8a782eb06f26";
const char* MOVEMENT_DIRECTION_CHARACTERISTIC   = "346642f1-0003-49fc-a6a6-8a782eb06f26";
const char* IDEMPOTENCY_CHARACTERISTIC          = "346642f1-0004-49fc-a6a6-8a782eb06f26";
const char* RFID_CHARACTERISTIC                 = "346642f1-0005-49fc-a6a6-8a782eb06f26";

BLEService controlService(SERVICE_ID);
BLEByteCharacteristic controlCharacteristic(STATE_CHARACTERISTIC, BLERead);
BLEByteCharacteristic soundCharacteristic(SOUND_CHARACTERISTIC, BLERead);
BLEByteCharacteristic movementDirectionCharacteristic(MOVEMENT_DIRECTION_CHARACTERISTIC, BLERead);
BLEWordCharacteristic idempotencyCharacteristic(IDEMPOTENCY_CHARACTERISTIC, BLERead);
BLEWordCharacteristic rfidCharacteristic(RFID_CHARACTERISTIC, BLEWrite);

void connecting() {
  // if not initialized: initialize
  BLE.advertise();
  // TODO, more here

  // flash the STATUS LED quickly
  digitalWrite(STATUS_LED_PIN, HIGH);
  delay(500);
  digitalWrite(STATUS_LED_PIN, LOW);
  delay(500);
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
    std::stringstream ss;
    ss << std::hex;
    for (uint8_t i = 0; i < 4; i++) {
      nuid_PICC[i] = rfid.uid.uidByte[i];
      ss << std::setw(2) << std::setfill('0') << rfid.uid.uidByte[i];
      ss << " ";
    }

    // write the new card value to the bluetooth characteristic
    // rfidCharacteristic.writeValue(ss.str());
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
  // determine the movement direction
  Movement movement_direction = movementDirectionCharacteristic.readValue();

  if (movement_direction == Movement::MOVE_FORWARD || movement_direction == Movement::TURN_RIGHT) {
    // left motor needs to move clockwise
    setMotorClockwise(MTRL_ORIENTATION_PIN);
  } else {
    // needs to move widdershins
    setMotorWiddershins(MTRL_ORIENTATION_PIN);
  }

  if (movement_direction == Movement::MOVE_BACK || movement_direction == Movement::TURN_RIGHT) {
    // right motor needs to move clockwise
    setMotorClockwise(MTRR_ORIENTATION_PIN);
  } else {
    // right motor needs to move widdershins
    setMotorWiddershins(MTRR_ORIENTATION_PIN);
  }

  // use the correct number of steps for forward/back movment, lateral movement, or rotation
  int steps;
  if (movement_direction == Movement::MOVE_FORWARD || Movement::MOVE_BACK) {
    steps = STEPS_TO_MOVE_ONE_SPACE;
  } else {
    steps = STEPS_TO_ROTATE;
  }

  // enable the motors
  enableMotors();

  // begin rotatating the motors
  for (int i = 0; i < steps; i++) {
    digitalWrite(MTR_CLK_PIN, HIGH);
    delayMicroseconds(MOTOR_STEP_DELAY_US);
    digitalWrite(MTR_CLK_PIN, LOW);
    delayMicroseconds(MOTOR_STEP_DELAY_US);
  }

  disableMotors();
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
  // play a shutdown noise

  static int step = 1;
  static uint8_t intensity = 0;
  analogWrite(STATUS_LED_PIN, intensity);
  
  while (cur_state == State::SHUTDOWN) {
    // check the bluetooth state for a change of state
    // if there's a state change, return
    delay(10);
    if (intensity < 255 && intensity > 0) {
      intensity += step;
      analogWrite(STATUS_LED_PIN, intensity);
    } else {
      step *= -1;
    }
  }
}

/******************************* LASER STATE DEFN *******************************/
void laser() {
  // light off; laser on
  digitalWrite(STATUS_LED_PIN, LOW);
  digitalWrite(LASER_PIN, HIGH);
  
  // wait for iiiiiiiitt;
  delay(2000);

  // laser off, back to default
  digitalWrite(LASER_PIN, LOW);
  cur_state = State::DEFAULT;
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
  controlService.addCharacteristic(controlCharacteristic);
  controlService.addCharacteristic(soundCharacteristic);
  controlService.addCharacteristic(movementDirectionCharacteristic);
  controlService.addCharacteristic(idempotencyCharacteristic);
  controlService.addCharacteristic(rfidCharacteristic);

  controlCharacteristic.writeValue(-1);
  #ifdef DEBUG
    Serial.println("Bluetooth® Low Energy initialized");
  #endif
}

void loop() {
  switch (cur_state) {
  case State::CONNECTING:
    // check that BT is initialized and wait for a connection
    connecting();
    break;
  case State::DEFAULT:
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
  }
}