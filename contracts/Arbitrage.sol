//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// only for USDC deposits
contract Arbitrage {
    address owner;
    address USDC_CONTRACT_ADDRESS = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    address QUICKSWAP_ROUTER_ADDRESS =
        0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;
    address SUSHI_ROUTER_ADDRESS = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;
    IUniswapV2Router02 quickswapRouter02 =
        IUniswapV2Router02(QUICKSWAP_ROUTER_ADDRESS);
    IUniswapV2Router02 sushiswapRouter02 =
        IUniswapV2Router02(SUSHI_ROUTER_ADDRESS);

    event AmountsOut(uint256 amountOutUni, uint256 amountOutUSDC);
    event ShouldArbitrage(bool shouldArbitrage);
    event SwappedAmount(uint256 amountIn, uint256 amountOut);

    constructor() payable {
        owner = msg.sender;
    }

    // this will be called to check if is worth attempting arbitrage
    function shouldArbitrage() public view returns (bool) {
        uint256 originalAmount = 100000000; // 100 USDC (6 DP)
        uint256 wethOutAmount = getWETHUSDCBuyPriceQuickSwap(originalAmount);
        uint256 usdcOutAmount = getWETHUSDCSellPriceSushiSwap(wethOutAmount);

        return (originalAmount < usdcOutAmount);
    }

    function arbitrage(uint256 amountIn) public returns (bool) {
        IERC20 usdc = IERC20(USDC_CONTRACT_ADDRESS);
        require(
            usdc.balanceOf(address(this)) > amountIn,
            "not sufficient balance of USDC, please transfer to contract first"
        );
        uint256 amountWETHOutput = swapTokensOnQuickSwap(amountIn);
        uint256 amountUSDCOutput = swapTokensOnSushiSwap(amountWETHOutput);

        require(amountUSDCOutput > amountIn, "bad arbitrage, reverting");
        return true;
    }

    function swapTokensOnQuickSwap(uint256 sellTokenAmount)
        internal
        returns (uint256)
    {
        address[] memory path = new address[](2);
        path[0] = USDC_CONTRACT_ADDRESS;
        path[1] = quickswapRouter02.WETH();

        uint256[] memory amountOut = quickswapRouter02.getAmountsOut(
            sellTokenAmount,
            path
        );

        IERC20 usdc = IERC20(USDC_CONTRACT_ADDRESS);
        usdc.approve(QUICKSWAP_ROUTER_ADDRESS, sellTokenAmount);

        uint256[] memory amounts = quickswapRouter02.swapExactTokensForTokens(
            sellTokenAmount,
            (amountOut[0] * 90) / 100,
            path,
            address(this),
            block.timestamp + 20000
        );
        emit SwappedAmount(sellTokenAmount, amounts[0]);
        return amounts[1];
    }

    function swapTokensOnSushiSwap(uint256 sellTokenAmount)
        internal
        returns (uint256)
    {
        address[] memory path = new address[](2);
        path[0] = sushiswapRouter02.WETH();
        path[1] = USDC_CONTRACT_ADDRESS;

        uint256[] memory amountOut = sushiswapRouter02.getAmountsOut(
            sellTokenAmount,
            path
        );

        IERC20 weth = IERC20(sushiswapRouter02.WETH());
        weth.approve(SUSHI_ROUTER_ADDRESS, sellTokenAmount);

        uint256[] memory amounts = sushiswapRouter02.swapExactTokensForTokens(
            sellTokenAmount,
            (amountOut[1] * 90) / 100,
            path,
            address(this),
            block.timestamp + 20000
        );
        emit SwappedAmount(sellTokenAmount, amounts[0]);
        return amounts[1];
    }

    function getWETHUSDCSellPriceSushiSwap(uint256 amountInWETH)
        public
        view
        returns (uint256)
    {
        address[] memory path = new address[](2);
        path[0] = sushiswapRouter02.WETH();
        path[1] = USDC_CONTRACT_ADDRESS;

        uint256[] memory amountOut = sushiswapRouter02.getAmountsOut(
            amountInWETH,
            path
        );
        return amountOut[1];
    }

    function getWETHUSDCBuyPriceQuickSwap(uint256 amountInUSDC)
        public
        view
        returns (uint256)
    {
        address[] memory path = new address[](2);
        path[0] = USDC_CONTRACT_ADDRESS;
        path[1] = quickswapRouter02.WETH();

        uint256[] memory amountOut = quickswapRouter02.getAmountsOut(
            amountInUSDC,
            path
        );
        return amountOut[1];
    }

    // send funds back to deployer of contract
    // all funds put into this contract belongs to deployer
    function withdrawFunds(uint256 amountToWithdraw)
        public
        onlyOwner
        returns (bool)
    {
        IERC20 usdc = IERC20(USDC_CONTRACT_ADDRESS);
        require(
            usdc.balanceOf(msg.sender) > amountToWithdraw,
            "contract does not have enough funds to withdraw"
        );
        return usdc.transfer(owner, amountToWithdraw);
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
}
