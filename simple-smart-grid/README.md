# w3bstream-power-meter

![image](https://github.com/simonerom/w3bstream-power-meter/assets/11096047/1a9d592e-36e0-4cf1-a01f-164d7bf997ee)

# Introduction

Energy conservation and efficiency have become increasingly important in our world today, as we strive to reduce our carbon footprint and combat climate change.
With the advent of the Internet of Things (IoT) and blockchain technology, it is now possible to build smart energy grids that not only track energy usage but also incentivize energy-efficient behavior by rewarding users who tune their energy consumption based on the status of the grid.
This tutorial will guide you through the process of building a smart power meter that can send energy readings to the W3bstream network, using a Raspberry Pi.
Such device could be used in a smart grid,  whose logic is deployed on W3bstream, that collects data and implements some sort of blockchain-based incentive model for energy-efficient users.

# What you will build

By the end of this tutorial, you will:

- Learn the basics of a DePIN (Decentralized Phisycal Infrastructure) Project using W3bstream
- Create a smart energy meter device using a Raspberry Pi, an energy sensor, a power supply and some led lights
- Build and install on the Raspberry Pi the service that collects energy data from the sensor and sends them to a W3bstream project
- Build and install on the Raspberry Pi the service that shows the data on the display

By the end, you will have a fully functional power meter “demo” that tracks energy usage, and is ready to be used in W3bstream-based DePIN projects. You can find a tutorial on how to create the decentralized part of this project using w3bstream here: <https://developers.iotex.io/posts/building-an-energy-efficient-smart-grid-that-rewards-responsible-users-with-w3bstream-and-the-iotex-blockchain>

Let's get started!

# What is a DePIN project?

## Introduction to W3bstream

## The project architecture

The diagram below shows a simple architecture of a DePIN applictaion where the logic of the energy grid is deployed to the W3bstream network, the smart meters send energy readings to W3bstream, and the IoTeX blockchain is used to trigger token rewards to users according to some incentive logic.

![image](https://github.com/simonerom/w3bstream-power-meter/assets/11096047/90175b0d-b719-4f7c-993d-308626a19434)

It's worth saying that each smart meter will have its own identity stored on a blockchain to be used to authorized the device and validate the IoT data in the W3bstream logic.

# Let's start

## The IoT data

We just want the power-meter device to send real-time energy consumption to the W3bstream network: it will average the energy over a 5s window and send a data message to the W3bstream endpoint that looks like this:

```json
{  
  "data": { 
    "sensor_reading": 134.7,    
    "timestamp": 1677091161  
  },  
  "signature": "00000008000000000200000000000000ffffffe042fff...100000000000000",
  "public_key": "04abbd9bb8f6a2928d179e9f83f265f5f0a6994f8...934dd47a0cbae9d555" 
}
```

Where `sensor_reading` is the actual energy consumption averaged in 5s, and `timestamp` is the time when it was calculated. `public_key`is a unique public key generated in the device, and `signature` is the respectuve signature of the `data` nested object produced using elliptic curve cryptography (in this case, using curve secp256r1).

## The final demo device

The image below shows how my final demo device looks like:
![image](https://github.com/simonerom/w3bstream-power-meter/assets/11096047/84ed1473-c540-418c-b0d5-000432fe0140)

## The “Energy Consumption” section

For this project, I've designed a simple demo device: on one side, I put a simple circuit made of 6 LED lights that can be powered at 12V, and they can be switched on/off by means of 3 manual switches. The LED lights use ~2W of power each, and they are configured in three parallel couples, each couple is connected to one of the three switches. This circuit will simulate the energy consumption by different appliances inside an hypothetical building.
![image](https://github.com/simonerom/w3bstream-power-meter/assets/11096047/3226a6df-b31e-4cd0-8d7a-d60dcb063137)

Using switches, we can control the load across 4W, 8W and 12W. A 12V power supply is used to power the circuit and an INA219 digital power sensor is wired in series with the positive line of the power supply, to gauge the actuall power consumption of the circuit.

## The “Energy Meter” section

For the actual device, I've used a Raspberry Pi 3b, for which there is a W3bstream client SDK available that helps with some cryptography that we need. The same SDK is also available for other platforms like ESP32, and mobile devices. However, it's still in heavy development and at this moment it's providing an implementation of the PSA crypto layer.

The Raspberry Pi is connected to an ST7735-based TFT display (160x320 pixels), where I want to show the real-time power consumption and the corresponding blockchain rewards that the user will receive based on the current consumption (the lower the consumption, the more the rewards).

## The connections

The image below shows how I connected the sensor and the display to the Raspberry Pi:

<img width="1320" alt="image" src="https://github.com/simonerom/w3bstream-power-meter/assets/11096047/a65a1904-af0a-49ee-af5c-32e370152f24">

# The device firmware

On the software side, this device uses the W3bstream IoT SDK power-meter example to create a device identity in the form pf a public/private key pair that is stored on the Raspberry Pi. Unfortunately the Raspberry Pi does not provide any hardware secure element to securely generate and store private keys: once more boards will be supported by the SDK, these elements can be used to make the device identity more secure.  

## Hardware used

- Raspberry Pi. Any model should work, including the Raspberry Pi Zero W.  
- Display: [Adafruit ST7735 1.8" 160x128 display breakout](https://www.adafruit.com/product/358) . Any ST7735 based breakout board should work.  
- Current sensor: [Adafruit INA219 breakout](https://www.adafruit.com/product/904). Any INA219 based breakout board should work.  

## Configure Raspberry Pi Network

Put wpa_supplicant.conf into /boot with the content below (edit based on your real location and network settings):

```json
country=GB
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
network={
        ssid="Old_Network_SSID"
        priority=90
        psk="Password_for_OLD_network"
}
network={
        ssid="SSID_for_NEW_Network"
        priority=80
        psk="Password_for_new_network"
}
```

or, just in case, if during the development phase you are connecting to a wifi network without a password:

```json
network={
        ssid="SSID_for_NEW_Network"
        priority=80
        key_mgmt=NONE
}
```

Then start your Raspberry Pi and it should connect to your WiFi network. After that, proceed to the next steps.  

## Download the project files

Download this repository. Open a terminal and `cd` to the raspberri_pi folder.  
Then you need to install some packages and libraries to interact with the display and the current sensor.  
You can run the following script to ensure all the requirements are installed in your Raspberry Pi.  

```bash
./install-requirements.sh
```

You also need to create your project in w3bstream. Follow the [documentation](https://docs.w3bstream.com/get-started/w3bstream-studio) for how to create a new project in w3bstream studio.  

Once you have created your project, you need to replace the values of `publisher_token` and `publish_url` in `main.cpp` with the ones for your project. You can get the publish url from your project settings. And you can get the publisher token for the device you have created under the devices tab.  

## Build the application

To build the application we use standard CMake. The following commands can be used to configure and build the project:  

```bash
mkdir build-out
cmake -DGIT_SUBMODULE_UPDATE=ON -S ./ -B ./build-out
cmake --build build-out --target power-meter
```

If everything builds successfully, you should see an executable named `power-meter` inside the `build-out` directory.  

## Run the frontend (display)

The display is controlled by a Python script. You can run it using `python3 display.py`. Please note that the current reading value will not be updated unless you also run the backend.  

## Run the backend

The backend can be run with the following command:  

```bash
chmod +x build-out/power-meter
./build-out/power-meter
```  

## Install

If you want the app to automatically start when the device powers on, you can install it as a service. You can run the install script to install the app:  

```bash
./install.sh
```

Note: this part assumes that the user of the Raspberry pi is the default user (pi). If not, the storage_path needs to be changed accordingly.  

### What does the installation script do

Builds the SDK and the example.  
Creates two systemctl units (daemons):

- power-meter (backend): the main C++ script that reads the sensor and sends the data to w3bstream, as well as writing it to a file located in `/home/pi/data/power-meter/`  
- power-meter-display (frontend): the display script that reads the data from the files and displays it in the screen  

Enables the services and starts them. The services will also auto-start on power up and on failure.  

### How to check the services are running

Backend:  

```bash
sudo systemctl status power-meter
```

Frontend:  

```bash
sudo systemctl status power-meter-display
```

### How to start/stop/restart the services

Backend:  

```bash
sudo systemctl start/stop/restart power-meter
```

Frontend:  

```bash
sudo systemctl start/stop/restart power-meter-display
```

### How to enable/disable the services on startup

Backend:  

```bash
sudo systemctl enable/disable power-meter
```

Frontend:  

```bash
sudo systemctl enable/disable power-meter-display
```
