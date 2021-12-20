import styles from '../styles/Home.module.css'
import '@douyinfe/semi-ui/dist/css/semi.min.css';
import { useState, useEffect } from 'react';
import { useWeb3React } from "@web3-react/core"
import { Button, Input, Row, Col, Toast, DatePicker, InputNumber } from '@douyinfe/semi-ui';
import { injected } from "../components/connector";
import LotteryMarket from "../artifacts/contracts/LotteryMarket.sol/LotteryMarket.json";
import { ethers } from "ethers";
import Lottery from "../artifacts/contracts/Lottery.sol/Lottery.json";
import Daidaidai from "../artifacts/contracts/Daidaidai.sol/Daidaidai.json";

// define your dai address;
const daiCoinAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
var marketAddress = "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9";
export default function Home() {
	const web3React = useWeb3React();
	const { active, account, library, connector, activate, deactivate, connectorName } = web3React;
	const [balance, setBalance] = useState(0);
	const [marketAdrs, setMarketAdrs] = useState(marketAddress);
	const [coinAdrs, setCoinAdrs] = useState(daiCoinAddress);
	const [isManager, setManager] = useState(true);
	const [endTimestamp, setEndTimestamp] = useState();
	const [lotteryAdrs, setLotteryAdrs] = useState('');
	const [number, setNumber] = useState();
	const [amount, setAmount] = useState();
	console.log(web3React);

	useEffect(() => {
		console.log(marketAdrs);
	}, [marketAdrs]);
	useEffect(() => {
		console.log(coinAdrs);
	}, [coinAdrs]);

	async function connect() {
		try {
			await activate(injected)
		} catch (ex) {
			console.log(ex)
		}
	}

	async function disconnect() {
		try {
			deactivate()
		} catch (ex) {
			console.log(ex)
		}
	}

	async function deployMarket() {
		const provider = library;
		const signer = library.getSigner();
		const factory = new ethers.ContractFactory(LotteryMarket.abi, LotteryMarket.bytecode, signer);
		const contract = await factory.deploy(daiCoinAddress);
		await contract.deployed();
		console.log(contract.address);
		setMarketAdrs(contract.address);
	}

	async function getBalance() {
		const Coin = new ethers.Contract(daiCoinAddress, Daidaidai.abi, library);
		var bal = await Coin.balanceOf(account);
		bal = ethers.utils.formatEther(bal);
		setBalance(bal);
	}

	async function createEvent() {
		if (!isManager) {
			Toast.error("you are not a manager yet, please check your role");
			return null;
		} else {
			const accountSigner = library.getSigner();
			const Market = new ethers.Contract(marketAdrs, LotteryMarket.abi, accountSigner);
			const end = endTimestamp;
			const now = Math.floor(Date.now() / 1000);
			const last = end - now;
			console.log(last);
			await Market.createEvent(last);
			const adrs = await Market.getContractAddress();
			setLotteryAdrs(adrs);
		}
	}

	async function getEventHistory() {
		const accountSigner = library.getSigner();
		const Market = new ethers.Contract(marketAdrs, LotteryMarket.abi, accountSigner);
		const list = await Market.listEvent();
		console.log(list);
	}

	async function endEvent() {
		// chainlink contract npm package is unable to install right now;
		const luckyNumber = Math.random();
		const accountSigner = library.getSigner();
		const Market = new ethers.Contract(marketAdrs, LotteryMarket.abi, accountSigner);
		await Market.drawLottery(luckyNumber);
	}

	async function buyLottery() {
		const accountSigner = library.getSigner();
		const lottery = new ethers.Contract(lotteryAdrs, Lottery.abi, accountSigner);
		//big number
		const price = await lottery.lotteryPrice();
		console.log(price);
		const Coin = new ethers.Contract(daiCoinAddress, Daidaidai.abi, accountSigner);
		await Coin.approve(lotteryAdrs, price.mul(amount));
		console.log(price);
		await lottery.buy(number, amount);
	}

	async function checkPrizePool() {
		const accountSigner = library.getSigner();
		const lottery = new ethers.Contract(lotteryAdrs, Lottery.abi, accountSigner);
		//big number
		const price = await lottery.getPrizePool();
		console.log(ethers.utils.formatEther(price))
	}

	async function checkMarketPool() {
		const accountSigner = library.getSigner();
		const Market = new ethers.Contract(marketAdrs, LotteryMarket.abi, accountSigner);
		//big number
		const price = await Market.getPlateformFund();
		console.log(ethers.utils.formatEther(price))
	}

	return (
		<div className="grid">
			<Row gutter={16}>
				<Col span={6}>
					<Button onClick={() => { connect() }} className="a">Connect to MetaMask</Button>
				</Col>
				<Col span={3}>
					<Button onClick={() => { disconnect() }} className="b">Disconnect</Button>
				</Col>
				<Col span={15}>
					{active ? <span>Connected with <b>{account}</b></span> : <span>Not connected</span>}
				</Col>
			</Row>
			<br />
			<Row>
				<span>coin address:   </span>
				<Input
					value={coinAdrs}
					autofocus
					style={{ width: '400px', margin: '16px 16px 16px 16px' }}
					onChange={(v, e) => {
						setCoinAdrs(v);
					}}
				/>
				<Button onClick={() => { getBalance() }}>get balance</Button>
				<span>account balance <b>{balance}</b></span>
			</Row>
			<br />
			<Row>
				<Button disabled onClick={() => { deployMarket() }}>deploy lottery market contract</Button>
			</Row>
			<br />
			<Row>
				<span>lottery market address:   </span>
				<Input
					value={marketAdrs}
					autofocus
					style={{ width: '400px', margin: '16px 16px 16px 16px' }}
					onChange={(v, e) => {
						setMarketAdrs(v);
					}}
				></Input>
			</Row>
			<br />
			<Row>
				<span>end time</span>
				<DatePicker
					type="dateTime"
					onChange={(date) => {
						if (date === undefined) return;
						setEndTimestamp(Math.floor(date.getTime() / 1000));
					}}
					style={{ margin: '16px 16px 16px 16px' }}
				/>
				<Button onClick={() => { createEvent() }}>create lottery event</Button>
				<Button onClick={() => { endEvent() }}>end lottery event</Button>
				<Button onClick={async () => {
					const accountSigner = library.getSigner();
					const Market = new ethers.Contract(marketAdrs, LotteryMarket.abi, accountSigner);
					const adrs = await Market.getContractAddress();
					setLotteryAdrs(adrs);
				}}>get event address</Button>
			</Row>
			<br />
			<Row>
				<Button onClick={() => { getEventHistory() }}>check event history</Button>
			</Row>
			<br />
			<Row>
				<label>lottery address: </label>
				<Input autofocus style={{ width: '400px', margin: '16px 16px 16px 16px' }} value={lotteryAdrs} onChange={(v, e) => {
						setLotteryAdrs(v);
					}}/>
			</Row>
			<br />
			<Row>
				<label>pick your number</label>
				<InputNumber hideButtons style={{ width: 190 }} max={9999} min={0} onNumberChange={(n) => { setNumber(n) }} />
				<label>amount</label>
				<InputNumber hideButtons style={{ width: 190 }} onNumberChange={(n) => { setAmount(n) }} />
				<Button onClick={() => { buyLottery() }} style={{ margin: '16px 16px 16px 16px' }}>buy lottery</Button>
			</Row>
			<br />
			<Row>
				<Button onClick={() =>{checkPrizePool()}}>check prize pool</Button>
				<Button onClick={() =>{checkMarketPool()}}>check market fund</Button>
			</Row>
		</div>
	)
}
