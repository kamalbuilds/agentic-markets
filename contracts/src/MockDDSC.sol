// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockDDSC - Mock Dirham Stablecoin for testing
/// @notice Simulates the DDSC stablecoin on ADI Chain testnet
/// @dev 1 DDSC = 1 AED (pegged). 1 USD ≈ 3.6725 AED
contract MockDDSC is ERC20, Ownable {
    uint8 private constant DECIMALS = 18;

    constructor() ERC20("Dirham Stablecoin", "DDSC") Ownable(msg.sender) {
        // Mint initial supply to deployer for testing
        _mint(msg.sender, 1_000_000 * 10 ** DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /// @notice Faucet function for testnet - anyone can mint up to 10,000 DDSC
    function faucet(address to, uint256 amount) external {
        require(amount <= 10_000 * 10 ** DECIMALS, "Max 10k per mint");
        _mint(to, amount);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
