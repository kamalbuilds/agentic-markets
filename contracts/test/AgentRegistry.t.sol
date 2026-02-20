// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;
    address public owner = address(this);
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        registry = new AgentRegistry();
    }

    function test_RegisterAgent() public {
        vm.prank(alice);
        uint256 agentId = registry.registerAgent("ipfs://metadata1", 0.01 ether);

        assertEq(agentId, 1);
        AgentRegistry.Agent memory agent = registry.getAgent(1);
        assertEq(agent.owner, alice);
        assertEq(agent.metadataURI, "ipfs://metadata1");
        assertEq(agent.pricePerTask, 0.01 ether);
        assertTrue(agent.isActive);
        assertEq(agent.totalTasks, 0);
        assertEq(agent.totalRating, 0);
        assertEq(agent.ratingCount, 0);
    }

    function test_RegisterMultipleAgents() public {
        vm.startPrank(alice);
        uint256 id1 = registry.registerAgent("ipfs://agent1", 0.01 ether);
        uint256 id2 = registry.registerAgent("ipfs://agent2", 0.05 ether);
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(registry.nextAgentId(), 3);

        uint256[] memory aliceAgents = registry.getOwnerAgents(alice);
        assertEq(aliceAgents.length, 2);
        assertEq(aliceAgents[0], 1);
        assertEq(aliceAgents[1], 2);
    }

    function test_UpdateAgent() public {
        vm.prank(alice);
        registry.registerAgent("ipfs://old", 0.01 ether);

        vm.prank(alice);
        registry.updateAgent(1, "ipfs://new", 0.02 ether);

        AgentRegistry.Agent memory agent = registry.getAgent(1);
        assertEq(agent.metadataURI, "ipfs://new");
        assertEq(agent.pricePerTask, 0.02 ether);
    }

    function test_UpdateAgent_RevertNotOwner() public {
        vm.prank(alice);
        registry.registerAgent("ipfs://test", 0.01 ether);

        vm.prank(bob);
        vm.expectRevert("Not owner");
        registry.updateAgent(1, "ipfs://hack", 0);
    }

    function test_DeactivateAndActivateAgent() public {
        vm.prank(alice);
        registry.registerAgent("ipfs://test", 0.01 ether);

        vm.prank(alice);
        registry.deactivateAgent(1);
        assertFalse(registry.getAgent(1).isActive);

        vm.prank(alice);
        registry.activateAgent(1);
        assertTrue(registry.getAgent(1).isActive);
    }

    function test_DeactivateAgent_RevertNotOwner() public {
        vm.prank(alice);
        registry.registerAgent("ipfs://test", 0.01 ether);

        vm.prank(bob);
        vm.expectRevert("Not owner");
        registry.deactivateAgent(1);
    }

    function test_RateAgent() public {
        vm.prank(alice);
        registry.registerAgent("ipfs://test", 0.01 ether);

        vm.prank(bob);
        registry.rateAgent(1, 5);

        AgentRegistry.Agent memory agent = registry.getAgent(1);
        assertEq(agent.totalRating, 5);
        assertEq(agent.ratingCount, 1);
        assertEq(registry.getAgentRating(1), 500); // 5.00 * 100
    }

    function test_RateAgent_Multiple() public {
        vm.prank(alice);
        registry.registerAgent("ipfs://test", 0.01 ether);

        vm.prank(bob);
        registry.rateAgent(1, 5);

        vm.prank(alice);
        registry.rateAgent(1, 3);

        // Average = (5+3)/2 = 4.0 => 400
        assertEq(registry.getAgentRating(1), 400);
    }

    function test_RateAgent_RevertInvalidRating() public {
        vm.prank(alice);
        registry.registerAgent("ipfs://test", 0.01 ether);

        vm.prank(bob);
        vm.expectRevert("Rating 1-5");
        registry.rateAgent(1, 0);

        vm.prank(bob);
        vm.expectRevert("Rating 1-5");
        registry.rateAgent(1, 6);
    }

    function test_RateAgent_RevertInactive() public {
        vm.prank(alice);
        registry.registerAgent("ipfs://test", 0.01 ether);

        vm.prank(alice);
        registry.deactivateAgent(1);

        vm.prank(bob);
        vm.expectRevert("Agent inactive");
        registry.rateAgent(1, 5);
    }

    function test_IncrementTasks() public {
        vm.prank(alice);
        registry.registerAgent("ipfs://test", 0.01 ether);

        registry.incrementTasks(1);
        registry.incrementTasks(1);

        assertEq(registry.getAgent(1).totalTasks, 2);
    }

    function test_GetActiveAgentCount() public {
        vm.prank(alice);
        registry.registerAgent("ipfs://a1", 0.01 ether);

        vm.prank(bob);
        registry.registerAgent("ipfs://a2", 0.02 ether);

        assertEq(registry.getActiveAgentCount(), 2);

        vm.prank(alice);
        registry.deactivateAgent(1);

        assertEq(registry.getActiveAgentCount(), 1);
    }

    function test_GetAgentRating_NoRatings() public {
        vm.prank(alice);
        registry.registerAgent("ipfs://test", 0.01 ether);

        assertEq(registry.getAgentRating(1), 0);
    }
}
