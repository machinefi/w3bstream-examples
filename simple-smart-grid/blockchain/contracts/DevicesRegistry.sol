// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IDevicesRegistry.sol";

contract DevicesRegistry is Ownable, IDevicesRegistry {
   
    event DeviceRegistered(deviceidtype indexed _deviceId);
    event DeviceDeleted(deviceidtype indexed _deviceId);
    event DeviceSuspended(deviceidtype indexed _deviceId);
    event DeviceActivated(deviceidtype indexed _deviceId);

    struct Device {
        bool isRegistered;
        bool isActive;
    }

    mapping(deviceidtype => Device) public AuthorizedDevices;

    constructor() { }

    modifier onlyRegisteredDevice(deviceidtype _deviceId) {
        require(
            AuthorizedDevices[_deviceId].isRegistered,
            "Data Source is not registered"
        );
        _;
    }

    modifier onlyUnregisteredDevice(deviceidtype _deviceId) {
        require(
            !AuthorizedDevices[_deviceId].isRegistered,
            "Data Source already registered"
        );
        _;
    }

    modifier onlyActiveDevice(deviceidtype _deviceId) {
        require(
            AuthorizedDevices[_deviceId].isActive,
            "Data Source is suspended"
        );
        _;
    }

    modifier onlySuspendedDevice(deviceidtype _deviceId) {
        require(!AuthorizedDevices[_deviceId].isActive, "Data Source is active");
        _;
    }

    function registerDevice(deviceidtype _newDeviceId)
        public
        onlyOwner
        onlyUnregisteredDevice(_newDeviceId)
    {
        AuthorizedDevices[_newDeviceId] = Device(true, true);
        emit DeviceRegistered(_newDeviceId);
    }

    function removeDevice(deviceidtype _deviceIdToRemove)
        public
        onlyOwner
        onlyRegisteredDevice(_deviceIdToRemove)
    {
        delete AuthorizedDevices[_deviceIdToRemove];
        emit DeviceDeleted(_deviceIdToRemove);
    }

    function suspendDevice(deviceidtype _deviceIdToSuspend)
        public
        onlyOwner
        onlyRegisteredDevice(_deviceIdToSuspend)
        onlyActiveDevice(_deviceIdToSuspend)
    {
        AuthorizedDevices[_deviceIdToSuspend].isActive = false;
        emit DeviceSuspended(_deviceIdToSuspend);
    }

    function activateDevice(deviceidtype _deviceIdToActivate)
        public
        onlyOwner
        onlyRegisteredDevice(_deviceIdToActivate)
        onlySuspendedDevice(_deviceIdToActivate)
    {
        AuthorizedDevices[_deviceIdToActivate].isActive = true;
        emit DeviceActivated(_deviceIdToActivate);
    }

    function isAuthorizedDevice(deviceidtype _deviceId)
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

