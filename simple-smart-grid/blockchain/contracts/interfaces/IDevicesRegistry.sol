// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

type deviceidtype is address;

interface IDevicesRegistry {
    function isAuthorizedDevice(deviceidtype _deviceAddress)
        external
        returns (bool);
}
