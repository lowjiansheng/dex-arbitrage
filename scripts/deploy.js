const { ethers, upgrades } = require("hardhat");

async function main() {
	const Arbitrage = await ethers.getContractFactory("Arbitrage");
	const arbitrage = await Arbitrage.deploy();
	console.log("arbitrage deployed to:", arbitrage.address);
	console.log("deploy information: ", arbitrage.deployTransaction);
	let res = await arbitrage.deployTransaction.wait();
	console.log("deployment details:", res);
	console.log("gas used: ", res.gasUsed.toString());
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
