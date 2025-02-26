#include <ArduinoBLE.h>

#define STATUS_PIN 13

// #define DEBUG

const char* SERVICE_ID                          = "346642f1-48ef-0000-a6a6-8a782eb06f26";
const char* RED_CHARACTERISTIC                  = "346642f1-48ef-0001-a6a6-8a782eb06f26";
const char* GREEN_CHARACTERISTIC                = "346642f1-48ef-0002-a6a6-8a782eb06f26";
const char* BLUE_CHARACTERISTIC                 = "346642f1-48ef-0003-a6a6-8a782eb06f26";

void setup() {
  pinMode(STATUS_PIN, OUTPUT);
  if (!BLE.begin()) {
    while (1) {
      digitalWrite(STATUS_PIN, LOW);
      delay(500);
      digitalWrite(STATUS_PIN, HIGH);
      delay(500);
    }
  }
#ifdef DEBUG
  Serial.begin(9600);
  while (!Serial) {
    digitalWrite(STATUS_PIN, HIGH);
    delay(500);
    digitalWrite(STATUS_PIN, LOW);
    delay(500);
  }
#endif

  BLE.setLocalName("Nano 33 BLE (Central)");
  BLE.advertise();
#ifdef DEBUG
  Serial.println("(Central) Advertising...");
#endif
}

void loop() {
#ifdef DEBUG
  Serial.println("* Searching for Peripherals");
#endif
  digitalWrite(STATUS_PIN, HIGH);
  connectToPeripheral();
}

void connectToPeripheral() {
  BLEDevice peripheral;

  do {
    BLE.scanForUuid(SERVICE_ID);
    peripheral = BLE.available();
  } while (!peripheral);

  if (peripheral) {

#ifdef DEBUG
  Serial.println("* Peripheral device found!");
  Serial.print("* Device MAC address: ");
  Serial.println(peripheral.address());
  Serial.print("* Device name: ");
  Serial.println(peripheral.localName());
#endif
  BLE.stopScan();
  controlPeripheral(peripheral);
  }
}

void controlPeripheral(BLEDevice peripheral) {
  digitalWrite(STATUS_PIN, LOW);
  if (peripheral.connect()) {
#ifdef DEBUG
    Serial.println("* Connected to peripheral device!");
#endif
  } else {
#ifdef DEBUG
    Serial.println("* Connection to peripheral device failed!");
#endif
    return;
  }
  if(!peripheral.discoverAttributes()) {
    peripheral.disconnect();
    return;
  }

  BLECharacteristic redCharacteristic = peripheral.characteristic(RED_CHARACTERISTIC);
  BLECharacteristic greenCharacteristic = peripheral.characteristic(GREEN_CHARACTERISTIC);
  BLECharacteristic blueCharacteristic = peripheral.characteristic(BLUE_CHARACTERISTIC);

  if (!redCharacteristic || !greenCharacteristic || !blueCharacteristic) {
    #ifdef DEBUG
    Serial.println("* Peripheral does not have color characteristicc");
    #endif
    peripheral.disconnect();
    return;
  } else if (!redCharacteristic.canWrite() || !greenCharacteristic.canWrite() || !blueCharacteristic.canWrite()) {
    #ifdef DEBUG
    Serial.println("* Peripheral does not have writable color characteristicc");
    #endif
    peripheral.disconnect();
    return;
  }

  uint8_t red = 10;
  int8_t red_step = 5;
  uint8_t green = 180;
  int8_t green_step = 5;
  uint8_t blue = 75;
  int8_t blue_step = -5;

  while (peripheral.connected()) {
    redCharacteristic.writeValue((byte)red);
    greenCharacteristic.writeValue((byte)green);
    blueCharacteristic.writeValue((byte)blue);

    if (red > 245 || red < 10) {
      red_step *= -1;
    }
    red += red_step;
    if (green > 245 || green < 10) {
      green_step *= -1;
    }
    green += green_step;
    if (blue > 245 || blue < 10) {
      blue_step *= -1;
    }
    blue += blue_step;

    delay(100);
  }
}