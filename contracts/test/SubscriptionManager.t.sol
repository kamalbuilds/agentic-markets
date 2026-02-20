// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {SubscriptionManager} from "../src/SubscriptionManager.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";

contract SubscriptionManagerTest is Test {
    SubscriptionManager public subManager;
    AgentRegistry public registry;

    address public deployer = address(this);
    address public agentOwner = makeAddr("agentOwner");
    address public subscriber1 = makeAddr("subscriber1");
    address public subscriber2 = makeAddr("subscriber2");

    uint256 public agentId;
    uint256 public constant SUB_AMOUNT = 0.1 ether;
    uint256 public constant SUB_INTERVAL = 1 days;

    receive() external payable {}

    function setUp() public {
        registry = new AgentRegistry();
        subManager = new SubscriptionManager(address(registry));

        // Fund subscribers
        vm.deal(subscriber1, 100 ether);
        vm.deal(subscriber2, 100 ether);

        // Register an agent
        vm.prank(agentOwner);
        agentId = registry.registerAgent("ipfs://agent1", 0.05 ether);
    }

    // =========================================================================
    // Creating a subscription
    // =========================================================================

    function test_SubscribeTo() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        assertEq(subId, 1);
        assertEq(subManager.nextSubscriptionId(), 2);

        SubscriptionManager.Subscription memory sub = subManager.getSubscription(subId);
        assertEq(sub.subscriber, subscriber1);
        assertEq(sub.agentId, agentId);
        assertEq(sub.amount, SUB_AMOUNT);
        assertEq(sub.interval, SUB_INTERVAL);
        assertTrue(sub.isActive);
        assertEq(sub.totalPaid, SUB_AMOUNT);
        assertEq(sub.paymentCount, 1);
        // nextPayment should be current timestamp + interval
        assertEq(sub.nextPayment, block.timestamp + SUB_INTERVAL);
    }

    function test_SubscribeTo_TracksUserSubscriptions() public {
        vm.startPrank(subscriber1);
        uint256 subId1 = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );
        uint256 subId2 = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );
        vm.stopPrank();

        uint256[] memory subs = subManager.getUserSubscriptions(subscriber1);
        assertEq(subs.length, 2);
        assertEq(subs[0], subId1);
        assertEq(subs[1], subId2);
    }

    function test_SubscribeTo_FirstPaymentTransferred() public {
        uint256 agentOwnerBefore = agentOwner.balance;
        uint256 deployerBefore = deployer.balance;

        vm.prank(subscriber1);
        subManager.subscribeTo{value: SUB_AMOUNT}(agentId, SUB_AMOUNT, SUB_INTERVAL);

        uint256 expectedFee = (SUB_AMOUNT * 200) / 10000; // 2%
        uint256 expectedAgentAmount = SUB_AMOUNT - expectedFee;

        assertEq(agentOwner.balance - agentOwnerBefore, expectedAgentAmount);
        assertEq(deployer.balance - deployerBefore, expectedFee);
    }

    function test_SubscribeTo_RevertAgentNotFound() public {
        vm.prank(subscriber1);
        vm.expectRevert("Agent not found");
        subManager.subscribeTo{value: SUB_AMOUNT}(999, SUB_AMOUNT, SUB_INTERVAL);
    }

    function test_SubscribeTo_RevertAgentInactive() public {
        vm.prank(agentOwner);
        registry.deactivateAgent(agentId);

        vm.prank(subscriber1);
        vm.expectRevert("Agent inactive");
        subManager.subscribeTo{value: SUB_AMOUNT}(agentId, SUB_AMOUNT, SUB_INTERVAL);
    }

    function test_SubscribeTo_RevertZeroAmount() public {
        vm.prank(subscriber1);
        vm.expectRevert("Zero amount");
        subManager.subscribeTo{value: 0}(agentId, 0, SUB_INTERVAL);
    }

    function test_SubscribeTo_RevertIntervalTooShort() public {
        vm.prank(subscriber1);
        vm.expectRevert("Interval too short");
        subManager.subscribeTo{value: SUB_AMOUNT}(agentId, SUB_AMOUNT, 30);
    }

    function test_SubscribeTo_RevertInsufficientPayment() public {
        vm.prank(subscriber1);
        vm.expectRevert("Insufficient payment for first interval");
        subManager.subscribeTo{value: 0.05 ether}(agentId, SUB_AMOUNT, SUB_INTERVAL);
    }

    // =========================================================================
    // Executing a payment
    // =========================================================================

    function test_ExecutePayment() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        // Warp to next payment time
        vm.warp(block.timestamp + SUB_INTERVAL);

        uint256 agentOwnerBefore = agentOwner.balance;
        uint256 deployerBefore = deployer.balance;

        // Execute scheduled payment (simulating HSS callback with value)
        vm.prank(subscriber1);
        subManager.executePayment{value: SUB_AMOUNT}(subId);

        SubscriptionManager.Subscription memory sub = subManager.getSubscription(subId);
        assertEq(sub.paymentCount, 2);
        assertEq(sub.totalPaid, SUB_AMOUNT * 2);

        uint256 expectedFee = (SUB_AMOUNT * 200) / 10000;
        uint256 expectedAgentAmount = SUB_AMOUNT - expectedFee;
        assertEq(agentOwner.balance - agentOwnerBefore, expectedAgentAmount);
        assertEq(deployer.balance - deployerBefore, expectedFee);
    }

    function test_ExecutePayment_RevertTooEarly() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        // Try to execute before next payment time
        vm.prank(subscriber1);
        vm.expectRevert("Too early");
        subManager.executePayment{value: SUB_AMOUNT}(subId);
    }

    function test_ExecutePayment_RevertInactive() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        // Cancel first
        vm.prank(subscriber1);
        subManager.cancelSubscription(subId);

        vm.warp(block.timestamp + SUB_INTERVAL);

        vm.prank(subscriber1);
        vm.expectRevert("Subscription inactive");
        subManager.executePayment{value: SUB_AMOUNT}(subId);
    }

    function test_ExecutePayment_RevertInsufficientPayment() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        vm.warp(block.timestamp + SUB_INTERVAL);

        vm.prank(subscriber1);
        vm.expectRevert("Insufficient payment");
        subManager.executePayment{value: 0.05 ether}(subId);
    }

    function test_ExecutePayment_RefundsExcess() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        vm.warp(block.timestamp + SUB_INTERVAL);

        uint256 subscriberBefore = subscriber1.balance;

        // Send more than required
        uint256 overpayment = SUB_AMOUNT + 0.05 ether;
        vm.prank(subscriber1);
        subManager.executePayment{value: overpayment}(subId);

        // Subscriber should get refund of 0.05 ether minus the gas
        // Check that subscriber paid exactly SUB_AMOUNT (with some tolerance for gas)
        uint256 subscriberAfter = subscriber1.balance;
        uint256 actualPaid = subscriberBefore - subscriberAfter;
        // The actual paid should be approximately SUB_AMOUNT (excess refunded)
        assertApproxEqAbs(actualPaid, SUB_AMOUNT, 0.001 ether);
    }

    // =========================================================================
    // Cancelling a subscription
    // =========================================================================

    function test_CancelSubscription() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        vm.prank(subscriber1);
        subManager.cancelSubscription(subId);

        SubscriptionManager.Subscription memory sub = subManager.getSubscription(subId);
        assertFalse(sub.isActive);
    }

    function test_CancelSubscription_ByOwner() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        // Contract owner (deployer) can also cancel
        subManager.cancelSubscription(subId);

        SubscriptionManager.Subscription memory sub = subManager.getSubscription(subId);
        assertFalse(sub.isActive);
    }

    function test_CancelSubscription_RevertNotAuthorized() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        vm.prank(subscriber2);
        vm.expectRevert("Not authorized");
        subManager.cancelSubscription(subId);
    }

    function test_CancelSubscription_RevertAlreadyCancelled() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        vm.prank(subscriber1);
        subManager.cancelSubscription(subId);

        vm.prank(subscriber1);
        vm.expectRevert("Already cancelled");
        subManager.cancelSubscription(subId);
    }

    // =========================================================================
    // Multiple payments
    // =========================================================================

    function test_MultiplePayments() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        // Payment 1 already executed in subscribeTo
        SubscriptionManager.Subscription memory sub = subManager.getSubscription(subId);
        assertEq(sub.paymentCount, 1);
        assertEq(sub.totalPaid, SUB_AMOUNT);

        // Payment 2
        vm.warp(block.timestamp + SUB_INTERVAL);
        vm.prank(subscriber1);
        subManager.executePayment{value: SUB_AMOUNT}(subId);

        sub = subManager.getSubscription(subId);
        assertEq(sub.paymentCount, 2);
        assertEq(sub.totalPaid, SUB_AMOUNT * 2);

        // Payment 3
        vm.warp(block.timestamp + SUB_INTERVAL);
        vm.prank(subscriber1);
        subManager.executePayment{value: SUB_AMOUNT}(subId);

        sub = subManager.getSubscription(subId);
        assertEq(sub.paymentCount, 3);
        assertEq(sub.totalPaid, SUB_AMOUNT * 3);

        // Payment 4
        vm.warp(block.timestamp + SUB_INTERVAL);
        vm.prank(subscriber1);
        subManager.executePayment{value: SUB_AMOUNT}(subId);

        sub = subManager.getSubscription(subId);
        assertEq(sub.paymentCount, 4);
        assertEq(sub.totalPaid, SUB_AMOUNT * 4);
        assertTrue(sub.isActive);
    }

    function test_MultiplePayments_VerifyFeeAccumulation() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        uint256 agentOwnerStart = agentOwner.balance;
        uint256 deployerStart = deployer.balance;

        // Execute 3 more payments (4 total including initial)
        for (uint256 i = 0; i < 3; i++) {
            vm.warp(block.timestamp + SUB_INTERVAL);
            vm.prank(subscriber1);
            subManager.executePayment{value: SUB_AMOUNT}(subId);
        }

        uint256 expectedFeePerPayment = (SUB_AMOUNT * 200) / 10000;
        uint256 expectedAgentPerPayment = SUB_AMOUNT - expectedFeePerPayment;

        // 3 additional payments after subscribe (the first was before we recorded start balances)
        assertEq(agentOwner.balance - agentOwnerStart, expectedAgentPerPayment * 3);
        assertEq(deployer.balance - deployerStart, expectedFeePerPayment * 3);
    }

    function test_MultipleSubscribers() public {
        vm.prank(subscriber1);
        uint256 subId1 = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        vm.prank(subscriber2);
        uint256 subId2 = subManager.subscribeTo{value: SUB_AMOUNT * 2}(
            agentId,
            SUB_AMOUNT * 2,
            SUB_INTERVAL
        );

        assertEq(subId1, 1);
        assertEq(subId2, 2);

        assertEq(subManager.getUserSubscriptions(subscriber1).length, 1);
        assertEq(subManager.getUserSubscriptions(subscriber2).length, 1);

        assertEq(subManager.getActiveSubscriptionCount(), 2);
    }

    // =========================================================================
    // Admin functions
    // =========================================================================

    function test_SetFee() public {
        subManager.setFee(500);
        assertEq(subManager.platformFeeBps(), 500);
    }

    function test_SetFee_RevertOverMax() public {
        vm.expectRevert("Max 10%");
        subManager.setFee(1001);
    }

    function test_SetFeeRecipient() public {
        address newRecipient = makeAddr("newRecipient");
        subManager.setFeeRecipient(newRecipient);
        assertEq(subManager.feeRecipient(), newRecipient);
    }

    function test_SetFeeRecipient_RevertZeroAddress() public {
        vm.expectRevert("Zero address");
        subManager.setFeeRecipient(address(0));
    }

    // =========================================================================
    // Events
    // =========================================================================

    function test_EmitSubscriptionCreated() public {
        vm.prank(subscriber1);
        vm.expectEmit(true, true, true, true);
        emit SubscriptionManager.SubscriptionCreated(1, subscriber1, agentId, SUB_AMOUNT, SUB_INTERVAL);
        subManager.subscribeTo{value: SUB_AMOUNT}(agentId, SUB_AMOUNT, SUB_INTERVAL);
    }

    function test_EmitPaymentExecuted() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        vm.warp(block.timestamp + SUB_INTERVAL);

        uint256 expectedFee = (SUB_AMOUNT * 200) / 10000;

        vm.prank(subscriber1);
        vm.expectEmit(true, true, false, true);
        emit SubscriptionManager.PaymentExecuted(subId, subscriber1, SUB_AMOUNT, expectedFee, 2);
        subManager.executePayment{value: SUB_AMOUNT}(subId);
    }

    function test_EmitSubscriptionCancelled() public {
        vm.prank(subscriber1);
        uint256 subId = subManager.subscribeTo{value: SUB_AMOUNT}(
            agentId,
            SUB_AMOUNT,
            SUB_INTERVAL
        );

        vm.prank(subscriber1);
        vm.expectEmit(true, false, false, true);
        emit SubscriptionManager.SubscriptionCancelled(subId);
        subManager.cancelSubscription(subId);
    }
}
