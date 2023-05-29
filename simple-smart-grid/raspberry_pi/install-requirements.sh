#!/bin/bash

# Download the web3-iot-sdk
git clone https://github.com/machinefi/web3-iot-sdk.git web3-iot-sdk

# Install required packages
sudo apt-get install -y python3-pip build-essential cmake libcurl4-openssl-dev fontconfig-config fonts-freefont-ttf

# Install requirements
sudo pip3 install -r ./requirements.txt

# Create required files
mkdir -p /home/pi/data/power-meter/
touch /home/pi/data/power-meter/current_power_usage
touch /home/pi/data/power-meter/avg_power_usage
touch /home/pi/data/power-meter/wallet_addres
touch /home/pi/data/power-meter/total_rewards
touch /home/pi/data/power-meter/last_interval_time
touch /home/pi/data/power-meter/tokens_per_h
touch /home/pi/data/power-meter/device_id
touch /home/pi/data/power-meter/status

# Install blinka
wget https://raw.githubusercontent.com/adafruit/Raspberry-Pi-Installer-Scripts/master/raspi-blinka.py
sudo pip3 install adafruit-python-shell
python3 raspi-blinka.py 
rm -rf raspi-blinka.py 

# Notify the user the installation has finished
echo "Installation finished. Please reboot the device."
