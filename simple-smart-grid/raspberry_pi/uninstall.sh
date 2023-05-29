#!/bin/bash

sudo rm -rf /home/pi/data/power-meter/
sudo systemctl stop power-meter
sudo systemctl disable power-meter
sudo rm /etc/systemd/system/power-meter.service
sudo rm /usr/local/bin/power-meter-backend
sudo systemctl stop power-meter-display
sudo systemctl disable power-meter-display
sudo rm /usr/local/bin/power-meter-display
sudo rm /etc/systemd/system/power-meter-display.service
sudo systemctl daemon-reload