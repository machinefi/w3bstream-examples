/**
 * @file main.cpp
 * @author IoTeX
 * @brief  The w3bstream example,refer to https://github.com/iotexproject/w3bstream
 * @version 0.1
 * @date 2022-10-19
 *
 * @copyright Copyright (c) 2022
 *
 */
#include <Arduino.h>
#include <Arduino_JSON.h>
#include <HTTPClient.h>
#include <NTPClient.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiUdp.h>

using namespace std;
// Config
const char SSID[] = "<YOUR_WIFISSID>";
const char PASSWORD[] = "<YOUR_WIFI_PASSWORD>";
IPAddress W3BSTREAM_SERVER_IP(<YOUR, SERVER, IP, ADDRESS>);

String event_type = "2147483647";
String pub_id = "<YOUR_PUB_ID>";
String token = "<YOUR_TOKEN>";
String project_name = "<YOUR_PROJECT_NAME>";
int WIO_KEY_A = 35; // GPIO35
// Config
String srv_applet_mgr_event_uri =
    "http://" + W3BSTREAM_SERVER_IP.toString() + ":8888/srv-applet-mgr/v0/event/" + project_name;
unsigned long lastMillis = 0;

WiFiClient net;
HTTPClient http;
WiFiUDP ntpUDP;
PubSubClient client(net);
NTPClient timeClient(ntpUDP);

/*
   payload json
   {
        "header" : {
            "event_type" : 2147483647,
            "pub_id" : "",
            "pub_time" : 1666087623393,
            "token" : ""
        },
       "payload" : "payload_to_wasm_instance"
    }*/

JSONVar getPayloadJSON()
{
    JSONVar payload_json;
    JSONVar header_json;
    JSONVar payload_to_wasm_instance;
    header_json["event_type"] = event_type.toInt();
    // Temporarily remove publisher authentication
    //  header_json["pub_id"] = pub_id;
    //  header_json["pub_time"] = timeClient.getEpochTime();
    //  header_json["token"] = token;
    payload_to_wasm_instance["Connections"] = 395;
    payload_to_wasm_instance["Account"] = "610CBDa6f0037B4141A5B949f56479106BeCb1E9";
    payload_json["payload"] = JSON.stringify(payload_to_wasm_instance);
    payload_json["header"] = header_json;
    return payload_json;
}

void connect()
{
    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print(".");
        delay(1000);
    }
}

void reconnect()
{
    while (!client.connected())
    {
        Serial.print("Attempting MQTT connection...");
        String clientId = "ESP32-";
        clientId += String(random(0xffff), HEX);
        if (client.connect(clientId.c_str()))
        {
            Serial.println("connected mqtt");
        }
        else
        {
            Serial.print("failed connect mqtt, rc=");
            Serial.print(client.state());
            Serial.println("try again in 5 seconds");
            delay(5000);
        }
    }
}

void setup()
{
    Serial.begin(115200);
    pinMode(WIO_KEY_A, INPUT_PULLUP);
    Serial.print("checking wifi...");
    WiFi.begin(SSID, PASSWORD);
    client.setServer(W3BSTREAM_SERVER_IP, 1883);
    connect();
    Serial.println("\nconnected!");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
    timeClient.begin();
}

void send_event_w3bstream_http()
{
    http.addHeader("Content-Type", "application/json");
    http.begin(srv_applet_mgr_event_uri);
    int httpCode = http.POST(JSON.stringify(getPayloadJSON()));
    if (httpCode > 0)
    {
        String resBuff = http.getString();
        Serial.println(resBuff);
    }
    else
    {
        Serial.printf("Error: %s\n", http.errorToString(httpCode).c_str());
    }
}

void send_event_w3bstream_mqtt()
{
    String jsonString = JSON.stringify(getPayloadJSON());
    int str_len = jsonString.length() + 1;
    char char_array[str_len];
    jsonString.toCharArray(char_array, str_len);
    Serial.printf(char_array);
    // the project name is the topic
    client.beginPublish(project_name.c_str(), str_len - 1, false);
    for (int i = 0; i < str_len; i++)
    {
        if (char_array[i] != 0)
        {
            client.print(char_array[i]);
        }
    }
    client.endPublish();
}

void loop()
{
    timeClient.update();
    if (!client.connected())
    {
        reconnect();
    }
    client.loop();
    if (digitalRead(WIO_KEY_A) == HIGH)
    {
        Serial.printf("Key Press");
        send_event_w3bstream_mqtt();
        // send_event_w3bstream_http();
    };
    delay(500);
}
