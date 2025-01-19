/**
 * L6208 test
 *
 */

// the state machine takes on step on each rising clock edge, max freq 100kHz
#define MTR_CLK_PIN 6
// low switches off all power, high enables the chip
#define MTR_ENABLE_PIN 5
// definitions for this pin below: (C)CW
#define MTR_ORIENTATION_PIN 2
// low logic level starts a chip reset
#define MTR_RESET_PIN 4
// definitions for the (counter)clockwise logic levels
#define CW HIGH
#define CCW LOW

void setup() {
  pinMode(MTR_RESET_PIN, OUTPUT);
  // high means not resetting
  digitalWrite(MTR_RESET_PIN, HIGH);
  pinMode(MTR_CLK_PIN, OUTPUT);
  pinMode(MTR_ORIENTATION_PIN, OUTPUT);
  pinMode(MTR_ENABLE_PIN, OUTPUT);

  digitalWrite(MTR_CLK_PIN, LOW);
  digitalWrite(MTR_ORIENTATION_PIN, CW);
  digitalWrite(MTR_ENABLE_PIN, LOW);

  Serial.begin(9600);
  while (!Serial) {
    // wait for connection to be established
  }

  Serial.println("Resetting L6208");
  // send the reset pin from low then back to high to perform a reset
  digitalWrite(MTR_RESET_PIN, LOW);
  // the device requires 1us with the reset low in order to reset: 1ms will be plenty
  delay(1);
  digitalWrite(MTR_RESET_PIN, HIGH);
  Serial.println("L6208 reset");
  Serial.println("Enabling L6208");
  digitalWrite(MTR_ENABLE_PIN, HIGH);
  Serial.println("L6208 enabled");

  Serial.println("Beginning CW rotation: 2000 steps");
  for (int i = 0; i < 2000; i++) {
    digitalWrite(MTR_CLK_PIN, HIGH);
    // delayMicroseconds(20);
    delay(1);
    digitalWrite(MTR_CLK_PIN, LOW);
    // delayMicroseconds(20);
    delay(1);
  }
  digitalWrite(MTR_ENABLE_PIN, LOW);
  delay(1000);
  Serial.println("Beginning CCW rotation: 2000 steps");
  digitalWrite(MTR_ORIENTATION_PIN, CCW);
  digitalWrite(MTR_ENABLE_PIN, HIGH);
  for (int i = 0; i < 2000; i++) {
    digitalWrite(MTR_CLK_PIN, HIGH);
    // delayMicroseconds(20);
    delay(1);
    digitalWrite(MTR_CLK_PIN, LOW);
    // delayMicroseconds(20);
    delay(1);
  }

  Serial.println("Finished");
  digitalWrite(MTR_ENABLE_PIN, LOW);
}

void loop() {

}