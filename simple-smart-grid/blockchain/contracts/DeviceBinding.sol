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
    event OwnershipAssigned (address indexed _deviceId, address indexed _ownerAddress);
    event OwnershipRenounced (address indexed _deviceId);

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

    function toAsciiString(address x) internal pure returns (string memory) {
    bytes memory s = new bytes(40);
    for (uint i = 0; i < 20; i++) {
        bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
        bytes1 hi = bytes1(uint8(b) / 16);
        bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
        s[2*i] = char(hi);
        s[2*i+1] = char(lo);            
    }
    return string(s);
}

function char(bytes1 b) internal pure returns (bytes1 c) {
    if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
    else return bytes1(uint8(b) + 0x57);
}
}