import { NextResponse } from "next/server";
import {
  createWalletClient,
  http,
  encodePacked,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  toHex,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { adiTestnet } from "@/lib/chains";

const PAYMASTER_ADDRESS = process.env.NEXT_PUBLIC_ADI_PAYMASTER as `0x${string}`;
const SIGNER_PRIVATE_KEY = process.env.PAYMASTER_SIGNER_PRIVATE_KEY as `0x${string}`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender, nonce, initCode, callData, accountGasLimits, preVerificationGas, gasFees } = body;

    if (!SIGNER_PRIVATE_KEY || SIGNER_PRIVATE_KEY === "0x_your_signer_private_key_here") {
      return NextResponse.json(
        { error: "Paymaster signer not configured" },
        { status: 500 }
      );
    }

    const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);

    // Set validity window: valid for 1 hour from now
    const now = Math.floor(Date.now() / 1000);
    const validAfter = now - 60; // 1 minute grace period
    const validUntil = now + 3600; // 1 hour from now

    // Compute the hash that the paymaster contract will verify
    const hash = keccak256(
      encodeAbiParameters(
        parseAbiParameters(
          "address, uint256, bytes32, bytes32, bytes32, uint256, bytes32, uint256, address, uint48, uint48"
        ),
        [
          sender as `0x${string}`,
          BigInt(nonce),
          keccak256(initCode as Hex || "0x"),
          keccak256(callData as Hex),
          accountGasLimits as `0x${string}`,
          BigInt(preVerificationGas),
          gasFees as `0x${string}`,
          BigInt(adiTestnet.id), // chainId
          PAYMASTER_ADDRESS,
          validUntil,
          validAfter,
        ]
      )
    );

    // Sign the hash
    const signature = await account.signMessage({
      message: { raw: hash as `0x${string}` },
    });

    // Encode validUntil (6 bytes) + validAfter (6 bytes) + signature
    const validUntilHex = toHex(validUntil, { size: 6 });
    const validAfterHex = toHex(validAfter, { size: 6 });

    const paymasterData = encodePacked(
      ["bytes6", "bytes6", "bytes"],
      [validUntilHex as `0x${string}`, validAfterHex as `0x${string}`, signature]
    );

    return NextResponse.json({
      paymaster: PAYMASTER_ADDRESS,
      paymasterData,
      validUntil,
      validAfter,
      signature,
    });
  } catch (error) {
    console.error("Paymaster signing error:", error);
    return NextResponse.json(
      { error: "Failed to sign UserOperation" },
      { status: 500 }
    );
  }
}
