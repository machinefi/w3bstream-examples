#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sstream>
#include <cstdio>
#include <iomanip>
#include <fcntl.h>
#include <unistd.h>
#include <time.h>
#include <string>
#include <algorithm>
#include <iostream>
#define _BSD_SOURCE
#include <sys/time.h>
#include <thread>
#include <curl/curl.h>
#include <Python.h>
#include <fstream>
#include "base64.hpp"
#include "keccak256.hpp"
using namespace base64;

// #define ENABLE_INA219
#ifdef ENABLE_INA219
	#include "ina219.h"
#endif

// Include the main header for the W3bstream IoT SDK.
#include "psa/crypto.h"




// Custom types.
enum ResultCode
{
	SUCCESS,
	ERROR,
	ERR_HTTP,
	ERR_CURL,
	ERR_FILE_READ,
	ERR_PSA,
};




// User configuration and constants.
namespace
{
	// Connection details
 	std::string publisher_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJQYXlsb2FkIjoiOTAyNzM3MTkwNjYwNTA2MyIsImlzcyI6InczYnN0cmVhbSJ9.6LpnGIvkghTxOExdo4HLQDTFhhf5bXBLHiBtKJYkhIM";
	std::string publish_url = "https://devnet-staging-api.w3bstream.com/srv-applet-mgr/v0/event/eth_0xf488835ae09314f5c5a0216ddb0968aa79113c03_test";

    // Key store details.
	std::string keystore_path = "/home/pi/data/power-meter/";
	std::string private_key_path = keystore_path + "private.key";
	std::string public_key_path = keystore_path + "public.key";

	// Constants.
	const size_t send_update_frequency_s = 30;
	const size_t period_s = 30;
	const size_t private_key_size = 32;
	const size_t private_key_size_bits = private_key_size*8;
	const size_t public_key_size = 65;
	const size_t data_buffer_size = 500;
	const size_t sample_interval_ms = 500;
	const int32_t sensor_conversion_time_ms = 68;	// Assuming ADC_128SAMP, which takes 68ms

	// Variables to hold global state, etc.
	std::string wallet_address = "";
	psa_key_id_t key_id;
    std::string device_id = "";
	volatile double power_wh_avg = 0;
	volatile size_t power_wh_samples = 0;

	#ifdef ENABLE_INA219
		float ina219_shunt_ohms = 0.004;
		float ina219_max_expected_amps = 20;
		INA219 ina(ina219_shunt_ohms, ina219_max_expected_amps);
	#endif

	// Data storage.
	std::string base_path = "/Users/Santos/Documents/2-Code/Iotex/machinefi-projects/w3bstream-iot-sdk/build/Debug/MbedTLS/examples/power-meter";
	std::string current_power_path = base_path + "current_power_usage";
	std::string avg_power_path = base_path + "avg_power_usage";
	std::string wallet_address_path = base_path + "wallet_address";
	std::string total_rewards_path = base_path + "total_rewards";
	std::string last_interval_time_path = base_path + "last_interval_time";
	std::string rewards_rate_path = base_path + "tokens_per_h";
	std::string device_id_path = base_path + "device_id";
	std::string status_path = base_path + "status";
}

// Function definitions.
static ResultCode sign_message(psa_key_id_t key_id, const uint8_t msg[], size_t msg_size, uint8_t buf[], size_t buf_size, size_t* signature_len)
{    
    psa_status_t status = psa_sign_message(key_id, PSA_ALG_ECDSA(PSA_ALG_SHA_256), msg, msg_size, buf, buf_size, signature_len);
    if (status != PSA_SUCCESS)
	{
		std::cout << "Failed to sign message: " << status << std::endl;
		return ResultCode::ERR_PSA;
	}
        
    status = psa_verify_message(key_id, PSA_ALG_ECDSA(PSA_ALG_SHA_256), msg, msg_size, buf, *signature_len);
    if (status != PSA_SUCCESS)
	{
		std::cout << "Failed to sign message: " << status << std::endl;
		return ResultCode::ERR_PSA;
	}
	return ResultCode::SUCCESS;
}

static ResultCode generate_key(const char* key_path, const char* public_key_path)
{
	std::cout << "Generating a new key."  << std::endl;

	psa_key_attributes_t attributes = PSA_KEY_ATTRIBUTES_INIT;
	psa_set_key_usage_flags(&attributes, PSA_KEY_USAGE_SIGN_HASH | PSA_KEY_USAGE_VERIFY_HASH | PSA_KEY_USAGE_EXPORT);
	psa_set_key_algorithm(&attributes, PSA_ALG_ECDSA(PSA_ALG_SHA_256));
	psa_set_key_type(&attributes, PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_SECP_K1));
	psa_set_key_bits(&attributes, private_key_size_bits);
	auto status = psa_generate_key(&attributes, &key_id);
	if (status != PSA_SUCCESS)
	{
		std::cerr << "Failed to generate key: " << status << std::endl;
		return ResultCode::ERR_PSA;	
	}

	// Export the private key from the PSA API slot and save it to a file.
	static uint8_t exported_private_key[PSA_KEY_EXPORT_ECC_KEY_PAIR_MAX_SIZE(private_key_size_bits)] = {0};
	size_t exported_private_key_len = 0;
	status = psa_export_key(key_id, exported_private_key, sizeof(exported_private_key), &exported_private_key_len);
	if (status != PSA_SUCCESS)
	{
		std::cerr << "Failed to export private key: " << status << std::endl;
		return ResultCode::ERR_PSA;	
	}
	std::cout << "Exported private key: ";
	for (int i = 0; i < exported_private_key_len; i++) { printf("%x", exported_private_key[i]); }
	std::cout << std::endl;
	std::cout << "Saving private key to " << private_key_path  << std::endl;
	int fd = open(private_key_path.c_str(), O_RDWR | O_CREAT,0600);
	if(fd == -1)
	{
		std::cout << "Failed to open private key file: " << private_key_path << std::endl;
		return ResultCode::ERR_FILE_READ;
	}
	write(fd, exported_private_key, exported_private_key_len);
	close(fd);

	// Export the public key from the PSA API slot and save it to a file.
	uint8_t exported_public_key[public_key_size] = {0};
	size_t exported_public_key_len = 0;
	status = psa_export_public_key(key_id, exported_public_key, sizeof(exported_public_key), &exported_public_key_len);
	if (status != PSA_SUCCESS)
	{
		std::cerr << "Failed to export public key: " << status << std::endl;
		return ResultCode::ERR_PSA;	
	}
	std::cout << "Exported public key: ";
	for (int i = 0; i < exported_public_key_len; i++) { printf("%x", exported_public_key[i]); }
	std::cout << std::endl;
	std::cout << "Saving private key to " << public_key_path  << std::endl;
	fd = open(public_key_path, O_RDWR | O_CREAT,0600);
	if(fd == -1)
	{
		std::cout << "Failed to open public key file: " << public_key_path << std::endl;
		return ResultCode::ERR_FILE_READ;
	}
	write(fd, exported_public_key, exported_public_key_len);
	close(fd);

	std::cout << "Key generated successfully." << std::endl;
	return ResultCode::SUCCESS;
}

static ResultCode import_key(const char* key_path, const char* public_key_path, psa_key_id_t* key_id)
{
	int fd = open(key_path, O_RDWR);
	if(fd == -1)
	{
		ResultCode res = generate_key(key_path, public_key_path);
		if (res != ResultCode::SUCCESS)
		{
			return res;
		}

		fd = open(key_path, O_RDWR);
		if(fd == -1)
		{
			std::cout << "Failed to open key file: " << key_path << std::endl;
			return ResultCode::ERR_FILE_READ;
		}
	}

	// Import the key from the file into the PSA API slot.
	uint8_t exported_private_key[private_key_size] = {0};
	size_t exported_private_key_size = read(fd, exported_private_key, 32);
	psa_key_attributes_t attributes = PSA_KEY_ATTRIBUTES_INIT;
	psa_set_key_usage_flags(&attributes, PSA_KEY_USAGE_SIGN_HASH | PSA_KEY_USAGE_VERIFY_HASH);
	psa_set_key_algorithm(&attributes, PSA_ALG_ECDSA(PSA_ALG_SHA_256));
	psa_set_key_type(&attributes, PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_SECP_K1));
	psa_set_key_bits(&attributes, private_key_size_bits);
	psa_status_t status = psa_import_key(&attributes, exported_private_key, exported_private_key_size, key_id);
	if (status != PSA_SUCCESS)
	{
		std::cout << "Failed to import key: " << status << std::endl;
		return ResultCode::ERR_PSA;
	}

	return ResultCode::SUCCESS;
}

static ResultCode generate_device_id(const char* public_key_file, std::string& device_id)
{
	int fd = open(public_key_file, O_RDONLY);
	if(fd == -1)
	{
		device_id = "";
		std::cerr << "Failed open file " << public_key_file << std::endl;
		return ResultCode::ERR_FILE_READ;
	}
	uint8_t public_key[public_key_size] = {0};
	size_t read_bytes = read(fd, public_key, public_key_size);
	if(read_bytes != public_key_size)
	{
		std::cerr << "Failed to read publick key from " << public_key_file << ". File has wrong format." << std::endl;
		return ResultCode::ERR_FILE_READ;
	}

    // Return the public key as a hex string
    // std::stringstream ss;
    // for (int i = 0; i < public_key_size; i++)
    // {
    //     ss << std::hex << std::setw(2) << std::setfill('0') << (int)public_key[i];
    // }
    // device_id = ss.str();
	
	// The device address is the hex string representation of the last 20 
	// bytes of the keccak256 hash of the public key.
	uint8_t hash[32] = {0};
	Keccak256::getHash(public_key+1, public_key_size-1, hash);
	device_id = "0x";
	for (int i=0; i<20; i++)
	{
		char buf[3] = {0};
		sprintf(buf, "%02x", hash[32-20+i]);
		device_id += buf;
	}

    return ResultCode::SUCCESS;
}

std::string get_time_str()
{
	time_t now = time(0);
	struct tm tstruct;
	char buf[80];
	tstruct = *localtime(&now);
	strftime(buf, sizeof(buf), "%X", &tstruct);
	return buf;
}

/**
 * @brief Publish a message to the network using a POST HTTP request using curl 
 * 
 * @param message 
 * @return ResultCode 
 */
ResultCode publish_message(std::string url, std::string message)
{
	std::cout << get_time_str() << ": Publishing message: " << message << std::endl <<" to " << url << std::endl;
    CURL *curl;
    CURLcode res;
    curl = curl_easy_init();
    if(curl) {
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, message.c_str());
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
		headers = curl_slist_append(headers, ("Authorization: Bearer " + publisher_token).c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_USE_SSL, (long)CURLUSESSL_TRY);
        res = curl_easy_perform(curl);
        if(res != CURLE_OK)
        {
            std::cerr << "Failed to publish message: " << curl_easy_strerror(res) << std::endl;
            return ResultCode::ERR_HTTP;
        }
        curl_easy_cleanup(curl);
    }
    else
    {
        std::cerr << "Failed to initialize curl" << std::endl;
        return ResultCode::ERR_CURL;
    }
	std::cout << std::endl;
    return ResultCode::SUCCESS;
}

/**
 * @brief 
 * Create a payload object with the following format
 * {
 *      "data" :
 *      {
 *        "sensor_reading" : <string>,
 *        "timestamp" : <string>,
 *      },
 *      "signature" : <string>,
 *      "public_key" : <string>
 * }
 * 
 * @return std::string the payload encoded as a base64 string
 */
std::string create_payload(double sensor_value)
{
	// Convert sensor_value to a string with 2 decimal places
	std::stringstream ss;
	ss << std::fixed << std::setprecision(2) << sensor_value;
	std::string sensor_value_str = ss.str();

    std::string payload = "{";
    std::string data = "";
    std::string signature = "";
    data = "{";
	data += "\"sensor_reading\":" + sensor_value_str;
    data += ",\"timestamp\":" + std::to_string(time(NULL));
    data += "}";

    // Sign the data
    uint8_t buf[64] = {0};
    size_t signature_length = 0;
    ResultCode result = sign_message(key_id, (const uint8_t*)data.c_str(), data.length(), buf, sizeof(buf), &signature_length);
    if(result != ResultCode::SUCCESS)
    {
        std::cerr << "Failed to sign data" << std::endl;
        return "";
    }
    // Convert the signature to a hex string
	ss.str(std::string());
    for (int i = 0; i < signature_length; i++)
    {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)buf[i];
    }
    signature = ss.str();

    payload += "\"data\":" + data + ",";
    payload += "\"signature\": \"" + signature + "\",";
    payload += "\"public_key\":\"" + device_id + "\"";
    payload += "}";

	return payload;
}

void initialize_ina219()
{
	#ifdef ENABLE_INA219
		ina.configure(RANGE_16V, GAIN_8_320MV, ADC_128SAMP, ADC_128SAMP);
	#endif // ENABLE_INA219
}

double read_power_w()
{
	#ifdef ENABLE_INA219
		return ina.power() / 1000.0;
	#else
		return 0;
	#endif // ENABLE_INA219
}

/**
 * @brief the thread entry point that reads the sensor value and writes the data to the filesystem
 * 
 * @return void* 
 */
void* sensor_thread_func()
{
	initialize_ina219();
	static uint64_t last_period_epoch = time(NULL);;
	
	// Start a loop that reads the sensor value every sample_interval_ms
	while(true)
	{
		// Read the sensor value
		double instant_power = read_power_w();
		uint64_t period_ms = period_s * 1000;

		// Write the value to current_power_path overwriting any existent content
		std::ofstream current_power_file(current_power_path);
		current_power_file << instant_power;
		current_power_file.close();

		// Calculate the power_wh_avg value
		power_wh_avg = (power_wh_avg * power_wh_samples + instant_power) / (power_wh_samples + 1);
		power_wh_samples++;

		uint64_t current_epoch = time(NULL);
		// If period_ms has passed since the last_period_epoch, calculate a new power_wh_avg value
		if (current_epoch - last_period_epoch > period_s)
		{
			// Reset samples counter
			power_wh_samples = 1;
			power_wh_avg = instant_power;

			// Write the value to avg_power_path overwriting any existent content
			std::ofstream power_wh_avg_file(avg_power_path);
			power_wh_avg_file << power_wh_avg;
			power_wh_avg_file.close();

			// Print that we have calculated a new average power value with the current time in hh:mm:ss
			std::cout << "Calculated new average power value at " << get_time_str() << std::endl;

			// Write the reward/h rate based on the avg_power value:
			int reward_rate = 0;
			if (power_wh_avg < 3)
			{
				reward_rate = 10;
			}
			else if (power_wh_avg < 5)
			{
				reward_rate = 4;
			}
			else
			{
				reward_rate = 0;
			}

			// Write the reward rate to reward_rate_path overwriting any existent content
			std::ofstream reward_rate_file(rewards_rate_path);
			reward_rate_file << reward_rate;
			reward_rate_file.close();

			// Write the current epoch to last_interval_time overweitring any existent content
			std::ofstream last_interval_time_file(last_interval_time_path);
			last_interval_time_file << time(NULL);
			last_interval_time_file.close();

			last_period_epoch = current_epoch;
		}

		// Sleep for sample_interval_ms ms
		usleep((sample_interval_ms - sensor_conversion_time_ms)* 1000);
	}
}

int main(int argc, char* argv[])
{
	bool erase_prevoius_keys = false;

	// Parse the command line args.
    for (int i = 1; i < argc; i++)
	{
        std::string arg = argv[i];
        if (arg == "-keystore_path" && i + 1 < argc)
		{
            keystore_path = argv[++i];
        }
        if (arg == "-generate_key")
		{
			erase_prevoius_keys = true;
        }
    }

	char current_path[FILENAME_MAX];
	getcwd(current_path, sizeof(current_path));

	// Set the path to the keys.
	if (keystore_path == "")
	{
		// Use the current path if none was specified.
		keystore_path = current_path;
	}
    private_key_path = keystore_path + "/private.key";
	public_key_path = keystore_path + "/public.key";

	if (erase_prevoius_keys)
	{
		remove(private_key_path.c_str());
		remove(public_key_path.c_str());
	}

	// Initialize PSA Crypto.
    psa_status_t status = psa_crypto_init();
    if (status != PSA_SUCCESS)
	{
        std::cerr << "Failed to initialize PSA crypto library: " << status << std::endl;
        return (-1);
    }

	// Import the key if existent or generate a new key.
	ResultCode res = import_key(private_key_path.c_str(), public_key_path.c_str(), &key_id);
	if (res != ResultCode::SUCCESS)
	{
		std::cerr << "Failed to import key. " << std::endl;
		return 1;
	}

    // Generate the device address from the key.
	res = generate_device_id(public_key_path.c_str(), device_id);
	if (res != ResultCode::SUCCESS)
	{
		std::cerr << "Failed to generate devie id. " << std::endl;
		return 1;
	}

	// Write the device id to the file overwriting any existent content.
	std::ofstream device_id_file(device_id_path);
	if (!device_id_file.is_open())
	{
		std::cerr << "Failed to open device id file: " << device_id_path << std::endl;
		return 1;
	}
	device_id_file << device_id;
	device_id_file.close();
	
	// Start a new thread that will read power from the sensor every 100ms and accumulate it.
	std::thread sensor_thread(sensor_thread_func);

	// Main loop. Which does the following:
	// 	- Read the current sensor.
	// 	- Publish a message with the sensor reading
	while (true)
	{
		uint64_t last_update_time = time(NULL);
		// Read the sensor.
        double sensor_value = power_wh_avg; 
        std::string message = create_payload(sensor_value);

        res = publish_message(publish_url, message);
        if (res != ResultCode::SUCCESS)
        {
            std::cerr << "Failed to publish message. " << std::endl;

			std::ofstream status_file(status_path);
			status_file << "Failed to publish";
			status_file.close();

            // return 1;
        }

		else
		{
			std::ofstream status_file(status_path);
			status_file << "Success";
			status_file.close();
		}
		
		while(time(NULL) - last_update_time < send_update_frequency_s)
		{
			std::this_thread::sleep_for(std::chrono::seconds(1));
		}
	}
}
