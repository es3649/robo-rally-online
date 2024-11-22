#include <SPI.h>
#include <SdFat.h>
#include "MCP_DAC.h"
#include "MFRC522.h"

// pin for chip select
#define DAC_CS_Pin 9
#define SD_CS_Pin 10
#define MFRC_CS_Pin 7
#define MFRC_RST_Pin 6
// pins for motor control
#define MTR_CLK_PIN 1
#define MTR_ENABLE_PIN 0
#define MTR1_ORIENTATION_PIN 2
#define MTR2_ORIENTATION_PIN 3

#define LASER_PIN 8

// holds 2s of 44.1kHz audio
#define BUFFER 88200

// step distance in mm
#define STEP_DISTANCE 1


// const int led1Pin = 5;

SdFat SD;
MCP4901 DAC;
File playback;
MFRC522 rifd(MFRC_CS_Pin, MFRC_RST_Pin);

/**
 * player_state manages a state machine for the player logic
 * -1: no data loaded, DAC shutdown
 * 0: data loaded, not played
 * >0: reading at position state (until size)
 *
 * the player_data array holds the data read from the file
 * player_size holds the relevant amount of data in the buffer
 */
uint8_t audio_data[BUFFER];
uint32_t audio_size = 0;
int32_t audio_state = -1;

/**
 * opens the names file, removes the header, and reads the first up to BUFFER
 * bytes of data.
 * @param filename the name of the file to open
 */
void loadFile(char* filename) {
  Serial.println("opening:");
  Serial.println(filename);
  // load in a file using SDFat
  playback = SD.open(filename, FILE_READ);
  if (playback) {
    // read off the header
    // https://docs.fileformat.com/audio/wav/
    uint8_t trash[40];
    playback.read(trash, 40);
    uint8_t size_buf[4];
    playback.read(size_buf, 4);
    // convert the bytes to a 4-byte integer, little endian (least sig. bit first)
    const uint32_t size = (size_buf[0] | size_buf[1] << 8 | size_buf[2] << 16 | size_buf[3] << 24);
    // read the appropriate amount of data; cap data read at BUFFER size
    audio_size = min(BUFFER, size);
    Serial.println(audio_size);
    Serial.println("reading audio");
    playback.read(audio_data, audio_size);

    // set the state to 0
    audio_state = 0;
    playback.close();
    Serial.println("file closed");
  } else {
    Serial.println("error opening file");
  }
}

void playerStep() {
  if (audio_state > -1) {
    if (audio_state < audio_size) {
      // write a byte to the DAC
      DAC.fastWriteA(audio_data[audio_state]);
      // update for next byte
      audio_state++;
    } else {
      // shutdown and reset state
      Serial.println("DAC shutdown");
      DAC.shutDown();
      audio_state = -1;
    }
  }
}

/**
 * Motor data
 * motor_steps: the number of steps which need to be taken
 * steps_taken: a count of steps taken
 */
int motor_steps = -1;
int steps_taken = 0;

void motorStep() {
  if (motor_steps > -1) {
    Serial.println("Stepping Motor");
    if (digitalRead(MTR_CLK_PIN) == HIGH) {
      digitalWrite(MTR_CLK_PIN, LOW);
    } else {
      digitalWrite(MTR_CLK_PIN, HIGH);
      steps_taken++;
    }
  }
  if (steps_taken >= motor_steps) {
    digitalWrite(MTR_ENABLE_PIN, LOW);
    Serial.println("Finished");
    motor_steps = -1;
  }
}

bool laser_on = false;
void laserStep() {
  static int steps = 0;
  if (laser_on) {
    if (steps > 10000) {
      steps = 0;
    } else {
      steps++;
    }
  }
}

/**
 * a byte array to hold RFID reads
 */
uint8_t nuidPICC[4];

void setup() {
  // put your setup code here, to run once:
  pinMode(MTR_CLK_PIN, OUTPUT);
  pinMode(MTR_ENABLE_PIN, OUTPUT);
  digitalWrite(MTR_ENABLE_PIN, LOW);
  pinMode(MTR1_ORIENTATION_PIN, OUTPUT);
  pinMode(MTR2_ORIENTATION_PIN, OUTPUT);
  // pinMode(laserPin, OUTPUT)
  // pinMode(led1Pin, OUTPUT)

  Serial.begin(9600);
  while (!Serial) {
    // wait for connection
  }

  Serial.println("Beginning SD init");

  if (!SD.begin(SD_CS_Pin)) {
    Serial.println("Failed!");
    return;
  }

  Serial.println("initialized");

  Serial.println("initializing DAC");
  DAC.begin(DAC_CS_Pin);
  DAC.setGain();
  // Serial.println(DAC.getSPIspeed());
  Serial.println("initialized");

  // set up the RFID reader
  MFRC.PCD_Init();

  // loadFile("shutdown0.wav");

  motor_steps = 20;
  digitalWrite(MTR_ENABLE_PIN, HIGH);
  digitalWrite(MTR1_ORIENTATION_PIN, HIGH);
  digitalWrite(MTR2_ORIENTATION_PIN, HIGH);
}

int iter = 0;
void loop() {
  // keep an iterator of the loop number
  if (iter == 10000) {
    iter = 0;
  } else {
    iter++;
  }
  // playerStep();
  if (iter % 10 == 0) {
    // motorStep();
    // laserStep();
    // ledStep();
  }
  motorStep();
  delay(1000);
}
