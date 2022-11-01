# Click to earn

First, there will be a trusted data source, which can be an esp32 monolithic microcomputer or any device in the physical world. In this example, the W3BStream ERC20's reward is obtained by pressing a button in esp32, and then wasm Mini Program will receive the data sent by the device. After the user clicks the button five times, it will proactively add the W3BStream ERC20 token from the iotex test network to the account you set up. The following are comments in the code.

# Hardware
In this case, we used the esp32 pico D4 development board, you can use any motherboard developed based on C++ or arduino to refer to the code in the case.

You can refer to the schematic of the esp32 development board.

![image](https://user-images.githubusercontent.com/35157091/198531451-60b283fe-5eb9-4bed-ba66-7d4ac28dd926.png)

For any hardware information, you can also visit [espressif](https://www.espressif.com/en/home) website for more details.

# Software

In this case, we used embedded development platform [PlatformIO](https://platformio.org/) to develope the project.

You can refer to [PlatformIO documentation](https://docs.platformio.org/en/latest/) for more details.

# Get Start
If you have installed the vscode plug-in for `PlatformIO`, you will see its icon on the left, which means we can officially start the project.

This is PlatformIO vscode extension url [PlatformIO IDE](https://marketplace.visualstudio.com/items?itemName=platformio.platformio-ide)

![image](https://user-images.githubusercontent.com/35157091/198536059-9b8256a4-d9bc-4d4d-b3df-c760a87549cb.png)

Then you can configure your project in `main.cpp`

> It should be noted that `pub_id` and `token` are to be obtained from the front-end management page of w3bstream http://localhost:3000. In order to facilitate our debugging, token authentication has been turned off in the code.


![image](https://user-images.githubusercontent.com/35157091/198537856-317bc2a0-0e40-412e-8859-c156a41771f6.png)

When you connect your development board through usb and set up the COM port, you can compile and upload programs to the development board.
> It should be noted that the `WIO_KEY_A` is your button gpio, The gpio port will be pulled up internally in the program.You need to set this gpio port.And in esp32 some gpio ports have been used internally. It is not recommended that you set them to the following GPIO ports. 
``` bash
GPIO 6 (SCK/CLK)
GPIO 7 (SDO/SD0)
GPIO 8 (SDI/SD1)
GPIO 9 (SHD/SD2)
GPIO 10 (SWP/SD3)
GPIO 11 (CSC/CMD)
```

After the program is running properly, the w3bstream docker log console will receive these messages after you press the button five times

## Receive data
Refer to [README.md](/device-proof/README.md#receive-data)
