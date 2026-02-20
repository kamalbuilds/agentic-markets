// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {PaymentRouter} from "../src/PaymentRouter.sol";
import {MockDDSC} from "../src/MockDDSC.sol";

contract PaymentRouterTest is Test {
    AgentRegistry public registry;
    PaymentRouter public router;
    MockDDSC public ddsc;

    address public deployer = address(this);
    address public alice = makeAddr("alice"); // agent owner
    address public bob = makeAddr("bob");     // payer
    address public carol = makeAddr("carol"); // another payer

    uint256 public agentId;

    receive() external payable {}

    function setUp() public {
        registry = new AgentRegistry();
        router = new PaymentRouter(address(registry));
        ddsc = new MockDDSC();

        // Register an agent owned by alice with price 0.1 ether
        vm.prank(alice);
        agentId = registry.registerAgent("ipfs://agent-alice", 0.1 ether);

        // Fund bob and carol
        vm.deal(bob, 10 ether);
        vm.deal(carol, 10 ether);

        // Give bob DDSC tokens
        ddsc.faucet(bob, 1000 * 1e18);
    }

    function test_PayAgent_Native() public {
        uint256 aliceBefore = alice.balance;
        uint256 deployerBefore = deployer.balance;

        vm.prank(bob);
        bytes32 paymentId = router.payAgent{value: 0.1 ether}(agentId);

        // Check payment recorded
        assertEq(router.totalPayments(), 1);
        assertEq(router.totalVolume(), 0.1 ether);

        // Check fee split: 2.5% = 0.0025 ether fee
        uint256 expectedFee = (0.1 ether * 250) / 10000;
        uint256 expectedAgentPay = 0.1 ether - expectedFee;

        assertEq(alice.balance - aliceBefore, expectedAgentPay);
        assertEq(deployer.balance - deployerBefore, expectedFee);

        // Check payment struct
        PaymentRouter.Payment memory p = router.getPayment(paymentId);
        assertEq(p.payer, bob);
        assertEq(p.payee, alice);
        assertEq(p.amount, 0.1 ether);
        assertEq(p.token, address(0));
        assertEq(p.agentId, agentId);
        assertTrue(p.status == PaymentRouter.PaymentStatus.Completed);

        // Check user payments tracking
        bytes32[] memory bobPayments = router.getUserPayments(bob);
        assertEq(bobPayments.length, 1);
        assertEq(bobPayments[0], paymentId);

        bytes32[] memory alicePayments = router.getUserPayments(alice);
        assertEq(alicePayments.length, 1);

        // Check agent tasks incremented
        assertEq(registry.getAgent(agentId).totalTasks, 1);
    }

    function test_PayAgent_InsufficientPayment() public {
        vm.prank(bob);
        vm.expectRevert("Insufficient payment");
        router.payAgent{value: 0.05 ether}(agentId);
    }

    function test_PayAgent_InactiveAgent() public {
        vm.prank(alice);
        registry.deactivateAgent(agentId);

        vm.prank(bob);
        vm.expectRevert("Agent inactive");
        router.payAgent{value: 0.1 ether}(agentId);
    }

    function test_PayAgent_Overpay() public {
        // Overpaying should work, agent gets extra minus fee
        vm.prank(bob);
        router.payAgent{value: 1 ether}(agentId);

        assertEq(router.totalVolume(), 1 ether);
    }

    function test_PayAgentERC20() public {
        uint256 amount = 100 * 1e18;

        vm.startPrank(bob);
        ddsc.approve(address(router), amount);
        bytes32 paymentId = router.payAgentERC20(agentId, address(ddsc), amount);
        vm.stopPrank();

        // Fee: 2.5% of 100 = 2.5 DDSC
        uint256 expectedFee = (amount * 250) / 10000;
        uint256 expectedAgentPay = amount - expectedFee;

        assertEq(ddsc.balanceOf(alice), expectedAgentPay);
        assertEq(ddsc.balanceOf(deployer), 1_000_000 * 1e18 + expectedFee); // deployer had initial supply + fee

        PaymentRouter.Payment memory p = router.getPayment(paymentId);
        assertEq(p.token, address(ddsc));
        assertEq(p.amount, amount);
        assertEq(router.totalPayments(), 1);
    }

    function test_PayAgentERC20_ZeroAmount() public {
        vm.prank(bob);
        vm.expectRevert("Zero amount");
        router.payAgentERC20(agentId, address(ddsc), 0);
    }

    function test_SetFee() public {
        router.setFee(500); // 5%
        assertEq(router.platformFeeBps(), 500);
    }

    function test_SetFee_RevertOverMax() public {
        vm.expectRevert("Max 10%");
        router.setFee(1001);
    }

    function test_SetFee_RevertNotOwner() public {
        vm.prank(bob);
        vm.expectRevert();
        router.setFee(500);
    }

    function test_SetFeeRecipient() public {
        router.setFeeRecipient(carol);
        assertEq(router.feeRecipient(), carol);
    }

    function test_MultiplePayments() public {
        vm.prank(bob);
        router.payAgent{value: 0.1 ether}(agentId);

        vm.prank(carol);
        router.payAgent{value: 0.2 ether}(agentId);

        assertEq(router.totalPayments(), 2);
        assertEq(router.totalVolume(), 0.3 ether);
        assertEq(registry.getAgent(agentId).totalTasks, 2);
    }
}
