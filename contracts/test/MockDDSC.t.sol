// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {MockDDSC} from "../src/MockDDSC.sol";

contract MockDDSCTest is Test {
    MockDDSC public ddsc;
    address public deployer = address(this);
    address public alice = makeAddr("alice");

    function setUp() public {
        ddsc = new MockDDSC();
    }

    function test_InitialSupply() public view {
        assertEq(ddsc.totalSupply(), 1_000_000 * 1e18);
        assertEq(ddsc.balanceOf(deployer), 1_000_000 * 1e18);
    }

    function test_Name() public view {
        assertEq(ddsc.name(), "Dirham Stablecoin");
        assertEq(ddsc.symbol(), "DDSC");
        assertEq(ddsc.decimals(), 18);
    }

    function test_Faucet() public {
        ddsc.faucet(alice, 1000 * 1e18);
        assertEq(ddsc.balanceOf(alice), 1000 * 1e18);
    }

    function test_Faucet_MaxAmount() public {
        ddsc.faucet(alice, 10_000 * 1e18);
        assertEq(ddsc.balanceOf(alice), 10_000 * 1e18);
    }

    function test_Faucet_RevertOverMax() public {
        vm.expectRevert("Max 10k per mint");
        ddsc.faucet(alice, 10_001 * 1e18);
    }

    function test_Faucet_MultipleCalls() public {
        ddsc.faucet(alice, 10_000 * 1e18);
        ddsc.faucet(alice, 10_000 * 1e18);
        assertEq(ddsc.balanceOf(alice), 20_000 * 1e18);
    }

    function test_Mint_OnlyOwner() public {
        ddsc.mint(alice, 50_000 * 1e18);
        assertEq(ddsc.balanceOf(alice), 50_000 * 1e18);
    }

    function test_Mint_RevertNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        ddsc.mint(alice, 1000 * 1e18);
    }

    function test_Transfer() public {
        ddsc.transfer(alice, 100 * 1e18);
        assertEq(ddsc.balanceOf(alice), 100 * 1e18);
    }

    function test_Approve_TransferFrom() public {
        ddsc.approve(alice, 500 * 1e18);

        vm.prank(alice);
        ddsc.transferFrom(deployer, alice, 500 * 1e18);

        assertEq(ddsc.balanceOf(alice), 500 * 1e18);
    }
}
