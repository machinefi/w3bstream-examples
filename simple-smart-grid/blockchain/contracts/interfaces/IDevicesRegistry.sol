// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IDevicesRegistry {
    function isAuthorizedDevice(address _deviceAddress)
        external
        returns (bool);
}
