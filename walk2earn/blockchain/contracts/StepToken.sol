// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract StepToken is ERC20 {
    constructor() ERC20("StepToken", "STP") {
        _mint(msg.sender, 10000000000 * 10 ** decimals());
    }
}