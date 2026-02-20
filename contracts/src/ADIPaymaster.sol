// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

struct PackedUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    bytes32 accountGasLimits;
    uint256 preVerificationGas;
    bytes32 gasFees;
    bytes paymasterAndData;
    bytes signature;
}

interface IEntryPoint {
    function depositTo(address account) external payable;
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;
    function balanceOf(address account) external view returns (uint256);
    function addStake(uint32 unstakeDelaySec) external payable;
}

/// @title ADIPaymaster - ERC-4337 Verifying Paymaster for ADI Chain
/// @notice Sponsors gas for user operations when signed by a trusted verifier
/// @dev Compatible with EntryPoint V0.7 at 0x0000000071727De22E5E9d8BAf0edAc6f37da032
contract ADIPaymaster is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IEntryPoint public immutable entryPoint;
    address public verifyingSigner;

    mapping(address => uint256) public sponsoredCount;
    mapping(address => bool) public isWhitelisted;
    uint256 public maxSponsoredPerUser = 50;
    uint256 public totalSponsored;

    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event UserSponsored(address indexed user, bytes32 indexed userOpHash, uint256 count);
    event Deposited(address indexed sender, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event WhitelistUpdated(address indexed user, bool status);

    constructor(address _entryPoint, address _owner, address _signer) Ownable(_owner) {
        entryPoint = IEntryPoint(_entryPoint);
        verifyingSigner = _signer;
    }

    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 /* maxCost */
    ) external returns (bytes memory context, uint256 validationData) {
        require(msg.sender == address(entryPoint), "Only EntryPoint");
        return _validateInner(userOp, userOpHash);
    }

    function _validateInner(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal returns (bytes memory, uint256) {
        bytes calldata pData = userOp.paymasterAndData[52:];
        require(pData.length >= 77, "Invalid paymaster data");

        uint48 validUntil = uint48(bytes6(pData[0:6]));
        uint48 validAfter = uint48(bytes6(pData[6:12]));

        bool approved = _verifySignature(userOp, pData[12:], validUntil, validAfter);
        approved = approved && _checkLimits(userOp.sender);

        if (approved) {
            sponsoredCount[userOp.sender]++;
            totalSponsored++;
            emit UserSponsored(userOp.sender, userOpHash, sponsoredCount[userOp.sender]);
        }

        return ("", _packValidationData(!approved, validUntil, validAfter));
    }

    function _verifySignature(
        PackedUserOperation calldata userOp,
        bytes calldata signature,
        uint48 validUntil,
        uint48 validAfter
    ) internal view returns (bool) {
        bytes32 hash = getHash(userOp, validUntil, validAfter).toEthSignedMessageHash();
        return hash.recover(signature) == verifyingSigner;
    }

    function _checkLimits(address sender) internal view returns (bool) {
        return isWhitelisted[sender] || sponsoredCount[sender] < maxSponsoredPerUser;
    }

    function getHash(
        PackedUserOperation calldata userOp,
        uint48 validUntil,
        uint48 validAfter
    ) public view returns (bytes32) {
        return keccak256(abi.encode(
            userOp.sender, userOp.nonce,
            keccak256(userOp.initCode), keccak256(userOp.callData),
            userOp.accountGasLimits, userOp.preVerificationGas, userOp.gasFees,
            block.chainid, address(this), validUntil, validAfter
        ));
    }

    function postOp(uint8, bytes calldata, uint256, uint256) external {
        require(msg.sender == address(entryPoint), "Only EntryPoint");
    }

    // --- Admin ---

    function setSigner(address _signer) external onlyOwner {
        emit SignerUpdated(verifyingSigner, _signer);
        verifyingSigner = _signer;
    }

    function setMaxSponsored(uint256 _max) external onlyOwner {
        maxSponsoredPerUser = _max;
    }

    function setWhitelist(address user, bool status) external onlyOwner {
        isWhitelisted[user] = status;
        emit WhitelistUpdated(user, status);
    }

    function batchWhitelist(address[] calldata users, bool status) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            isWhitelisted[users[i]] = status;
            emit WhitelistUpdated(users[i], status);
        }
    }

    function deposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
        emit Deposited(msg.sender, msg.value);
    }

    function withdrawTo(address payable to, uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(to, amount);
        emit Withdrawn(to, amount);
    }

    function getDeposit() external view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    function addStake(uint32 unstakeDelaySec) external payable onlyOwner {
        entryPoint.addStake{value: msg.value}(unstakeDelaySec);
    }

    function getSponsorshipInfo(address user) external view returns (uint256 count, uint256 remaining, bool whitelisted) {
        count = sponsoredCount[user];
        whitelisted = isWhitelisted[user];
        remaining = whitelisted ? type(uint256).max : (maxSponsoredPerUser > count ? maxSponsoredPerUser - count : 0);
    }

    receive() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
        emit Deposited(msg.sender, msg.value);
    }

    function _packValidationData(bool sigFailed, uint48 validUntil, uint48 validAfter) internal pure returns (uint256) {
        return (sigFailed ? 1 : 0) | (uint256(validUntil) << 160) | (uint256(validAfter) << (160 + 48));
    }
}
