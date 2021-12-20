// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Daidaidai is ERC20 {
    constructor(address[] memory rec) ERC20("dai", "DDD") {
        _mint(msg.sender, 1000000 * (10**18));
        for (uint16 i=0; i<rec.length; i++){
            address recepient = rec[i];
            transfer(payable(recepient), 200000 * (10**18));
        }
    }
}
