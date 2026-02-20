// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {ADIPaymaster, PackedUserOperation, IEntryPoint} from "../src/ADIPaymaster.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract MockEntryPoint {
    mapping(address => uint256) public balances;

    function depositTo(address account) external payable {
        balances[account] += msg.value;
    }

    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external {
        balances[msg.sender] -= withdrawAmount;
        (bool sent,) = withdrawAddress.call{value: withdrawAmount}("");
        require(sent, "withdraw failed");
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function addStake(uint32) external payable {
        // no-op for testing
    }

    receive() external payable {}
}

contract ADIPaymasterTest is Test {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    ADIPaymaster public paymaster;
    MockEntryPoint public entryPoint;

    uint256 public signerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    address public signer;
    address public owner = address(this);
    address public user1 = makeAddr("user1");

    function setUp() public {
        // Set block.timestamp to a reasonable value to avoid underflow in validAfter calculations
        vm.warp(1000);

        signer = vm.addr(signerPrivateKey);
        entryPoint = new MockEntryPoint();
        paymaster = new ADIPaymaster(address(entryPoint), owner, signer);

        // Fund the paymaster
        vm.deal(address(this), 100 ether);
        paymaster.deposit{value: 10 ether}();
    }

    function test_Constructor() public view {
        assertEq(address(paymaster.entryPoint()), address(entryPoint));
        assertEq(paymaster.verifyingSigner(), signer);
        assertEq(paymaster.owner(), owner);
    }

    function test_Deposit() public {
        uint256 deposit = paymaster.getDeposit();
        assertEq(deposit, 10 ether);
    }

    function test_DepositViaReceive() public {
        (bool sent,) = address(paymaster).call{value: 5 ether}("");
        assertTrue(sent);
        assertEq(paymaster.getDeposit(), 15 ether);
    }

    function test_WithdrawTo() public {
        address payable recipient = payable(makeAddr("recipient"));

        paymaster.withdrawTo(recipient, 2 ether);
        assertEq(recipient.balance, 2 ether);
        assertEq(paymaster.getDeposit(), 8 ether);
    }

    function test_WithdrawTo_RevertNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        paymaster.withdrawTo(payable(user1), 1 ether);
    }

    function test_SetSigner() public {
        address newSigner = makeAddr("newSigner");
        paymaster.setSigner(newSigner);
        assertEq(paymaster.verifyingSigner(), newSigner);
    }

    function test_SetSigner_RevertNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        paymaster.setSigner(user1);
    }

    function test_SetMaxSponsored() public {
        paymaster.setMaxSponsored(100);
        assertEq(paymaster.maxSponsoredPerUser(), 100);
    }

    function test_Whitelist() public {
        paymaster.setWhitelist(user1, true);
        assertTrue(paymaster.isWhitelisted(user1));

        paymaster.setWhitelist(user1, false);
        assertFalse(paymaster.isWhitelisted(user1));
    }

    function test_BatchWhitelist() public {
        address[] memory users = new address[](3);
        users[0] = makeAddr("u1");
        users[1] = makeAddr("u2");
        users[2] = makeAddr("u3");

        paymaster.batchWhitelist(users, true);

        assertTrue(paymaster.isWhitelisted(users[0]));
        assertTrue(paymaster.isWhitelisted(users[1]));
        assertTrue(paymaster.isWhitelisted(users[2]));
    }

    function test_GetSponsorshipInfo() public {
        (uint256 count, uint256 remaining, bool whitelisted) = paymaster.getSponsorshipInfo(user1);
        assertEq(count, 0);
        assertEq(remaining, 50); // maxSponsoredPerUser default
        assertFalse(whitelisted);

        paymaster.setWhitelist(user1, true);
        (count, remaining, whitelisted) = paymaster.getSponsorshipInfo(user1);
        assertEq(remaining, type(uint256).max);
        assertTrue(whitelisted);
    }

    function test_GetHash() public view {
        PackedUserOperation memory userOp = _createUserOp(user1);

        bytes32 hash = paymaster.getHash(userOp, 1000, 500);
        assertTrue(hash != bytes32(0));
    }

    function test_ValidatePaymasterUserOp_Success() public {
        PackedUserOperation memory userOp = _createUserOp(user1);

        uint48 validUntil = uint48(block.timestamp + 3600);
        uint48 validAfter = uint48(block.timestamp - 60);

        bytes32 hash = paymaster.getHash(userOp, validUntil, validAfter);
        bytes32 ethHash = hash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, ethHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Construct paymasterAndData: 20 bytes address + 32 bytes (unused in this mock) + validUntil(6) + validAfter(6) + signature(65)
        bytes memory paymasterAndData = abi.encodePacked(
            address(paymaster),  // 20 bytes
            uint256(0),          // 32 bytes (paymasterVerificationGasLimit + paymasterPostOpGasLimit)
            bytes6(uint48(validUntil)),
            bytes6(uint48(validAfter)),
            signature
        );
        userOp.paymasterAndData = paymasterAndData;

        vm.prank(address(entryPoint));
        (bytes memory context, uint256 validationData) = paymaster.validatePaymasterUserOp(userOp, hash, 0);

        // Check validation passed (sigFailed = 0)
        uint256 sigFailed = validationData & 1;
        assertEq(sigFailed, 0, "Signature should be valid");

        // Check sponsorship counter
        assertEq(paymaster.sponsoredCount(user1), 1);
        assertEq(paymaster.totalSponsored(), 1);
    }

    function test_ValidatePaymasterUserOp_BadSignature() public {
        PackedUserOperation memory userOp = _createUserOp(user1);

        uint48 validUntil = uint48(block.timestamp + 3600);
        uint48 validAfter = uint48(block.timestamp - 60);

        // Sign with wrong key
        uint256 wrongKey = 0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef;
        bytes32 hash = paymaster.getHash(userOp, validUntil, validAfter);
        bytes32 ethHash = hash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, ethHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        bytes memory paymasterAndData = abi.encodePacked(
            address(paymaster),
            uint256(0),
            bytes6(uint48(validUntil)),
            bytes6(uint48(validAfter)),
            signature
        );
        userOp.paymasterAndData = paymasterAndData;

        vm.prank(address(entryPoint));
        (, uint256 validationData) = paymaster.validatePaymasterUserOp(userOp, hash, 0);

        // sigFailed bit should be 1
        uint256 sigFailed = validationData & 1;
        assertEq(sigFailed, 1, "Bad signature should fail");

        // No sponsorship increment
        assertEq(paymaster.sponsoredCount(user1), 0);
    }

    function test_ValidatePaymasterUserOp_RevertNotEntryPoint() public {
        PackedUserOperation memory userOp = _createUserOp(user1);

        vm.prank(user1);
        vm.expectRevert("Only EntryPoint");
        paymaster.validatePaymasterUserOp(userOp, bytes32(0), 0);
    }

    function test_SponsorshipLimit() public {
        paymaster.setMaxSponsored(2);

        PackedUserOperation memory userOp = _createUserOp(user1);
        uint48 validUntil = uint48(block.timestamp + 3600);
        uint48 validAfter = uint48(block.timestamp - 60);

        // Sponsor 2 times (the max)
        for (uint256 i = 0; i < 2; i++) {
            bytes32 hash = paymaster.getHash(userOp, validUntil, validAfter);
            bytes32 ethHash = hash.toEthSignedMessageHash();
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, ethHash);
            bytes memory signature = abi.encodePacked(r, s, v);

            bytes memory paymasterAndData = abi.encodePacked(
                address(paymaster), uint256(0),
                bytes6(uint48(validUntil)), bytes6(uint48(validAfter)), signature
            );
            userOp.paymasterAndData = paymasterAndData;

            vm.prank(address(entryPoint));
            paymaster.validatePaymasterUserOp(userOp, hash, 0);

            // Increment nonce to make different userOps
            userOp.nonce++;
        }

        assertEq(paymaster.sponsoredCount(user1), 2);

        // 3rd attempt should fail (sigFailed = 1 due to limit)
        bytes32 hash3 = paymaster.getHash(userOp, validUntil, validAfter);
        bytes32 ethHash3 = hash3.toEthSignedMessageHash();
        (uint8 v3, bytes32 r3, bytes32 s3) = vm.sign(signerPrivateKey, ethHash3);
        bytes memory sig3 = abi.encodePacked(r3, s3, v3);

        bytes memory pData3 = abi.encodePacked(
            address(paymaster), uint256(0),
            bytes6(uint48(validUntil)), bytes6(uint48(validAfter)), sig3
        );
        userOp.paymasterAndData = pData3;

        vm.prank(address(entryPoint));
        (, uint256 validationData3) = paymaster.validatePaymasterUserOp(userOp, hash3, 0);

        uint256 sigFailed = validationData3 & 1;
        assertEq(sigFailed, 1, "Should fail due to sponsorship limit");
    }

    function test_WhitelistedUserBypassesLimit() public {
        paymaster.setMaxSponsored(1);
        paymaster.setWhitelist(user1, true);

        PackedUserOperation memory userOp = _createUserOp(user1);
        uint48 validUntil = uint48(block.timestamp + 3600);
        uint48 validAfter = uint48(block.timestamp - 60);

        // Sponsor 3 times even with limit of 1
        for (uint256 i = 0; i < 3; i++) {
            bytes32 hash = paymaster.getHash(userOp, validUntil, validAfter);
            bytes32 ethHash = hash.toEthSignedMessageHash();
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, ethHash);
            bytes memory signature = abi.encodePacked(r, s, v);

            bytes memory paymasterAndData = abi.encodePacked(
                address(paymaster), uint256(0),
                bytes6(uint48(validUntil)), bytes6(uint48(validAfter)), signature
            );
            userOp.paymasterAndData = paymasterAndData;

            vm.prank(address(entryPoint));
            (, uint256 vd) = paymaster.validatePaymasterUserOp(userOp, hash, 0);

            assertEq(vd & 1, 0, "Whitelisted user should always pass");
            userOp.nonce++;
        }

        assertEq(paymaster.sponsoredCount(user1), 3);
    }

    function test_PostOp_RevertNotEntryPoint() public {
        vm.prank(user1);
        vm.expectRevert("Only EntryPoint");
        paymaster.postOp(0, "", 0, 0);
    }

    function test_PostOp_Success() public {
        vm.prank(address(entryPoint));
        paymaster.postOp(0, "", 0, 0);
    }

    // --- Helpers ---

    function _createUserOp(address sender) internal pure returns (PackedUserOperation memory) {
        return PackedUserOperation({
            sender: sender,
            nonce: 0,
            initCode: "",
            callData: hex"deadbeef",
            accountGasLimits: bytes32(uint256(100000) << 128 | uint256(100000)),
            preVerificationGas: 50000,
            gasFees: bytes32(uint256(1 gwei) << 128 | uint256(1 gwei)),
            paymasterAndData: "",
            signature: ""
        });
    }
}
