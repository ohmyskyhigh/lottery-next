/* test/sample-test.js */
const { expect } = require("chai");
const { ethers } = require("hardhat");

var moment = require('moment');
const lotteryabi = require('../artifacts/contracts/Lottery.sol/Lottery.json');


describe("lottery system testing", function () {
    var communities;
    var playersAddresses;
    var managerAdrs;
    var coin;
    var market;
    var lotteryAddress;
    var lottery;
    describe("deploy contract, create lottery event contract ", function () {
        it("before each", async function () {
            const [owner, adrs1, adrs2, adrs3, adrs4, adrs5, manager] = await ethers.getSigners();
            communities = [owner, adrs1, adrs2, adrs3, adrs4, adrs5, manager];
            managerAdrs = [await owner.getAddress(), await manager.getAddress()];
            playersAddresses = [
                await adrs1.getAddress(),
                await adrs2.getAddress(),
                await adrs3.getAddress(),
                await adrs4.getAddress(),
                await adrs5.getAddress()
            ];

            /* deploy the marketplace */
            const Coin = await ethers.getContractFactory("Daidaidai");
            coin = await Coin.deploy(playersAddresses);
            await coin.deployed();

            //deploy contract
            console.log("coin address: ", coin.address);
            const Market = await ethers.getContractFactory("LotteryMarket");
            market = await Market.deploy(coin.address);
            await market.deployed();

            //grant managers;
            await market.GrantManagers([managerAdrs[1]]);
        })

        it("Should deploy the contract and give the member 100,000 tokens", async function () {
            const totalSupply = await coin.totalSupply();
            console.log("totalsupply", totalSupply);
            const ownerAdrs = managerAdrs[0];
            console.log("owners account", await coin.balanceOf(ownerAdrs));
            playersAddresses.map((value, index) => {
                coin.balanceOf(value).then((v) => {
                    console.log("address: ", value, "balance: ", v);
                })
            })
            expect(totalSupply == (1000000 * (10 ** 18)))
        });

        it("should deploy the lottery platform and assign managers", async function () {
            // check manager role;
            expect(await market.connect(communities[6]).checkManager() == "you got it");
        });

        it("use plateform contract create a lottery contract", async function () {
            const endTime = Math.ceil(Date.now() / 1000) + 300;
            // create event;
            await market.createEvent(3000);
            lotteryAddress = await market.getContractAddress();
            console.log(lotteryAddress);
        });

        it("the lottery can be bought by users", async function () {
            const Lottery = await ethers.getContractFactory("Lottery");
            lottery = await Lottery.attach(lotteryAddress);
            const allowAmount = ethers.utils.parseUnits("1000", "ether");
            for (let i =0; i< playersAddresses.length; i++){
                let index = i;
                let value = playersAddresses[i];
                let amount = await coin.connect(communities[index + 1]).approve(lotteryAddress, allowAmount);
                const res = await lottery.connect(communities[index + 1]).buy(5, 10);
                if (res) {
                    const v = await coin.balanceOf(value);
                    console.log("address: ", value, "balance: ", v, "allowance:, ", amount);
                };
                const orders = await lottery.connect(communities[index + 1]).getMyPicks();
                console.log("my pick", orders);
            }
        })
    })
})