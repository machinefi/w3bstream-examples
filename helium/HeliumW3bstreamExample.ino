/*
  Arduino Sketch: Helium to w3bstream Integration

  Description:
  This Arduino sketch demonstrates how to connect an Arduino Nano MKR 1310 device to the Helium network 
  and send data from Helium to w3bstream using the Helium HTTP integration. 
  The sketch initializes the LoRa modem, connects to Helium using Over-the-Air Activation (OTAA),
  and sends a message to w3bstream.

  Instructions:
  1. Update the modem firmware by running the example MKRWANFWUpdate_standalone from the MKRWAN library

  2. Obtain your device EUI
    - Upload the sketch and monitor the serial port.
    - The device id should be printed to the serial monitor.
    - Copy it, you will need it for adding your device to the Helium console in the next step.

  3. Add the device to the Helium console by following the guide at https://docs.helium.com/console/adding-devices/

  4. Replace the following variables in the sketch with the values you see in the Helium console for the device you just created:
    - appEui
    - appKey

  5. Create a w3bstream project. You can follow the guide at https://docs.w3bstream.com/applets-development/creating-the-project

  6. Register a device to your w3bstream project. You can follow the guide at https://docs.w3bstream.com/applets-development/configuring-devices

  7. Create a w3bstream API key
    - Head to w3bstream studio
    - Click on your wallet address on the top left corner -> Settings
    - Add an API key
    - Set the permissions for Event to Read/Write
    - Copy the newly generated API key, you will need to add it to he Helium HTTP integration

  8. Replace the variable deviceName with the name of your device.

  9. If you wish, you can replace the value of the message variable with your own message.

  10. Create the decoder function to decode the data we are going to send:
    - Create a Custom function in Helium console. You can follow the guide at https://docs.helium.com/console/functions
    - Copy the following code into the "Custom script" textbox:
      function Decoder(bytes, port, uplink_info) {
          const { dev, msg } = JSON.parse(String.fromCharCode(...bytes));
          return { dev, msg };
      }
  
  11. Create the HTTP integration:
    - Create a new HTTP integration in the Helium console. You can follow the guide at https://docs.helium.com/console/integrations/http.
    - Set the HTTP method to POST
    - Set the endpoint URL to the HTTP route of your w3bstream project
    - Add the following HTTP header:
      - Key: Authorization
      - Value: Bearer followed by your w3bstream API key
    - Add the following URL param:
      - Key: eventType
      - Value: DA-TA_PU-SH
    - Enter the following in **Template body**
      [{
        "device_id": "{{decoded.payload.dev}}",
        "event_type": "DEFAULT",
        "payload": "{{decoded.payload.msg}}"
      }]
  
  12. Create the Helium flow:
    - Create a new flow in the Helium console. You can follow the guide at https://docs.helium.com/console/flows/actions
    - Add your device to the flow
    - Add the decoder funtion to the flow, and link it to your device
    - Add the http integration to your flow, and link it to the decoder function
    - You should have a flow like devide->decoder->integration
  
  13. Ensure you have enough Data Credits to use the Helium network. https://docs.helium.com/tokens/data-credit/

  14. Change modem.begin(EU868) to your region if not in Europe.

  15. Upload the sketch and verify the process is working
    - Monitor the serial port for possible errors
    - Monitor the Helium debug console for device activity and optional debug information
    - Monitor the w3bstream project logs in w3bstream studio
    - You should see the message printed in the w3bstream studio logs
    - You should also see the uplink message in Helium console
*/

// ------------------------------------------------------------------------
// Uncomment the following line to enable debug of AT commands to/from the modem.
// #define LORA_DEBUG Serial
#include <MKRWAN.h>

// ------------------------------------------------------------------------
// Configuration variables. Replace the variables to suit your application and device

// App EUI - copy from Helium console
String appEui = "YOUR_APPEUI";
// App Key - copy from Helium console
String appKey = "YOUR_APPKEY";
// Device Name - copy from w3bstream studio
String deviceName = "YOUR_DEVICE_NAME";

// The message you want to send. Note that the maximum message size can be as low as 51 bytes depending on the SF.
String message = "Hello from Helium!";

// ------------------------------------------------------------------------
// Global variables
int port = 3;
bool connected = false;
LoRaModem modem(Serial1);

// ------------------------------------------------------------------------

void setup() {
  Serial.begin(115200);

  // Wait for a serial connection to be established before continuing.
  while (!Serial)
    ;

  // Initialize the modem.
  // Change EU868 to your region if not in Europe.
  if (!modem.begin(EU868)) {
    Serial.println("Failed to start module. Is your region correct?");
    while (1) {}
  };

  // Print the firmware and device EUI
  Serial.print("Your module version is: ");
  Serial.println(modem.version());
  Serial.print("Your device EUI is: ");
  Serial.println(modem.deviceEUI());

  // Connect to the network.
  while (!connected) {
    Serial.println("Connecting to Helium network");
    connected = modem.joinOTAA(appEui, appKey);
    delay(2000);
  }
  Serial.println("Connected successfully");
  
  // Build the w3bstream message
  String loraMessage = "{\"dev\":\"" + deviceName + "\",\"msg\":\"" + message + "\"}";

  // Send the uplink message
  modem.setPort(port);
  modem.beginPacket();
  modem.print(loraMessage);
  int error = modem.endPacket(true);
  if (error > 0) {
    Serial.println("Message sent!");
  } else {
    Serial.println("Error sending message. Error code: " + String(error));
  }

  Serial.println("Program finished");
}

void loop() {
  delay(1000);
}