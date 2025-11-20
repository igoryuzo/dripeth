import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/node';
import { encodeFunctionData, erc20Abi } from 'viem';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const RECIPIENT_ADDRESS = '0x638d7b6b585F2e248Ecbbc84047A96FD600e204E';

// Initialize Privy client
const privy = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    // Get wallet ID from request body
    const { walletId } = await request.json();

    if (!walletId) {
      return NextResponse.json({ error: 'Wallet ID is required' }, { status: 400 });
    }

    // Encode USDC transfer: $1 USDC (1,000,000 because USDC has 6 decimals)
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [RECIPIENT_ADDRESS as `0x${string}`, 1_000_000n] // 1 USDC
    });

    // Build authorization context with your server's private key
    const authContext = {
      authorization_private_keys: [process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY!]
    };

    // Send transaction using the session signer
    const result = await privy
      .wallets()
      .ethereum()
      .sendTransaction(walletId, {
        caip2: 'eip155:8453', // Base network
        params: {
          transaction: {
            to: USDC_ADDRESS,
            data,
            value: '0x0',
            chain_id: 8453 // Base chain ID as number
          }
        },
        sponsor: true, // Gas sponsorship
        authorization_context: authContext
      });

    console.log('✅ DCA transaction sent:', result.hash);

    return NextResponse.json({
      success: true,
      transactionHash: result.hash,
      amount: '1 USDC',
      recipient: RECIPIENT_ADDRESS
    });

  } catch (error) {
    console.error('❌ DCA execution failed:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to execute DCA',
        details: error
      },
      { status: 500 }
    );
  }
}

