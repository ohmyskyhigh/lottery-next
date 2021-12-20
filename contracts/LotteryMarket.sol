// SPDX-License-Identifier: None

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Lottery.sol";
import "./ILottery.sol";

// create a ownable lottery contract;
contract LotteryMarket is AccessControl, ReentrancyGuard {
    Lottery private lottery;
    // dai coin
    IERC20 public _daicoin;
    address public _coinAddress;
    // comittee contains managers who can create lottery events;
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    
    // counter as lottery event id;
    using Counters for Counters.Counter;
    Counters.Counter private _eventId;
    // lottery data item structure
    struct LotteryEvent {
        uint256 eventID;
        bool isExist;
        uint256 startTimestamp;
        uint256 endTimestamp;
        address lotteryCreator;
        address eventAddress;
        uint16 luckyNumber;
        uint256 prizePoolSize;
        address[] winners;
    }
    mapping(uint256 => LotteryEvent) private id2LotteryEvent;

    event eventCreated(
        LotteryEvent item
    );

    event message (
        string msg
    );

    // build comittees when the contract is created
    constructor (address coinAddress) {
        // grante contract creator wallet address as admin
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        grantRole(MANAGER_ROLE, msg.sender);
        // custom dai coint for dev purpose;
        _coinAddress = coinAddress;
        _daicoin = IERC20(address(coinAddress));
    }

    // grant manager account from admin account
    function GrantManagers(address[] memory managers) public onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i< managers.length; i++) {
            grantRole(MANAGER_ROLE, managers[i]);
        }
    }

    function getContractAddress() public view returns(address) {
        return address(lottery);
    }

    function setEvent() public {
        uint256 endTimestamp = block.timestamp +25;
        lottery = new Lottery(endTimestamp, _coinAddress);
    }

    function createEvent( uint256 periodLength ) public onlyRole(MANAGER_ROLE) returns(uint256){ 
        // check time period is valid
        uint256 startTimeStamp = block.timestamp;
        uint256 endTimestamp = startTimeStamp + periodLength;
        
        // check if the time period is overlapped
        uint256 lastID = _eventId.current();
        require(lastID == 0 || id2LotteryEvent[lastID].luckyNumber < 10000, "Last event is not finished yet");

        address lastContractAdrs = id2LotteryEvent[lastID].eventAddress;
        // set eventid;
        _eventId.increment();
        uint256 eventID = _eventId.current();
        // creat lottery contract;
        emit message("creating contract");
        lottery = new Lottery(endTimestamp, _coinAddress);
        emit message("contract created");
        // set params
        LotteryEvent memory eventItem = LotteryEvent(
            eventID,
            true,
            startTimeStamp,
            endTimestamp,
            msg.sender,
            address(lottery),
            10000,
            0,
            new address[](0)
        );
        // create item;
        id2LotteryEvent[eventID] = eventItem;
        //destroy the last lottery event and pass all the balance to the new event contract;
        if (lastID != 0){
            endEvent(lastContractAdrs, address(lottery));
        }
        // emit item event;
        emit eventCreated(eventItem);
        return eventID;
    }

    // get prize winner
    function drawLottery(uint16 luckyNumber) public onlyRole(MANAGER_ROLE) returns(address[] memory){
        require(luckyNumber >= 0 && luckyNumber < 10000, "the lucky number is out of range");
        // current index;
        uint256 currentId = _eventId.current();
        require(block.timestamp >= id2LotteryEvent[currentId].endTimestamp, "event is not over yet");
        // get winners in this event
        address[] memory winners = lottery.pickWinner(luckyNumber);
        // record winners into id2LotteryEvent;
        id2LotteryEvent[currentId].winners = winners;
        id2LotteryEvent[currentId].luckyNumber = luckyNumber;
        return winners;
    }

    function endEvent(address lotteryConAdrs, address nextLotteryConAdrs) private {
        ILottery(lotteryConAdrs).destry(nextLotteryConAdrs);
    }

    function listEvent() public view returns(LotteryEvent[] memory) {
        uint256 lotteryLength = _eventId.current();
        // set an empty array
        LotteryEvent[] memory eventList = new LotteryEvent[](lotteryLength);

        for (uint256 i = 0; i<lotteryLength; i++) {
            eventList[i] = id2LotteryEvent[i+1];
        }
        return eventList;
    }

    function getPlateformFund() public view onlyRole(MANAGER_ROLE) returns(uint) {
        return _daicoin.balanceOf(address(this));
    }

    function getEventbyId(uint256 id) public view returns(LotteryEvent memory) {
        return id2LotteryEvent[id];
    }    
}