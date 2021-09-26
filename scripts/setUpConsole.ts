import { ethers } from "hardhat";
import { providers, Signer, utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import data from "../artifacts/contracts/IUniswapV2Router01.sol/IUniswapV2Router01.json";
import erc20Abi from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import { TransactionResponse } from "@ethersproject/abstract-provider";

async function main() {
	let accounts: Signer[];
	let [owner] = await ethers.getSigners();

	const ownerAddress: string = await owner.getAddress();
	const ownerBalance: string = (await owner.getBalance()).toString();

	await getUSDC(owner);
	await getUSDCBalance(owner);
}

// convert MATIC to USDC
async function getUSDC(owner: SignerWithAddress) {
	const uniswapRouter = new ethers.Contract(
		"0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
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
	const tx: TransactionResponse = await uniswapRouter.swapExactETHForTokens(
		10000,
		path,
		owner.getAddress(),
		1632120954 + 80000,
		value
	);
	const response = await tx.wait();
	console.log(response);
}

async function getUSDCBalance(owner: SignerWithAddress) {
	const usdcContract = new ethers.Contract(
		"0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
		erc20Abi["abi"],
		providers.getDefaultProvider("http://127.0.0.1:8545")
	);
	const response = await usdcContract.balanceOf(
		"0x696358bBb1a743052E0E87BeD78AAd9d18f0e1F4"
	);
	console.log(response.toString());
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
