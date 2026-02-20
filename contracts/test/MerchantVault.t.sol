// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {MerchantVault} from "../src/MerchantVault.sol";
import {MockDDSC} from "../src/MockDDSC.sol";

contract MerchantVaultTest is Test {
    MerchantVault public vault;
    MockDDSC public ddsc;

    address public deployer = address(this);
    address public merchant1 = makeAddr("merchant1");
    address public buyer1 = makeAddr("buyer1");
    address public buyer2 = makeAddr("buyer2");

    receive() external payable {}

    function setUp() public {
        vault = new MerchantVault();
        ddsc = new MockDDSC();

        vm.deal(buyer1, 10 ether);
        vm.deal(buyer2, 10 ether);

        ddsc.faucet(buyer1, 5000 * 1e18);
        ddsc.faucet(buyer2, 5000 * 1e18);
    }

    function test_RegisterMerchant() public {
        vm.prank(merchant1);
        uint256 merchantId = vault.registerMerchant("Coffee Shop", "ipfs://coffee");

        assertEq(merchantId, 1);
        assertEq(vault.totalMerchants(), 1);
        assertEq(vault.merchantByAddress(merchant1), 1);

        MerchantVault.Merchant memory m = vault.getMerchant(1);
        assertEq(m.owner, merchant1);
        assertEq(m.name, "Coffee Shop");
        assertEq(m.metadataURI, "ipfs://coffee");
        assertTrue(m.isActive);
        assertEq(m.totalRevenue, 0);
        assertEq(m.totalOrders, 0);
    }

    function test_RegisterMerchant_RevertDuplicate() public {
        vm.prank(merchant1);
        vault.registerMerchant("Shop 1", "ipfs://1");

        vm.prank(merchant1);
        vm.expectRevert("Already registered");
        vault.registerMerchant("Shop 2", "ipfs://2");
    }

    function test_Checkout_Native() public {
        vm.prank(merchant1);
        vault.registerMerchant("Shop", "ipfs://shop");

        bytes32 orderId = keccak256("order-001");
        uint256 deployerBefore = deployer.balance;

        vm.prank(buyer1);
        vault.checkout{value: 1 ether}(1, orderId);

        // 2% fee = 0.02 ether
        uint256 expectedFee = (1 ether * 200) / 10000;
        uint256 expectedMerchantAmount = 1 ether - expectedFee;

        // Merchant balance stored in vault
        assertEq(vault.getMerchantBalance(1, address(0)), expectedMerchantAmount);
        assertEq(deployer.balance - deployerBefore, expectedFee);

        // Order recorded
        (uint256 mId, address buyer, address token, uint256 amt, bytes32 oid, uint256 ts) = vault.orders(orderId);
        assertEq(mId, 1);
        assertEq(buyer, buyer1);
        assertEq(amt, 1 ether);

        // Stats updated
        MerchantVault.Merchant memory m = vault.getMerchant(1);
        assertEq(m.totalRevenue, 1 ether);
        assertEq(m.totalOrders, 1);
        assertEq(vault.totalOrderCount(), 1);
    }

    function test_Checkout_RevertInactiveMerchant() public {
        // Merchant ID 0 doesn't exist, isActive defaults to false
        vm.prank(buyer1);
        vm.expectRevert("Merchant inactive");
        vault.checkout{value: 1 ether}(999, keccak256("order"));
    }

    function test_Checkout_RevertZeroPayment() public {
        vm.prank(merchant1);
        vault.registerMerchant("Shop", "ipfs://shop");

        vm.prank(buyer1);
        vm.expectRevert("Zero payment");
        vault.checkout{value: 0}(1, keccak256("order"));
    }

    function test_CheckoutERC20() public {
        vm.prank(merchant1);
        vault.registerMerchant("Shop", "ipfs://shop");

        uint256 amount = 100 * 1e18;
        bytes32 orderId = keccak256("order-erc20");

        vm.startPrank(buyer1);
        ddsc.approve(address(vault), amount);
        vault.checkoutERC20(1, address(ddsc), amount, orderId);
        vm.stopPrank();

        uint256 expectedFee = (amount * 200) / 10000; // 2%
        uint256 expectedMerchantAmount = amount - expectedFee;

        assertEq(vault.getMerchantBalance(1, address(ddsc)), expectedMerchantAmount);
        assertEq(ddsc.balanceOf(deployer), 1_000_000 * 1e18 + expectedFee);
    }

    function test_Withdraw_Native() public {
        vm.prank(merchant1);
        vault.registerMerchant("Shop", "ipfs://shop");

        // Checkout
        vm.prank(buyer1);
        vault.checkout{value: 1 ether}(1, keccak256("order1"));

        uint256 balance = vault.getMerchantBalance(1, address(0));
        uint256 merchantBefore = merchant1.balance;

        // Withdraw
        vm.prank(merchant1);
        vault.withdraw(address(0));

        assertEq(merchant1.balance - merchantBefore, balance);
        assertEq(vault.getMerchantBalance(1, address(0)), 0);
    }

    function test_Withdraw_ERC20() public {
        vm.prank(merchant1);
        vault.registerMerchant("Shop", "ipfs://shop");

        uint256 amount = 500 * 1e18;
        vm.startPrank(buyer1);
        ddsc.approve(address(vault), amount);
        vault.checkoutERC20(1, address(ddsc), amount, keccak256("order-erc20"));
        vm.stopPrank();

        uint256 expectedBalance = vault.getMerchantBalance(1, address(ddsc));

        vm.prank(merchant1);
        vault.withdraw(address(ddsc));

        assertEq(ddsc.balanceOf(merchant1), expectedBalance);
        assertEq(vault.getMerchantBalance(1, address(ddsc)), 0);
    }

    function test_Withdraw_RevertNotMerchant() public {
        vm.prank(buyer1);
        vm.expectRevert("Not a merchant");
        vault.withdraw(address(0));
    }

    function test_Withdraw_RevertNothingToWithdraw() public {
        vm.prank(merchant1);
        vault.registerMerchant("Shop", "ipfs://shop");

        vm.prank(merchant1);
        vm.expectRevert("Nothing to withdraw");
        vault.withdraw(address(0));
    }

    function test_MultipleOrders() public {
        vm.prank(merchant1);
        vault.registerMerchant("Shop", "ipfs://shop");

        vm.prank(buyer1);
        vault.checkout{value: 1 ether}(1, keccak256("o1"));

        vm.prank(buyer2);
        vault.checkout{value: 2 ether}(1, keccak256("o2"));

        assertEq(vault.totalOrderCount(), 2);

        bytes32[] memory orderIds = vault.getMerchantOrders(1);
        assertEq(orderIds.length, 2);

        MerchantVault.Merchant memory m = vault.getMerchant(1);
        assertEq(m.totalOrders, 2);
        assertEq(m.totalRevenue, 3 ether);
    }

    function test_SetFee() public {
        vault.setFee(500);
        assertEq(vault.platformFeeBps(), 500);
    }

    function test_SetFee_RevertOverMax() public {
        vm.expectRevert("Max 10%");
        vault.setFee(1001);
    }
}
