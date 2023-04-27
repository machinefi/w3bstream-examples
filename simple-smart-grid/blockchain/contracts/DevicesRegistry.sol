// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

import "./interfaces/IDevicesRegistry.sol";

contract DevicesRegistry is Ownable, IDevicesRegistry {
    event DeviceRegistered(address indexed _deviceId);

    event DeviceDeleted(address indexed _deviceId);

    event DeviceSuspended(address indexed _deviceId);

    event DeviceActivated(address indexed _deviceId);

    struct Device {
        bool isRegistered;
        bool isActive;
    }

    mapping(address => Device) public AuthorizedDevices;

    constructor() {
        console.log("Deploying DevicesRegistry contract");
    }

    modifier onlyRegisteredDevice(address _deviceId) {
        require(
            AuthorizedDevices[_deviceId].isRegistered,
            "Data Source is not registered"
        );
        _;
    }

    modifier onlyUnregisteredDevice(address _deviceId) {
        require(
            !AuthorizedDevices[_deviceId].isRegistered,
            "Data Source already registered"
        );
        _;
    }

    modifier onlyActiveDevice(address _deviceId) {
        require(
            AuthorizedDevices[_deviceId].isActive,
            "Data Source is suspended"
        );
        _;
    }

    modifier onlySuspendedDevice(address _deviceId) {
        require(!AuthorizedDevices[_deviceId].isActive, "Data Source is active");
        _;
    }

    function registerDevice(address _newDeviceId)
        public
        onlyOwner
        onlyUnregisteredDevice(_newDeviceId)
    {
        AuthorizedDevices[_newDeviceId] = Device(true, true);
        emit DeviceRegistered(_newDeviceId);
    }

    function removeDevice(address _deviceIdToRemove)
        public
        onlyOwner
        onlyRegisteredDevice(_deviceIdToRemove)
    {
        delete AuthorizedDevices[_deviceIdToRemove];
        emit DeviceDeleted(_deviceIdToRemove);
    }

    function suspendDevice(address _deviceIdToSuspend)
        public
        onlyOwner
        onlyRegisteredDevice(_deviceIdToSuspend)
        onlyActiveDevice(_deviceIdToSuspend)
    {
        AuthorizedDevices[_deviceIdToSuspend].isActive = false;
        emit DeviceSuspended(_deviceIdToSuspend);
    }

    function activateDevice(address _deviceIdToActivate)
        public
        onlyOwner
        onlyRegisteredDevice(_deviceIdToActivate)
        onlySuspendedDevice(_deviceIdToActivate)
    {
        AuthorizedDevices[_deviceIdToActivate].isActive = true;
        emit DeviceActivated(_deviceIdToActivate);
    }

    function isAuthorizedDevice(address _deviceId)
        public
        view
        override
        onlyRegisteredDevice(_deviceId)
        onlyActiveDevice(_deviceId)
        returns (bool)
    {
        return true;
    }
}

