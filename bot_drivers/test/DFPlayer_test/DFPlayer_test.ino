#include "DFRobotDFPlayerMini.h"

DFRobotDFPlayerMini player;

void setup() {
  Serial.begin(9600);
  Serial1.begin(9600);
  while(!Serial) {}
  while(!Serial1) {}

  if (player.begin(Serial1)) {
    Serial.println("Audio player initialized");

    player.volume(30);
    Serial.println("Playing file");
    player.loop(2);
  } else {
    Serial.println("Failed to init Audio Player");
  }
}

void loop() {}