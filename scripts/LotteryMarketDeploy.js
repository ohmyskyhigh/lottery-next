
const hre = require("hardhat");

async function MarketDeploy() {

    // We get the contract to deploy
    const localCoinAddress = "0x4Ad4a078e19e9c98cbfAC93a0c3DccaD5B5D196C";
    const Market = await hre.ethers.getContractFactory("LotteryMarket");
    const market = await Market.deploy(localCoinAddress);
    await market.deployed();

    //grant managers;
    console.log("market deployed");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
MarketDeploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
