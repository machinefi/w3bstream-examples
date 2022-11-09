// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";


contract DeviceBinding is Ownable {

    // Devices ownership management
    struct Device {
        address ownerAddress;
        uint arrayIndex;
    }
    address[] public DeviceIds;
    mapping (address => Device) public OwnedDevices;

    // Keep track of how many devices an owner owns
    mapping(address => uint) public DevicesCount;

    // Events
    event OwnershipAssigned (address _deviceId, address _ownerAddress);
    event OwnershipRenounced (address _deviceId);

    constructor() {
        console.log("Deploying DeviceBinding contract");
    }

    function bindDevice(address _deviceId, address _ownerAddress) public onlyOwner returns (bool) {
        require(OwnedDevices[_deviceId].ownerAddress == address(0), "device has already been bound");
        
        AddDevice(_deviceId, _ownerAddress);

        emit OwnershipAssigned(_deviceId, _ownerAddress);
        return true;
    }

    function unbindDevice(address _deviceId) public returns (bool) {
        require(
            (OwnedDevices[_deviceId].ownerAddress == msg.sender) ||
            (msg.sender == this.owner()), 
            "not the device owner");

        removeDevice(_deviceId);

        emit OwnershipRenounced(_deviceId);
        return true;
    }

    function getDevicesCount() public view returns (uint) {
        return DeviceIds.length;
    }

    function getDeviceOwner(address _deviceId) public view returns (address) {
        return OwnedDevices[_deviceId].ownerAddress;
    }

    function getOwnedDevices(address _ownerAddress) public view returns (address[] memory) {
        address[] memory foundDevices = new address[](DevicesCount[_ownerAddress]);
        uint count = 0;
        Device memory device;

         for (uint i=0; i<DeviceIds.length; i++) {
            device = OwnedDevices[DeviceIds[i]];
            if (device.ownerAddress == _ownerAddress) {
                foundDevices[count] = DeviceIds[i];    
                count++;      
            }      
        }
       
        return foundDevices;
    }

    function AddDevice(address _deviceId, address _ownerAddress) private {
        OwnedDevices[_deviceId] = Device(_ownerAddress, DeviceIds.length);        
        DeviceIds.push(_deviceId);
        DevicesCount[_ownerAddress]++;
    }

    function removeDevice(address _deviceId) private {
        Device memory deviceToRemove = OwnedDevices[_deviceId];
        address lastDeviceAddress = DeviceIds[DeviceIds.length - 1];
         // Update the last device's arrayIndex, since we will move it in the array
        OwnedDevices[lastDeviceAddress].arrayIndex = deviceToRemove.arrayIndex;
        // Overwrite the device to delete address with the last device's address
        DeviceIds[deviceToRemove.arrayIndex] = DeviceIds[DeviceIds.length - 1];
        // delete the last device's address from the array
        DeviceIds.pop();
        // decrease the number of devices owned by the owner
        DevicesCount[deviceToRemove.ownerAddress]--;
        // delete the device from the ownerships
        delete OwnedDevices[_deviceId];
    }
}