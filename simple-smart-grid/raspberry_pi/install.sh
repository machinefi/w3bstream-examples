#!/bin/bash

# Build and install the backend
mkdir ./build-out
cmake -DGIT_SUBMODULE_UPDATE=ON -S ./ -B ./build-out
cmake --build build-out --target power-meter
sudo cp build-out/power-meter /usr/local/bin/power-meter-backend
sudo cp display.py /usr/local/bin/power-meter-display

# Setup the backend daemon
sudo cp power-meter-backend.service /etc/systemd/system/power-meter.service
sudo systemctl enable power-meter.service
sudo systemctl start power-meter.service

# Setup the display daemon
cp background.jpeg /home/pi/data/power-meter/background.jpeg
sudo cp power-meter-display.service /etc/systemd/system/power-meter-display.service
sudo systemctl enable power-meter-display.service
sudo systemctl start power-meter-display.service
sudo systemctl daemon-reload
