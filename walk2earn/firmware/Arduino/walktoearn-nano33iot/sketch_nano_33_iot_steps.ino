#include <Arduino.h>
#include <Arduino_JSON.h>
#include <NTPClient.h>
#include <FlashStorage.h>
#include <FlashAsEEPROM.h>
#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>

// Configure your Wifi and MQTT endpoint
#include "secrets.h"

// Use accelerometer as a pedometer
#include <SparkFunLSM6DS3.h>
#include "Wire.h"
#include "SPI.h"

// Use the integrated secure crypto chip
#include <ArduinoECCX08.h>

LSM6DS3Core myIMU(I2C_MODE, 0x6A);

WiFiClient wifiClient;

WiFiUDP ntpUDP;

NTPClient timeClient(ntpUDP);

HttpClient httpClient(wifiClient, W3BSTREAM_HOST, W3BSTREAM_HTTP_PORT);


// The slot to use in the ATECC608A secure chip.
const int slot = 0;

// For the device Id we picked the first 20 bytes of the ATECC608 public key
// but it can be anything. Just these are easier to manage in Solidity using
// the "address" type
String deviceId = "b687e298ad52eec4fe32b27af45247f365906259";    

// Store the public key of the secure chip
byte publicKey[64] = {0};
String pubKeyStr = "";

// Stores the total steps taken, it's permanently stored in flash on every change
int steps;

// Variable synced with the steps provided by the IMU (i.e. since device power on)
int IMUSteps;

// We store the accumulated steps in flash on every steps read.
FlashStorage(steps_storage, int);


void setup() {
  // Let's use the led to signal when the device is communicating
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);

  Serial.begin(9600);
  while (!Serial);
  
  Serial.println(".....::::: APP STARTED :::::......");
  Serial.println("Verifiable pedometer with Arduino nano 33 IoT");

  Serial.println("Initialize the pedometer...");
  if (!setupIMU()) {
    Serial.println("Failed to initialize the pedometer.");
    while(1);
  }

  Serial.print("Read total steps from flash...");
  steps = steps_storage.read();
  Serial.println(steps); 
  
  Serial.println("Initialize the secure chip...");
  if (!ECCX08.begin()) {
    Serial.println("Failed to communicate with ECC508/ECC608!");
    while (1);
  }

  // Verify the crypto chip is locked (ie. configured.).
  if (!ECCX08.locked()) {
    Serial.println("The ECC508/ECC608 is not locked!");
    Serial.println("ECC508/ECC608 needs to be configured and locked before proceeding");
    while (1);
  }

  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  initWiFi();

  Serial.print("Syncing time over NTP...");
  timeClient.begin();
  timeClient.update();
  Serial.print(timeClient.getFormattedTime() + "- ");
  Serial.println(timeClient.getEpochTime());
  
  // Retrieve the public key for the corresponding slot in the ECC508/ECC608.
  ECCX08.generatePublicKey(slot, publicKey);
  pubKeyStr = BufferHexToStr(publicKey, sizeof(publicKey));
  
  Serial.print("Device's public key: " + pubKeyStr);
  
}

void loop() {
   
  // Update steps taken
  digitalWrite(LED_BUILTIN, LOW); 
  while (!readSteps()) { 
     delay(3000);
  };

  digitalWrite(LED_BUILTIN, HIGH); 

  // Build a message using data from the accelerometer.
  Serial.println("\n---- NEW MESSAGE ----");
  
  // Get timestamp from Internet
  int timestamp = timeClient.getEpochTime(); 
  
  // Send http message
  sendEventHttp(steps, timestamp);
  
}

String BufferHexToStr(const byte input[], int inputLength) {
  String hexString = "";
  for (int i = 0; i < inputLength; i++) {
    hexString+=String(input[i] >> 4, HEX);
    hexString+=String(input[i] & 0x0f, HEX);
  }
  return hexString;
}

// Connects to the wifi network.
void initWiFi() 
{
    #if defined(DEBUG)
    return;
    #endif
    
    #if defined(ESP8266) || defined(ESP32)
    WiFi.mode(WIFI_STA);
    #endif
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print(F("Connecting to WiFi .."));
    while (WiFi.status() != WL_CONNECTED) {
        Serial.print('.');
        delay(1000);
    }
    Serial.println(F("\r\nConnected. IP: "));
    Serial.println(WiFi.localIP());
}

bool readSteps() {
  uint8_t readDataByte = 0;
  int stepsTaken;
  
  // Read the number of steps stored in the pedometer (16bit value by two 8bit operations)
  myIMU.readRegister(&readDataByte, LSM6DS3_ACC_GYRO_STEP_COUNTER_H);
  stepsTaken = ((uint16_t)readDataByte) << 8;
  
  myIMU.readRegister(&readDataByte, LSM6DS3_ACC_GYRO_STEP_COUNTER_L);
  stepsTaken |= readDataByte;

  if (stepsTaken == IMUSteps) return false;
  
  steps += (stepsTaken - IMUSteps);
  IMUSteps = stepsTaken;

  // Store current total steps in ase of power off 
  steps_storage.write(steps);
  return true;
}


void sendEventHttp(int steps, int timestamp)
{
    const String httpEndpoint = "/srv-applet-mgr/v0/event/" + String(W3BSTREAM_PROJECT);
    const String url = "http://" + String(W3BSTREAM_HOST) + ":" + String(W3BSTREAM_HTTP_PORT) + httpEndpoint;
  
    String body = JSON.stringify(getPayloadJSON(steps, timestamp));
    Serial.println("Sending http POST request to " + url + " with body: ");
    Serial.println(body);
   
    httpClient.post(httpEndpoint, "application/json", body);
    int statusCode = httpClient.responseStatusCode();
    if (statusCode != 200 && statusCode != 201)
    {
       Serial.println("Error sending HTTP POST request:");
       Serial.println("Status code: " + String(statusCode));
    }
    else
    {
        Serial.println("HTTP POST succssful. Response: ");
    }
    Serial.print("Response: ");
    Serial.println(httpClient.responseBody());
}


// Escapes double quotes in a string
String escdq(const String str) {
    String strCopy = str;
    strCopy.replace("\"","\\\"");
    return strCopy;
}

JSONVar getPayloadJSON(int steps, int timestamp)
{
    // Build the header
    JSONVar header_json;
    header_json["event_type"] = W3BSTREAM_EVENT_TYPE;
    header_json["pub_id"] = W3BSTREAM_PUB_ID;
    header_json["token"] = W3BSTREAM_PUB_TOKEN;
    header_json["pub_time"] = timestamp;

    JSONVar data_message;
    data_message["steps"] = steps;
    data_message["timestamp"] = timestamp;

    // Hash the message using sha256.
    String signature = HashAndSign(data_message);
    
    JSONVar payload_to_wasm_instance;
    payload_to_wasm_instance["message"] = data_message;
    payload_to_wasm_instance["public_key"] = "04" + pubKeyStr;
    payload_to_wasm_instance["signature"] = signature;
    payload_to_wasm_instance["device_id"] = deviceId;

    JSONVar payload_json;
    payload_json["payload"] = JSON.stringify(payload_to_wasm_instance);
    payload_json["header"] = header_json;

    return payload_json;
}

String HashAndSign(JSONVar data_message) {
    String message = JSON.stringify(data_message);
    Serial.println("Message is " + message);

    byte hash[32] = {0};
    ECCX08.beginSHA256();
    ECCX08.endSHA256((byte*)message.c_str(), message.length(), hash);
    Serial.println("Message hash is: "+ BufferHexToStr(hash, sizeof(hash)));

    // Sign the message.
    byte signature[64];
    ECCX08.ecSign(slot, hash, signature);
    String signature_string = BufferHexToStr(signature, sizeof(signature));
    Serial.println("Signature is " + signature_string);
    return signature_string;
}


bool setupIMU()
{
  //Call .beginCore() to configure the IMU
  if( myIMU.beginCore() != 0 )
  {
    Serial.println("Error at beginCore() configure the IMU.");
    return false;
  }

  //Error accumulation variable
  uint8_t errorAccumulator = 0;

  uint8_t dataToWrite = 0;  //Temporary variable

  //Setup the accelerometer******************************
  dataToWrite = 0; //Start Fresh!
  dataToWrite |= LSM6DS3_ACC_GYRO_BW_XL_200Hz;
  dataToWrite |= LSM6DS3_ACC_GYRO_FS_XL_2g;
  dataToWrite |= LSM6DS3_ACC_GYRO_ODR_XL_26Hz;

  // //Now, write the patched together data
  errorAccumulator += myIMU.writeRegister(LSM6DS3_ACC_GYRO_CTRL1_XL, dataToWrite);

  //Set the ODR bit
  errorAccumulator += myIMU.readRegister(&dataToWrite, LSM6DS3_ACC_GYRO_CTRL4_C);
  dataToWrite &= ~((uint8_t)LSM6DS3_ACC_GYRO_BW_SCAL_ODR_ENABLED);

  // Enable embedded functions -- ALSO clears the pdeo step count
  errorAccumulator += myIMU.writeRegister(LSM6DS3_ACC_GYRO_CTRL10_C, 0x3E);
  // Enable pedometer algorithm
  errorAccumulator += myIMU.writeRegister(LSM6DS3_ACC_GYRO_TAP_CFG1, 0x40);
  // Step Detector interrupt driven to INT1 pin
  errorAccumulator += myIMU.writeRegister( LSM6DS3_ACC_GYRO_INT1_CTRL, 0x10 );
  
  if( errorAccumulator )
  {
    Serial.println("Problem configuring the IMU.");
    return false;
  }
    
  Serial.println("IMU OK");
  return true;  
}
