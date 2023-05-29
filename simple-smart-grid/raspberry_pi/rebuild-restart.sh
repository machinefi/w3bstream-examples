#!/bin/bash

BUILD_DIR=./build-out

cmake --build $BUILD_DIR --target power-meter

sudo systemctl stop power-meter

sudo cp $BUILD_DIR/power-meter /usr/local/bin/power-meter-backend
sudo cp display.py /usr/local/bin/power-meter-display

sudo systemctl enable power-meter.service
sudo systemctl start power-meter.service
