import { ethers } from "hardhat";
import { providers, Signer, utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import data from "../artifacts/contracts/IUniswapV2Router01.sol/IUniswapV2Router01.json";
import erc20Abi from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import { expect } from "chai";

const usdcAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";

describe("Arbitrage", function () {
	let accounts: Signer[];
	let contractAddress: string;

	before(async function () {
		let [owner] = await ethers.getSigners();
		await convertMATICToUSDC(owner);
		let arbitrageAddress = await deployContract();
		contractAddress = arbitrageAddress;
	});

	beforeEach(async function () {
		accounts = await ethers.getSigners();
	});

	it("should be able to withdraw funds", async function () {
		let [owner] = await ethers.getSigners();
		await transferUSDCToContract(contractAddress, owner, 100000000);

		const usdcContract = new ethers.Contract(
			usdcAddress,
			erc20Abi["abi"],
			owner
		);
		expect(await usdcContract.balanceOf(contractAddress)).to.equal("100000000");

		const Arbitrage = await ethers.getContractFactory("Arbitrage");
		const arbitrage = await Arbitrage.attach(contractAddress);
		// withdraw 10 USDC
		await arbitrage.withdrawFunds("10000000");
		expect(await usdcContract.balanceOf(contractAddress)).to.equal("90000000");
	});

	it("should not be able to arbitrage", async function () {
		const Arbitrage = await ethers.getContractFactory("Arbitrage");
		const arbitrage = await Arbitrage.attach(contractAddress);
		expect(await arbitrage.shouldArbitrage()).to.equal(false);
	});

	it("should revert at the end of a bad swap", async function () {
		const Arbitrage = await ethers.getContractFactory("Arbitrage");
		const arbitrage = await Arbitrage.attach(contractAddress);
		await expect(arbitrage.arbitrage("1000000")).to.be.revertedWith(
			"bad arbitrage, reverting"
		);
	});
});

async function deployContract(): Promise<string> {
	const Arbitrage = await ethers.getContractFactory("Arbitrage");
	const arbitrage = await Arbitrage.deploy();
	console.log(arbitrage.address);
	return arbitrage.address;
}

async function convertMATICToUSDC(owner: SignerWithAddress) {
	const QUICKSWAP_ADDRESS = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
	const quickswapRouter = new ethers.Contract(
		QUICKSWAP_ADDRESS,
		data["abi"],
		owner
	);
	const path = [
		"0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
		"0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
	];
	const value = {
		value: utils.parseEther("100.0"),
	};
	let currentTimestamp = Date.now();
	const tx: TransactionResponse = await quickswapRouter.swapExactETHForTokens(
		10000,
		path,
		owner.getAddress(),
		currentTimestamp + 80000,
		value
	);
	console.log("Converted MATIC to USDC!");
}

async function transferUSDCToContract(
	arbitrageContractAddress: string,
	owner: SignerWithAddress,
	amountToTransfer: number
) {
	console.log("transferring to " + arbitrageContractAddress);
	const usdcContract = new ethers.Contract(usdcAddress, erc20Abi["abi"], owner);
	await usdcContract.transfer(
		arbitrageContractAddress,
		amountToTransfer // 100 USDC
	);
}
