import { TransactionResponse } from "@ethersproject/abstract-provider";
import { ethers } from "hardhat";
import { providers, Signer, utils } from "ethers";
import { Contract } from "hardhat/internal/hardhat-network/stack-traces/model";
import erc20Abi from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import { get } from "https";

// transfer USDC from owner to arbitrage contract
async function main() {
	let [owner] = await ethers.getSigners();

	const arbitrageAddress = "0x4ea0Be853219be8C9cE27200Bdeee36881612FF2";
	const usdcAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
	const usdcContract = new ethers.Contract(usdcAddress, erc20Abi["abi"], owner);
	const tx: TransactionResponse = await usdcContract.transfer(
		arbitrageAddress,
		100000000
	);
	const response = await tx.wait();
	console.log(response.logs);
}

async function getUSDCBalanceOfContract() {
	const usdcContract = new ethers.Contract(
		"0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
		erc20Abi["abi"],
		providers.getDefaultProvider("http://127.0.0.1:8545")
	);
	const response = await usdcContract.balanceOf(
		"0x4ea0Be853219be8C9cE27200Bdeee36881612FF2"
	);
	console.log(response.toString());
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
