// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AgentRegistry is Ownable, ReentrancyGuard {
    struct Agent {
        address owner;
        string metadataURI;
        uint256 pricePerTask;
        bool isActive;
        uint256 totalTasks;
        uint256 totalRating;
        uint256 ratingCount;
        uint256 createdAt;
    }

    uint256 public nextAgentId = 1;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public ownerAgents;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string metadataURI, uint256 pricePerTask);
    event AgentUpdated(uint256 indexed agentId, string metadataURI, uint256 pricePerTask);
    event AgentDeactivated(uint256 indexed agentId);
    event AgentActivated(uint256 indexed agentId);
    event AgentRated(uint256 indexed agentId, address indexed rater, uint256 rating);

    constructor() Ownable(msg.sender) {}

    function registerAgent(
        string calldata metadataURI,
        uint256 pricePerTask
    ) external returns (uint256 agentId) {
        agentId = nextAgentId++;
        agents[agentId] = Agent({
            owner: msg.sender,
            metadataURI: metadataURI,
            pricePerTask: pricePerTask,
            isActive: true,
            totalTasks: 0,
            totalRating: 0,
            ratingCount: 0,
            createdAt: block.timestamp
        });
        ownerAgents[msg.sender].push(agentId);
        emit AgentRegistered(agentId, msg.sender, metadataURI, pricePerTask);
    }

    function updateAgent(
        uint256 agentId,
        string calldata metadataURI,
        uint256 pricePerTask
    ) external {
        require(agents[agentId].owner == msg.sender, "Not owner");
        agents[agentId].metadataURI = metadataURI;
        agents[agentId].pricePerTask = pricePerTask;
        emit AgentUpdated(agentId, metadataURI, pricePerTask);
    }

    function deactivateAgent(uint256 agentId) external {
        require(agents[agentId].owner == msg.sender, "Not owner");
        agents[agentId].isActive = false;
        emit AgentDeactivated(agentId);
    }

    function activateAgent(uint256 agentId) external {
        require(agents[agentId].owner == msg.sender, "Not owner");
        agents[agentId].isActive = true;
        emit AgentActivated(agentId);
    }

    function rateAgent(uint256 agentId, uint256 rating) external {
        require(rating >= 1 && rating <= 5, "Rating 1-5");
        require(agents[agentId].isActive, "Agent inactive");
        agents[agentId].totalRating += rating;
        agents[agentId].ratingCount++;
        emit AgentRated(agentId, msg.sender, rating);
    }

    function incrementTasks(uint256 agentId) external {
        agents[agentId].totalTasks++;
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    function getOwnerAgents(address owner) external view returns (uint256[] memory) {
        return ownerAgents[owner];
    }

    function getAgentRating(uint256 agentId) external view returns (uint256 avgRating) {
        Agent memory agent = agents[agentId];
        if (agent.ratingCount == 0) return 0;
        return (agent.totalRating * 100) / agent.ratingCount;
    }

    function getActiveAgentCount() external view returns (uint256 count) {
        for (uint256 i = 1; i < nextAgentId; i++) {
            if (agents[i].isActive) count++;
        }
    }
}
