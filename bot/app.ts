import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ethers, providers } from "ethers";
import arbitrageAbi from "../artifacts/contracts/Arbitrage.sol/Arbitrage.json";

// this file is used for deployment on AWS lambda

async function connectToEthers(): Promise<ethers.Contract> {
	let infuraProvider = providers.getDefaultProvider(INFURA_URL);
	let wallet = new ethers.Wallet(PRIVATE_KEY, infuraProvider);
	let arbitrage = new ethers.Contract(
		ARBITRAGE_CONTRACT_ADDRESS,
		arbitrageAbi["abi"],
		wallet
	);
	return arbitrage;
}

export const lambdaHandler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	const queries = JSON.stringify(event.queryStringParameters);
	let arbitrageContract = await connectToEthers();
	if (await arbitrageContract.shouldArbitrage()) {
		// arbitrage
		await arbitrageContract.arbitrage();
		return {
			statusCode: 200,
			body: "arbitraging",
		};
	} else {
		return {
			statusCode: 200,
			body: `not arbitraging`,
		};
	}
};
