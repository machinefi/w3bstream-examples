#!/usr/bin/env python3

import time
import subprocess
import digitalio
import board
from PIL import Image, ImageDraw, ImageFont
from adafruit_rgb_display import st7735  # pylint: disable=unused-import

# Configuration for CS and DC pins (these are PiTFT defaults):
cs_pin = digitalio.DigitalInOut(board.CE0)
dc_pin = digitalio.DigitalInOut(board.D25)
reset_pin = digitalio.DigitalInOut(board.D24)

# Config for display baudrate (default max is 24mhz):
BAUDRATE = 24000000

# Setup SPI bus using hardware SPI:
spi = board.SPI()

disp = st7735.ST7735R(spi, rotation=0,                           # 1.8" ST7735R
    cs=cs_pin,
    dc=dc_pin,
    rst=reset_pin,
    baudrate=BAUDRATE,
)

# Display the scaled background image
image = Image.open("/home/pi/data/power-meter/background.jpeg")
height = disp.height
width = disp.width
image_ratio = image.width / image.height
screen_ratio = width / height
if screen_ratio < image_ratio:
    scaled_width = image.width * height // image.height
    scaled_height = height
else:
    scaled_width = width
    scaled_height = image.height * width // image.width
image = image.resize((scaled_width, scaled_height), Image.BICUBIC)
# Crop and center the image
x = scaled_width // 2 - width // 2
y = scaled_height // 2 - height // 2
image = image.crop((x, y, x + width, y + height))
draw = ImageDraw.Draw(image)

font1 = ImageFont.truetype("/usr/share/fonts/truetype/freefont/FreeSansBold.ttf", 28)
font2 = ImageFont.truetype("/usr/share/fonts/truetype/freefont/FreeSansBold.ttf", 16)

while True:
    # Draw a black filled box to clear the text
    draw.rectangle((35, 44, 90, 70), outline="#161b27", fill="#161b27")
    draw.rectangle((35, 88, 90, 105), outline="#161b27", fill="#161b27")

    # Read the current power usage
    with open("/home/pi/data/power-meter/current_power_usage", "r") as f:
        current_power_usage = f.read()
    
    # Read the rewards rate 
    with open("/home/pi/data/power-meter/tokens_per_h", "r") as f:
        rewards_rate = f.read()

    # TODO Adding a space to the rewards rate to center it. Should just change the pixel we're writing to instead of adding a space
    rewards_rate = "  " + rewards_rate

    # Convert current power usage to float and then to string with 1 decimal places
    try:
      current_power_usage = "{:.1f}".format(float(current_power_usage))
    except:
      current_power_usage = "0"
    # If non fractional part of current_power_usage is just 1 digit then prefix with a space
    if len(current_power_usage.split(".")[0]) == 1:
        current_power_usage = " " + current_power_usage

    draw.text((35, 45), current_power_usage, font=font1, fill="#FFFFFF")
    draw.text((50, 90), rewards_rate, font=font2, fill="#00FF00")
    disp.image(image)

    time.sleep(1)
