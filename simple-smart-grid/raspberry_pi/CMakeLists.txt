cmake_minimum_required(VERSION 3.15)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

find_package(Python REQUIRED Development)

set(SOURCES 
    main.cpp
    ina219/src/ina219.cc
    keccak256/keccak256.cpp
)

add_executable(power-meter ${SOURCES})

target_include_directories(power-meter
    PRIVATE ina219/src
    PRIVATE keccak256
)

target_link_libraries(power-meter 
    PRIVATE ws_iot_sdk
    PRIVATE curl
    PRIVATE Python::Python
    PRIVATE pthread
)

# Build the SDK
add_subdirectory(web3-iot-sdk)