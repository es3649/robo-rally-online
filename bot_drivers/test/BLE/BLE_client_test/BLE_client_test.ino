// we set up the Arduino as a BLE peripheral device
// Code is adapted from a public-domain Arduino tutorial
// https://docs.arduino.cc/tutorials/nano-33-ble-sense/ble-device-to-device/

#include <ArduinoBLE.h>

// #define DEBUG

#define RED_PIN A0
#define GREEN_PIN A2
#define BLUE_PIN A4
#define STATUS_PIN 13

const char* SERVICE_ID                          = "346642f1-48ef-0000-a6a6-8a782eb06f26";
const char* RED_CHARACTERISTIC                  = "346642f1-48ef-0001-a6a6-8a782eb06f26";
const char* GREEN_CHARACTERISTIC                = "346642f1-48ef-0002-a6a6-8a782eb06f26";
const char* BLUE_CHARACTERISTIC                 = "346642f1-48ef-0003-a6a6-8a782eb06f26";


BLEService controlService(SERVICE_ID);
BLEByteCharacteristic redCharacteristic(RED_CHARACTERISTIC, BLERead | BLEWrite);
BLEByteCharacteristic greenCharacteristic(GREEN_CHARACTERISTIC, BLERead | BLEWrite);
BLEByteCharacteristic blueCharacteristic(BLUE_CHARACTERISTIC, BLERead | BLEWrite);

void setup() {
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  analogWrite(RED_PIN, 128);
  delay(500);
  analogWrite(GREEN_PIN, 128);
  delay(500);
  analogWrite(BLUE_PIN, 128);
  delay(500);
  analogWrite(RED_PIN, 255);
  delay(500);
  analogWrite(GREEN_PIN, 255);
  delay(500);
  analogWrite(BLUE_PIN, 255);
  delay(500);
  analogWrite(RED_PIN, 0);
  analogWrite(GREEN_PIN, 0);
  analogWrite(BLUE_PIN, 0);

#ifdef DEBUG
  Serial.begin(9600);
  // wait for serial connection
  while (!Serial);
#endif

  if (!BLE.begin()) {
#ifdef DEBUG
    Serial.println("- Starting Bluetooth® Low Energy module failed!");
#endif
    while (1);
  }

  BLE.setLocalName("Arduino Nano 33 BLE (peripheral)");
  BLE.setAdvertisedService(controlService);
  controlService.addCharacteristic(redCharacteristic);
  controlService.addCharacteristic(greenCharacteristic);
  controlService.addCharacteristic(blueCharacteristic);
  BLE.addService(controlService);
  redCharacteristic.writeValue(0);
  greenCharacteristic.writeValue(0);
  blueCharacteristic.writeValue(0);
  digitalWrite(STATUS_PIN, HIGH);
  BLE.advertise();


#ifdef DEBUG
  Serial.println("Arduino Nano 33 BLE (Peripheral Device)");
  Serial.println("  ");
#endif
}

void loop() {
  BLEDevice central = BLE.central();
#ifdef DEBUG
  Serial.println("- Discovering Central Device");
#endif
  delay(500);

  if (central) {
    digitalWrite(STATUS_PIN, LOW);
#ifdef DEBUG
    Serial.println("* Connected to central device!");
    Serial.print("* Device MAC address: ");
    Serial.println(central.address());
    Serial.println("  ");
#endif

    while (central.connected()) {
      if (redCharacteristic.written()) {
        analogWrite(RED_PIN, redCharacteristic.value());
      }
      if (greenCharacteristic.written()) {
        analogWrite(GREEN_PIN, greenCharacteristic.value());
      }
      if (blueCharacteristic.written()) {
        analogWrite(BLUE_PIN, blueCharacteristic.value());
      }
    }

#ifdef DEBUG
    Serial.println("* Disconnected from central device!");
#endif
    digitalWrite(STATUS_PIN, HIGH);
    analogWrite(RED_PIN, 0);
    analogWrite(GREEN_PIN, 0);
    analogWrite(BLUE_PIN, 0);
  }
}