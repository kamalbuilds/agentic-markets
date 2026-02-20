// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IAgentRegistry {
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

    function incrementTasks(uint256 agentId) external;
    function getAgent(uint256 agentId) external view returns (Agent memory);
}

contract PaymentRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum PaymentStatus { Pending, Completed, Refunded }

    struct Payment {
        address payer;
        address payee;
        uint256 amount;
        address token;
        uint256 agentId;
        PaymentStatus status;
        uint256 timestamp;
    }

    IAgentRegistry public agentRegistry;
    uint256 public platformFeeBps = 250; // 2.5%
    address public feeRecipient;
    uint256 public totalPayments;
    uint256 public totalVolume;

    mapping(bytes32 => Payment) public payments;
    mapping(address => bytes32[]) public userPayments;

    event PaymentCreated(bytes32 indexed paymentId, address indexed payer, address indexed payee, uint256 amount, address token, uint256 agentId);
    event PaymentCompleted(bytes32 indexed paymentId);
    event PaymentRefunded(bytes32 indexed paymentId);

    constructor(address _agentRegistry) Ownable(msg.sender) {
        agentRegistry = IAgentRegistry(_agentRegistry);
        feeRecipient = msg.sender;
    }

    function payAgent(uint256 agentId) external payable nonReentrant returns (bytes32 paymentId) {
        IAgentRegistry.Agent memory agent = agentRegistry.getAgent(agentId);
        require(agent.isActive, "Agent inactive");
        require(msg.value >= agent.pricePerTask, "Insufficient payment");

        paymentId = keccak256(abi.encodePacked(msg.sender, agent.owner, agentId, block.timestamp, totalPayments));

        uint256 fee = (msg.value * platformFeeBps) / 10000;
        uint256 agentPayment = msg.value - fee;

        payments[paymentId] = Payment({
            payer: msg.sender,
            payee: agent.owner,
            amount: msg.value,
            token: address(0),
            agentId: agentId,
            status: PaymentStatus.Completed,
            timestamp: block.timestamp
        });

        userPayments[msg.sender].push(paymentId);
        userPayments[agent.owner].push(paymentId);
        totalPayments++;
        totalVolume += msg.value;

        (bool sentAgent,) = agent.owner.call{value: agentPayment}("");
        require(sentAgent, "Agent payment failed");

        if (fee > 0) {
            (bool sentFee,) = feeRecipient.call{value: fee}("");
            require(sentFee, "Fee payment failed");
        }

        agentRegistry.incrementTasks(agentId);
        emit PaymentCreated(paymentId, msg.sender, agent.owner, msg.value, address(0), agentId);
        emit PaymentCompleted(paymentId);
    }

    function payAgentERC20(uint256 agentId, address token, uint256 amount) external nonReentrant returns (bytes32 paymentId) {
        IAgentRegistry.Agent memory agent = agentRegistry.getAgent(agentId);
        require(agent.isActive, "Agent inactive");
        require(amount > 0, "Zero amount");

        paymentId = keccak256(abi.encodePacked(msg.sender, agent.owner, agentId, block.timestamp, totalPayments));

        uint256 fee = (amount * platformFeeBps) / 10000;
        uint256 agentPayment = amount - fee;

        payments[paymentId] = Payment({
            payer: msg.sender,
            payee: agent.owner,
            amount: amount,
            token: token,
            agentId: agentId,
            status: PaymentStatus.Completed,
            timestamp: block.timestamp
        });

        userPayments[msg.sender].push(paymentId);
        userPayments[agent.owner].push(paymentId);
        totalPayments++;
        totalVolume += amount;

        IERC20(token).safeTransferFrom(msg.sender, agent.owner, agentPayment);
        if (fee > 0) {
            IERC20(token).safeTransferFrom(msg.sender, feeRecipient, fee);
        }

        agentRegistry.incrementTasks(agentId);
        emit PaymentCreated(paymentId, msg.sender, agent.owner, amount, token, agentId);
        emit PaymentCompleted(paymentId);
    }

    function getUserPayments(address user) external view returns (bytes32[] memory) {
        return userPayments[user];
    }

    function getPayment(bytes32 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }

    function setFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Max 10%");
        platformFeeBps = _feeBps;
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        feeRecipient = _recipient;
    }
}
