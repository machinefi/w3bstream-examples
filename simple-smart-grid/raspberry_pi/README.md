# Raspberry Pi Smart Grid Tutorial

## Pre requisites

First, you need to download this repository. Then open a command line and change directory to the project folder:  

```bash
cd w3bstream-examples/simple-smart-grid/raspberry_pi
```

Then you need to install some packages and libraries to interact with the display and the current sensor.  
You can run the following script to ensure all the requirements are installed in your Raspberry Pi.  

```bash
./install-requirements.sh
```

You also need to create your project in w3bstream. Follow the [documentation](https://docs.w3bstream.com/get-started/w3bstream-studio) for how to create a new project in w3bstream studio.  

Once you have created your project, you need to replace the values of `publisher_token` and `publish_url` in `main.cpp` with the ones for your project. You can get the publish_url from your project settings. And you can get the publisher token for the device you have created under the devices tab.  

## Build the application

To build the application we use standard CMake. The following commands can be used to configure and build the project:  

```bash
mkdir build-out
cmake -DGIT_SUBMODULE_UPDATE=ON -S ./ -B ./build-out
cmake --build build-out --target power-meter
```

If everything builds successfully, you shoould see an executable named `power-meter` inside the `build-out` directory.  

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
