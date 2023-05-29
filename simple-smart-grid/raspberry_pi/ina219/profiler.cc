#include <iostream>
#include <unistd.h>
#include <math.h>
#include "src/ina219.h"


int main(int argc, char *argv[])
{
    int opt;

	float SHUNT_OHMS = 0.1;
	float MAX_EXPECTED_AMPS = 3.2;
    float INITIAL_CHARGE = 15000.0;
    float INTERVAL = 1000.0;

    bool profile_enabled = false;

    while ((opt = getopt(argc, argv, ":r:a:e:t:p")) != -1)
    {
        switch (opt) {
        case 'r':
            SHUNT_OHMS = atof(optarg);
            break;
        case 'a':
            MAX_EXPECTED_AMPS = atof(optarg);
            break;
        case 'e':
            INITIAL_CHARGE = atof(optarg);
            break;
        case 't':
            INTERVAL = atof(optarg);
            break;
        case 'p':
            profile_enabled = true;
            break;
        default: /* '?' */
            fprintf(stderr, "Usage: %s [-r shunt_resistance_ohms] [-a max_expected_amps] [-e initial_charge_coulombs] [-t update_interval_millisec] [-p]\n"
            "\t -r resistance\t the resistance of the shunt resistor in Ohms\n"
            "\t -a current\t the maximum expected current in the system, in Amperes\n"
            "\t -e charge\t initial charge of the battery in Coulombs, only useful if not using -p\n"
            "\t -t interval\t the interval to pull info from the sensor in milliseconds\n"
            "\t -p\t\t profiles the battery\n"
            "Equivalent to no arguments: %s -r 0.1 -a 3.2 -e 15000 -t 1000\n",
                    argv[0]);
            return 1;
        }
    }

    if (profile_enabled)
    {
        INA219 i(SHUNT_OHMS, MAX_EXPECTED_AMPS);
        i.configure(RANGE_16V, GAIN_8_320MV, ADC_12BIT, ADC_12BIT);

        std::cout << "time_s,bus_voltage_V,supply_voltage_V,shunt_voltage_mV,current_mA,power_mW,discharged_C" << std::endl;

        int c = 0;
        while(true)
        {
            float current = i.current();
            std::cout << (roundf(c*(INTERVAL/1000.0) * 1000) / 1000) << ","
                    << (roundf(i.voltage() * 1000) / 1000) << ","
                    << (roundf(i.supply_voltage() * 100000) / 100000) << ","
                    << (roundf(i.shunt_voltage() * 100) / 100) << ","
                    << (roundf(current * 1000) / 1000) << ","
                    << (roundf(i.power() * 100) / 100) << ","
                    << (roundf( ((current/1000.0)*(INTERVAL/1000.0)) * 1000000) / 1000000) << std::endl;
            c++;
            usleep(INTERVAL * 1000);
        }
    } else {
        float remaining_charge = INITIAL_CHARGE;
        INA219 i(SHUNT_OHMS, MAX_EXPECTED_AMPS);
        i.configure(RANGE_16V, GAIN_8_320MV, ADC_12BIT, ADC_12BIT);
        std::cout << "time_s,bus_voltage_V,supply_voltage_V,shunt_voltage_mV,current_mA,power_mW,remaining_C,remaining_percentage" << std::endl;
        int c = 0;
        while(true)
        {
            float current = i.current();
            remaining_charge = remaining_charge - ( (current/1000.0) * (INTERVAL/1000.0) );
            float percentage = (100.0*remaining_charge) / INITIAL_CHARGE;
            std::cout << (roundf(c*(INTERVAL/1000.0) * 1000) / 1000) << ","
                    << (roundf(i.voltage() * 1000) / 1000) << ","
                    << (roundf(i.supply_voltage() * 100000) / 100000) << ","
                    << (roundf(i.shunt_voltage() * 100) / 100) << ","
                    << (roundf(current * 1000) / 1000) << ","
                    << (roundf(i.power() * 100) / 100) << ","
                    << (roundf(remaining_charge * 100) / 100) << ","
                    << (roundf(percentage * 10000) / 10000) << std::endl;
            c++;
            usleep(INTERVAL * 1000);
        }
    }

	return 0;
}
