// SPDX-License-Identifier: None

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Lottery is Ownable {
    //dai coin config
    IERC20 public _daicoin;
    address public _daicoinAddress;
    uint256 public _endTimestamp;
    // lottery price
    //don't have enough DAI in the wallet for testing;
    uint256 public lotteryPrice = 25 ether;
    uint256 public transactionFeeRate = 4;

    // pool database
    struct LotteryPool {
        uint256 guessNumber;
        bool isExist;
        address[] players;
        uint256[] amount;
    }
    mapping(uint256 => LotteryPool) private id2numberPool;

    // player pick database
    struct PlayerPick {
        address playerAddress;
        bool isExist;
        uint16[] number;
        uint256[] amount;
        uint256[] pickTimestamp;
    }
    mapping(address => PlayerPick) private id2PlayerPick;

    // record winners;
    struct WinnersPlayer {
        address picker;
        uint256 amount;
        bool isExist;
    }
    mapping(address => WinnersPlayer) public adrs2players;
    address[] public winnersUnique;
    uint256 public winnerQuantity;

    // emit when ticket is sold
    event ticketBoughtEvent(address buyer, uint256 number, uint256 amount);

    // emit when winners get money;
    event winnerGotMoney(address winner, uint256 amount);

    constructor(uint256 endTimestamp, address coinAddress) {
        // setup dai faucet contract in repsten;
        _daicoin = IERC20(address(coinAddress));
        _daicoinAddress = coinAddress;
        _endTimestamp = endTimestamp;
    }

    function transferMoney() public {
        _daicoin.transferFrom(payable(msg.sender), payable(address(this)), 500);
    }

    function setLotteryPool(
        uint16 number,
        uint256 amount,
        address buyer
    ) private {
        if (!id2numberPool[number].isExist) {
            // form player object
            id2numberPool[number] = LotteryPool(
                number,
                true,
                new address[](0),
                new uint256[](0)
            );
        }
        // push pickers address
        id2numberPool[number].players.push(buyer);
        id2numberPool[number].amount.push(amount);
    }

    function setPlayerPick(
        uint16 number,
        uint256 amount,
        address buyer
    ) private {
        if (!id2PlayerPick[buyer].isExist) {
            // form player object
            id2PlayerPick[buyer] = PlayerPick(
                buyer,
                true,
                new uint16[](0),
                new uint256[](0),
                new uint256[](0)
            );
        }
        // push pickers address
        id2PlayerPick[buyer].number.push(number);
        id2PlayerPick[buyer].amount.push(amount);
        id2PlayerPick[buyer].pickTimestamp.push(block.timestamp);
    }

    function buy(uint16 number, uint256 amount) public returns (bool) {
        require(block.timestamp <= _endTimestamp, "the event is ended");
        require(number >= 0 && number < 10000, "the pick is out of range");
        uint256 amountTotal = amount * lotteryPrice;
        require(
            _daicoin.balanceOf(msg.sender) >= amountTotal,
            "your account doesn't have enough money"
        );
        address buyer = msg.sender;
        // transfer money to the contract
        bool result = _daicoin.transferFrom(
            payable(msg.sender),
            payable(address(this)),
            amountTotal
        );
        if (result) {
            // register it to lottery pool;
            setLotteryPool(number, amount, buyer);
            // register to address database;
            setPlayerPick(number, amount, buyer);
            emit ticketBoughtEvent(buyer, number, amount);
            return true;
        } else {
            return false;
        }
    }

    function pickWinner(uint16 number)
        public
        onlyOwner
        returns (address[] memory)
    {
        require(block.timestamp >= _endTimestamp, "the event is not over yet");

        if (!id2numberPool[number].isExist) {
            winnersUnique = new address[](0);
            return winnersUnique;
        }
        LotteryPool memory winningItem = id2numberPool[number];
        address[] memory winners = winningItem.players;
        uint256[] memory orders = winningItem.amount;
        for (uint256 i = 0; i < winners.length; i++) {
            // map does not have the address
            address winnerAddress = winners[i];
            winnerQuantity += orders[i];
            if (!adrs2players[winnerAddress].isExist) {
                WinnersPlayer memory winner = WinnersPlayer(winnerAddress, orders[i], true);
                adrs2players[winnerAddress] = winner;
                winnersUnique.push(winnerAddress);
            } else {
                adrs2players[winnerAddress].amount += orders[i];
            }
        }
        distributePrize();
        return winnersUnique;
    }

    function destry(address receipient) public onlyOwner {
        uint256 prizePool = _daicoin.balanceOf(address(this));
        _daicoin.transfer(payable(receipient), prizePool);
        selfdestruct(payable(receipient));
    }

    function getMyPicks() public view returns (PlayerPick memory) {
        return id2PlayerPick[msg.sender];
    }

    function getPrizePool() public view returns (uint256) {
        return _daicoin.balanceOf(address(this));
    }

    function distributePrize() private {
        require(winnersUnique.length > 0, "no winner in the event");
        uint256 prizeTot = _daicoin.balanceOf(address(this));
        uint256 transactionFee = prizeTot / transactionFeeRate;
        address marketAddress = owner();
        _daicoin.transfer(payable(marketAddress), transactionFee);
        prizeTot = prizeTot - transactionFee;
        uint256 shareEach = prizeTot / winnerQuantity;
        for (uint256 i = 0; i < winnersUnique.length; i++) {
            address winner = winnersUnique[i];
            if (adrs2players[winner].isExist) {
                uint256 quan = adrs2players[winner].amount;
                uint256 prizeMoney = quan*shareEach;
                bool result = _daicoin.transfer(payable(winner), prizeMoney);
                if (result) {
                    emit winnerGotMoney(winner, prizeMoney);
                }
            }
        }
    }
}
