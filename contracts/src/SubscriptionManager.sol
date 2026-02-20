// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AgentRegistry} from "./AgentRegistry.sol";

/// @notice Interface for Hedera Schedule Service (HSS) system contract at 0x16b
/// @dev Real HSS ABI from https://docs.hedera.com/hedera/core-concepts/smart-contracts/system-smart-contracts/hedera-schedule-service
interface IScheduleService {
    /// @notice Schedule a contract call with the caller paying gas
    /// @param to Target contract address
    /// @param expirySecond Unix timestamp when the schedule expires/executes
    /// @param gasLimit Maximum gas for execution
    /// @param value HBAR amount in tinybars to send
    /// @param callData ABI-encoded function call data
    /// @return responseCode 22 = success
    /// @return scheduleAddress Address of the created schedule entity
    function scheduleCall(
        address to,
        uint256 expirySecond,
        uint256 gasLimit,
        uint64 value,
        bytes calldata callData
    ) external returns (int64 responseCode, address scheduleAddress);
}

/// @title SubscriptionManager
/// @notice Manages recurring subscription payments to AI agents using Hedera Schedule Service (HSS)
/// @dev Targets Hedera HSS bounty - autonomous subscription payments via system contract at 0x16b
contract SubscriptionManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Subscription {
        address subscriber;
        uint256 agentId;
        uint256 amount;
        uint256 interval; // in seconds
        uint256 nextPayment;
        bool isActive;
        uint256 totalPaid;
        uint256 paymentCount;
        address token; // address(0) = native, otherwise ERC20
    }

    AgentRegistry public agentRegistry;
    IScheduleService public constant SCHEDULE_SERVICE =
        IScheduleService(address(0x16b));

    uint256 public nextSubscriptionId = 1;
    uint256 public platformFeeBps = 200; // 2%
    address public feeRecipient;

    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) public userSubscriptions;
    mapping(uint256 => address) public subscriptionScheduleIds;

    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        uint256 indexed agentId,
        uint256 amount,
        uint256 interval
    );
    event PaymentExecuted(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        uint256 amount,
        uint256 fee,
        uint256 paymentCount
    );
    event SubscriptionCancelled(uint256 indexed subscriptionId);

    constructor(address _agentRegistry) Ownable(msg.sender) {
        agentRegistry = AgentRegistry(_agentRegistry);
        feeRecipient = msg.sender;
    }

    /// @notice Subscribe to an AI agent with recurring payments
    /// @param agentId The ID of the agent to subscribe to
    /// @param amount The payment amount per interval (in native tokens)
    /// @param interval The payment interval in seconds
    /// @return subscriptionId The ID of the newly created subscription
    function subscribeTo(
        uint256 agentId,
        uint256 amount,
        uint256 interval
    ) external payable nonReentrant returns (uint256 subscriptionId) {
        AgentRegistry.Agent memory agent = agentRegistry.getAgent(agentId);
        require(agent.owner != address(0), "Agent not found");
        require(agent.isActive, "Agent inactive");
        require(amount > 0, "Zero amount");
        require(interval >= 60, "Interval too short"); // minimum 60 seconds
        require(msg.value >= amount, "Insufficient payment for first interval");

        subscriptionId = nextSubscriptionId++;

        subscriptions[subscriptionId] = Subscription({
            subscriber: msg.sender,
            agentId: agentId,
            amount: amount,
            interval: interval,
            nextPayment: block.timestamp + interval,
            isActive: true,
            totalPaid: 0,
            paymentCount: 0,
            token: address(0)
        });
        userSubscriptions[msg.sender].push(subscriptionId);

        // Execute the first payment immediately
        _processPayment(subscriptionId, msg.value);

        // Schedule the next payment via HSS
        _scheduleNextPayment(subscriptionId);

        emit SubscriptionCreated(subscriptionId, msg.sender, agentId, amount, interval);
    }

    /// @notice Subscribe to an AI agent with recurring ERC20 payments
    /// @dev On Hedera, msg.value is not forwarded by the JSON-RPC relay, so ERC20 is the preferred path
    /// @param agentId The ID of the agent to subscribe to
    /// @param token The ERC20 token to pay with
    /// @param amount The payment amount per interval
    /// @param interval The payment interval in seconds
    /// @return subscriptionId The ID of the newly created subscription
    function subscribeToERC20(
        uint256 agentId,
        address token,
        uint256 amount,
        uint256 interval
    ) external nonReentrant returns (uint256 subscriptionId) {
        AgentRegistry.Agent memory agent = agentRegistry.getAgent(agentId);
        require(agent.owner != address(0), "Agent not found");
        require(agent.isActive, "Agent inactive");
        require(amount > 0, "Zero amount");
        require(token != address(0), "Use subscribeTo for native");
        require(interval >= 60, "Interval too short");

        subscriptionId = nextSubscriptionId++;

        subscriptions[subscriptionId] = Subscription({
            subscriber: msg.sender,
            agentId: agentId,
            amount: amount,
            interval: interval,
            nextPayment: block.timestamp + interval,
            isActive: true,
            totalPaid: 0,
            paymentCount: 0,
            token: token
        });
        userSubscriptions[msg.sender].push(subscriptionId);

        // Execute the first ERC20 payment immediately
        _processERC20Payment(subscriptionId);

        // Schedule the next payment via HSS
        _scheduleNextPayment(subscriptionId);

        emit SubscriptionCreated(subscriptionId, msg.sender, agentId, amount, interval);
    }

    /// @notice Cancel an active subscription
    /// @param subscriptionId The ID of the subscription to cancel
    function cancelSubscription(uint256 subscriptionId) external {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.subscriber == msg.sender || msg.sender == owner(), "Not authorized");
        require(sub.isActive, "Already cancelled");

        sub.isActive = false;

        emit SubscriptionCancelled(subscriptionId);
    }

    /// @notice Execute a scheduled payment - called by HSS or externally
    /// @param subscriptionId The ID of the subscription to process
    function executePayment(uint256 subscriptionId) external payable nonReentrant {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.isActive, "Subscription inactive");
        require(block.timestamp >= sub.nextPayment, "Too early");
        require(msg.value >= sub.amount, "Insufficient payment");

        // Process the payment
        _processPayment(subscriptionId, msg.value);

        // Update next payment time
        sub.nextPayment = block.timestamp + sub.interval;

        // Self-reschedule if still active
        if (sub.isActive) {
            _scheduleNextPayment(subscriptionId);
        }
    }

    /// @notice Get subscription details
    /// @param subscriptionId The ID of the subscription
    /// @return The Subscription struct
    function getSubscription(uint256 subscriptionId) external view returns (Subscription memory) {
        return subscriptions[subscriptionId];
    }

    /// @notice Get all subscription IDs for a user
    /// @param user The user address
    /// @return Array of subscription IDs
    function getUserSubscriptions(address user) external view returns (uint256[] memory) {
        return userSubscriptions[user];
    }

    /// @notice Get total active subscriptions count
    /// @return count Number of active subscriptions
    function getActiveSubscriptionCount() external view returns (uint256 count) {
        for (uint256 i = 1; i < nextSubscriptionId; i++) {
            if (subscriptions[i].isActive) count++;
        }
    }

    /// @notice Update the platform fee (owner only)
    /// @param _feeBps New fee in basis points
    function setFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Max 10%");
        platformFeeBps = _feeBps;
    }

    /// @notice Update the fee recipient (owner only)
    /// @param _feeRecipient New fee recipient address
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Zero address");
        feeRecipient = _feeRecipient;
    }

    /// @dev Process a payment: transfer to agent owner with platform fee
    function _processPayment(uint256 subscriptionId, uint256 value) internal {
        Subscription storage sub = subscriptions[subscriptionId];
        AgentRegistry.Agent memory agent = agentRegistry.getAgent(sub.agentId);

        uint256 fee = (sub.amount * platformFeeBps) / 10000;
        uint256 agentAmount = sub.amount - fee;

        // Transfer to agent owner
        (bool sent,) = agent.owner.call{value: agentAmount}("");
        require(sent, "Agent payment failed");

        // Transfer fee
        if (fee > 0) {
            (bool feeSent,) = feeRecipient.call{value: fee}("");
            require(feeSent, "Fee transfer failed");
        }

        // Refund excess
        uint256 excess = value - sub.amount;
        if (excess > 0) {
            (bool refunded,) = sub.subscriber.call{value: excess}("");
            require(refunded, "Refund failed");
        }

        sub.totalPaid += sub.amount;
        sub.paymentCount++;

        emit PaymentExecuted(subscriptionId, sub.subscriber, sub.amount, fee, sub.paymentCount);
    }

    /// @dev Schedule the next payment via Hedera Schedule Service
    /// @notice Uses the real HSS ABI: scheduleCall(address,uint256,uint256,uint64,bytes)
    function _scheduleNextPayment(uint256 subscriptionId) internal {
        Subscription storage sub = subscriptions[subscriptionId];

        // Encode the executePayment call that HSS will trigger at the scheduled time
        bytes memory callData = abi.encodeWithSelector(
            this.executePayment.selector,
            subscriptionId
        );

        address hssAddr = address(SCHEDULE_SERVICE);

        // Only attempt HSS scheduling if there is code at the HSS address
        // In test environments or non-Hedera chains, 0x16b has no code
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(hssAddr)
        }

        if (codeSize > 0) {
            // Schedule via HSS on Hedera
            // Parameters: target contract, expiry timestamp, gas limit, HBAR value (tinybars), calldata
            try SCHEDULE_SERVICE.scheduleCall(
                address(this),        // target: this contract
                sub.nextPayment,      // expirySecond: when to execute
                200_000,              // gasLimit: enough for executePayment
                uint64(sub.amount / 1e10), // value in tinybars (1 HBAR = 1e8 tinybars, 1e18 wei = 1e8 tinybars)
                callData
            ) returns (int64 responseCode, address scheduleAddress) {
                if (responseCode == 22) {
                    subscriptionScheduleIds[subscriptionId] = scheduleAddress;
                }
            } catch {
                // HSS call failed - payment can still be triggered manually
            }
        }
        // If no code at 0x16b, payment can be triggered manually via executePayment
    }

    /// @notice Execute a scheduled ERC20 payment - called by HSS or externally
    /// @param subscriptionId The ID of the subscription to process
    function executeERC20Payment(uint256 subscriptionId) external nonReentrant {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.isActive, "Subscription inactive");
        require(sub.token != address(0), "Not ERC20 subscription");
        require(block.timestamp >= sub.nextPayment, "Too early");

        _processERC20Payment(subscriptionId);

        sub.nextPayment = block.timestamp + sub.interval;

        if (sub.isActive) {
            _scheduleNextPayment(subscriptionId);
        }
    }

    /// @dev Process an ERC20 payment: pull from subscriber, transfer to agent owner with platform fee
    function _processERC20Payment(uint256 subscriptionId) internal {
        Subscription storage sub = subscriptions[subscriptionId];
        AgentRegistry.Agent memory agent = agentRegistry.getAgent(sub.agentId);

        uint256 fee = (sub.amount * platformFeeBps) / 10000;
        uint256 agentAmount = sub.amount - fee;

        IERC20(sub.token).safeTransferFrom(sub.subscriber, agent.owner, agentAmount);
        if (fee > 0) {
            IERC20(sub.token).safeTransferFrom(sub.subscriber, feeRecipient, fee);
        }

        sub.totalPaid += sub.amount;
        sub.paymentCount++;

        emit PaymentExecuted(subscriptionId, sub.subscriber, sub.amount, fee, sub.paymentCount);
    }

    /// @dev Allow contract to receive native tokens for subscription payments
    receive() external payable {}
}
