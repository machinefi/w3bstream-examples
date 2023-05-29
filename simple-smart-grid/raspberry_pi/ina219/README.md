# Raspberry Pi C++ Library for Voltage and Current Sensors Using the INA219

*This is a C++ version of the Python library for the same sensor, that can be found [HERE](https://github.com/chrisb2/pi_ina219).*




This C++ library supports the [INA219](http://www.ti.com/lit/ds/symlink/ina219.pdf) voltage, current and power monitor sensor from Texas Instruments. The intent of the library is to make it easy to use the quite complex functionality of this sensor.  

The library currently only supports _continuous_ reads of voltage and power, but not _triggered_ reads.

The library supports the detection of _overflow_ in the current/power calculations which results in meaningless values for these readings.

The low power mode of the INA219 is supported, so if only occasional reads are being made in a battery based system, current consumption can be minimized.

## Installation and Build

Build:

```shell
git clone https://github.com/regisin/ina219.git
cd ina219
make
```

Running examples after compiling:

```shell
cd ina219
./build/profiler --help
```

## Usage

The address of the sensor unless otherwise specified is the default of _0x40_.

Note that the bus voltage is that on the load side of the shunt resister, if you want the voltage on the supply side then you should add the bus voltage and shunt voltage together, or use the *supply_voltage()* function.

```cpp
#include <iostream>
#include <unistd.h>
#include "src/ina219.h"

int main(int argc, char *argv[])
{
    float SHUNT_OHMS = 0.1;
    float MAX_EXPECTED_AMPS = 3.2;
    
    INA219 i(SHUNT_OHMS, MAX_EXPECTED_AMPS);
    i.configure(RANGE_16V, GAIN_8_320MV, ADC_12BIT, ADC_12BIT);

    std::cout << "time_s,bus_voltage_V,supply_voltage_V,shunt_voltage_mV,current_mA,power_mW" << std::endl;

    int c = 0;
    while(c < 5)
    {
        std::cout << c << ","
                    << i.voltage() << ","
                    << i.supply_voltage() << ","
                    << i.shunt_voltage() << ","
                    << i.current() << ","
                    << i.power() << std::endl;
            c++;
            usleep(1000000); // 1s
        }
    }
    return 0;
}
```

### Profiler tool

We provide a tool that exemplifies the usage of the ina219 class. The original `python` library features the AUTO-GAIN capability. However, in this `c++` version it is not yet available.

The profiler tool can be used to characterize the battery. For example, to implement a [Coulomb counter](https://en.wikipedia.org/wiki/State_of_charge) algorithm.

With the battery fully charged, run:

```cpp
./build/profiler -p

//or, if you want to adjust the parameters based on your system setup, see the usage

./build/profiler --help
```
This command outputs all INA219 information. You can use `./build/profiler -p >> log.txt` to output to a file and run the script until the battery runs out. The, using, the log created, we can define an initial state for the battery (when fully charged) by summing the coulombs (`Q=I*t`) from each row.

After getting the initial state, you can get the current state of charge by running this command as soon as the system boots:

```cpp
/build/profiler -e INITIAL_CHARGE >> state.txt
```

The profiler will descrease the initial charge (assuming 100% charged) every second. It will save the output to the `state.txt` file. The last lines of the file should show a percent value close to `0` if the executed properly (charging the battery to 100%, executing  script as soon as booted, etc).

### Sensor Address

The sensor address may be altered as follows:

```cpp
INA219 i(SHUNT_OHMS, MAX_EXPECTED_AMPS, 0x41);
```

### Low Power Mode

The sensor may be put in low power mode between reads as follows:

```cpp
i.configure(RANGE_16V, GAIN_8_320MW, ADC_12BIT, ADC_12BIT);
while (True)
{
    std::cout << "Bus voltage: " << i.voltage() << " V" << std::endl;
    i.sleep();
    sleep(60);
    i.wake();
}
```

Note that if you do not wake the device after sleeping, the value returned from a read will be the previous value taken before sleeping.

## Functions

* `INA219()` constructs the class.
The arguments, are:
    * shunt_ohms: The value of the shunt resistor in Ohms (mandatory).
    * max_expected_amps: The maximum expected current in Amps (mandatory). **Device only supports up to 3.2A.**
    * address: The I2C address of the INA219, defaults to **0x40** (optional).
* `configure()` configures and calibrates how the INA219 will take measurements.
The arguments, which are all mandatory, are:
    * voltage_range: The full scale voltage range, this is either 16V or 32V, 
    represented by one of the following constants (mandatory).
        * RANGE_16V: Range zero to 16 volts
        * RANGE_32V: Range zero to 32 volts. **Device only supports up to 26V.**
    * gain: The gain, which controls the maximum range of the shunt voltage, 
        represented by one of the following constants (mandatory). 
        * GAIN_1_40MV: Maximum shunt voltage 40mV
        * GAIN_2_80MV: Maximum shunt voltage 80mV
        * GAIN_4_160MV: Maximum shunt voltage 160mV
        * GAIN_8_320MV: Maximum shunt voltage 320mV
        * GAIN_AUTO: Automatically calculate the gain (**NOT IMPLEMENTED YET**)
    * bus_adc: The bus ADC resolution (9, 10, 11, or 12-bit), or
        set the number of samples used when averaging results, represented by
        one of the following constants (mandatory).
        * ADC_9BIT: 9 bit, conversion time 84us.
        * ADC_10BIT: 10 bit, conversion time 148us.
        * ADC_11BIT: 11 bit, conversion time 276us.
        * ADC_12BIT: 12 bit, conversion time 532us.
        * ADC_2SAMP: 2 samples at 12 bit, conversion time 1.06ms.
        * ADC_4SAMP: 4 samples at 12 bit, conversion time 2.13ms.
        * ADC_8SAMP: 8 samples at 12 bit, conversion time 4.26ms.
        * ADC_16SAMP: 16 samples at 12 bit, conversion time 8.51ms
        * ADC_32SAMP: 32 samples at 12 bit, conversion time 17.02ms.
        * ADC_64SAMP: 64 samples at 12 bit, conversion time 34.05ms.
        * ADC_128SAMP: 128 samples at 12 bit, conversion time 68.10ms.
    * shunt_adc: The shunt ADC resolution (9, 10, 11, or 12-bit), or
        set the number of samples used when averaging results, represented by
        one of the following constants (mandatory).
        * ADC_9BIT: 9 bit, conversion time 84us.
        * ADC_10BIT: 10 bit, conversion time 148us.
        * ADC_11BIT: 11 bit, conversion time 276us.
        * ADC_12BIT: 12 bit, conversion time 532us.
        * ADC_2SAMP: 2 samples at 12 bit, conversion time 1.06ms.
        * ADC_4SAMP: 4 samples at 12 bit, conversion time 2.13ms.
        * ADC_8SAMP: 8 samples at 12 bit, conversion time 4.26ms.
        * ADC_16SAMP: 16 samples at 12 bit, conversion time 8.51ms
        * ADC_32SAMP: 32 samples at 12 bit, conversion time 17.02ms.
        * ADC_64SAMP: 64 samples at 12 bit, conversion time 34.05ms.
        * ADC_128SAMP: 128 samples at 12 bit, conversion time 68.10ms.
* `voltage()` Returns the bus voltage in volts (V).
* `supply_voltage()` Returns the supply voltage in volts (V). This is the sum of the bus voltage and shunt voltage.
* `shunt_voltage()` Returns the shunt voltage in millivolts (mV).
* `current()` Returns the bus current in milliamps (mA).
* `power()` Returns the bus power consumption in milliwatts (mW).
* `sleep()` Put the INA219 into power down mode.
* `wake()` Wake the INA219 from power down mode.
* `reset()` Reset the INA219 to its default configuration.

## Performance

TO-DO.

## Debugging

TO-DO.

## Testing

TO-DO.

## Coding Standard

TO-DO.
