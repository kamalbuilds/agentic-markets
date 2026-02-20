// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MerchantVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Merchant {
        address owner;
        string name;
        string metadataURI;
        bool isActive;
        uint256 totalRevenue;
        uint256 totalOrders;
        uint256 createdAt;
    }

    struct Order {
        uint256 merchantId;
        address buyer;
        address token;
        uint256 amount;
        bytes32 orderId;
        uint256 timestamp;
    }

    uint256 public nextMerchantId = 1;
    uint256 public platformFeeBps = 200; // 2%
    address public feeRecipient;
    uint256 public totalMerchants;
    uint256 public totalOrderCount;

    mapping(uint256 => Merchant) public merchants;
    mapping(address => uint256) public merchantByAddress;
    mapping(uint256 => mapping(address => uint256)) public merchantBalances; // merchantId => token => balance
    mapping(bytes32 => Order) public orders;
    mapping(uint256 => bytes32[]) public merchantOrders;

    event MerchantRegistered(uint256 indexed merchantId, address indexed owner, string name);
    event CheckoutCompleted(uint256 indexed merchantId, address indexed buyer, address token, uint256 amount, bytes32 orderId);
    event Withdrawal(uint256 indexed merchantId, address token, uint256 amount);

    constructor() Ownable(msg.sender) {
        feeRecipient = msg.sender;
    }

    function registerMerchant(
        string calldata name,
        string calldata metadataURI
    ) external returns (uint256 merchantId) {
        require(merchantByAddress[msg.sender] == 0, "Already registered");

        merchantId = nextMerchantId++;
        merchants[merchantId] = Merchant({
            owner: msg.sender,
            name: name,
            metadataURI: metadataURI,
            isActive: true,
            totalRevenue: 0,
            totalOrders: 0,
            createdAt: block.timestamp
        });
        merchantByAddress[msg.sender] = merchantId;
        totalMerchants++;

        emit MerchantRegistered(merchantId, msg.sender, name);
    }

    function checkout(
        uint256 merchantId,
        bytes32 orderId
    ) external payable nonReentrant {
        require(merchants[merchantId].isActive, "Merchant inactive");
        require(msg.value > 0, "Zero payment");

        uint256 fee = (msg.value * platformFeeBps) / 10000;
        uint256 merchantAmount = msg.value - fee;

        merchantBalances[merchantId][address(0)] += merchantAmount;
        merchants[merchantId].totalRevenue += msg.value;
        merchants[merchantId].totalOrders++;

        orders[orderId] = Order({
            merchantId: merchantId,
            buyer: msg.sender,
            token: address(0),
            amount: msg.value,
            orderId: orderId,
            timestamp: block.timestamp
        });
        merchantOrders[merchantId].push(orderId);
        totalOrderCount++;

        if (fee > 0) {
            (bool sent,) = feeRecipient.call{value: fee}("");
            require(sent, "Fee transfer failed");
        }

        emit CheckoutCompleted(merchantId, msg.sender, address(0), msg.value, orderId);
    }

    function checkoutERC20(
        uint256 merchantId,
        address token,
        uint256 amount,
        bytes32 orderId
    ) external nonReentrant {
        require(merchants[merchantId].isActive, "Merchant inactive");
        require(amount > 0, "Zero amount");

        uint256 fee = (amount * platformFeeBps) / 10000;
        uint256 merchantAmount = amount - fee;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        merchantBalances[merchantId][token] += merchantAmount;
        merchants[merchantId].totalRevenue += amount;
        merchants[merchantId].totalOrders++;

        orders[orderId] = Order({
            merchantId: merchantId,
            buyer: msg.sender,
            token: token,
            amount: amount,
            orderId: orderId,
            timestamp: block.timestamp
        });
        merchantOrders[merchantId].push(orderId);
        totalOrderCount++;

        if (fee > 0) {
            IERC20(token).safeTransfer(feeRecipient, fee);
        }

        emit CheckoutCompleted(merchantId, msg.sender, token, amount, orderId);
    }

    function withdraw(address token) external nonReentrant {
        uint256 merchantId = merchantByAddress[msg.sender];
        require(merchantId != 0, "Not a merchant");

        uint256 balance = merchantBalances[merchantId][token];
        require(balance > 0, "Nothing to withdraw");

        merchantBalances[merchantId][token] = 0;

        if (token == address(0)) {
            (bool sent,) = msg.sender.call{value: balance}("");
            require(sent, "Withdraw failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, balance);
        }

        emit Withdrawal(merchantId, token, balance);
    }

    function getMerchant(uint256 merchantId) external view returns (Merchant memory) {
        return merchants[merchantId];
    }

    function getMerchantOrders(uint256 merchantId) external view returns (bytes32[] memory) {
        return merchantOrders[merchantId];
    }

    function getMerchantBalance(uint256 merchantId, address token) external view returns (uint256) {
        return merchantBalances[merchantId][token];
    }

    function setFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Max 10%");
        platformFeeBps = _feeBps;
    }
}
