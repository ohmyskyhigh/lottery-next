
const hre = require("hardhat");

async function eventCreate() {
    // We get the contract to deploy
    const localMarketContract = "0x4Ad4a078e19e9c98cbfAC93a0c3DccaD5B5D196C";
    // attach existing market contract
    const Market = await hre.ethers.getContractFactory("LotteryMarket")
    const market = await Market.attach(localMarketContract);
    // use manager account, different from owner to run contract
    const managerAddress = await manager.getAddress();
    const event = await market.connect(manager).createEvent(600);
    console.log("event created,", event);
    const eventAddress = market.getContractAddress();
    console.log(eventAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
eventCreate()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
