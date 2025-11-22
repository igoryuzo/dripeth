import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/node';
import { encodeFunctionData, erc20Abi, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { readSchedules, writeSchedules } from '@/lib/storage';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const NATIVE_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const privy = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

// Execute first DCA swap immediately when user starts
export async function POST(request: NextRequest) {
  console.log('🚀 Executing immediate first DCA swap');
  
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const schedules = await readSchedules();
    const schedule = schedules.find(s => s.userId === userId && s.isActive);

    if (!schedule) {
      return NextResponse.json({ error: 'No active schedule found' }, { status: 404 });
    }

    // Get current USDC balance
    console.log(`💰 Fetching USDC balance for wallet ${schedule.walletAddress}...`);
    const balanceResult = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [schedule.walletAddress as `0x${string}`]
    });

    const currentBalance = Number(balanceResult);
    
    if (currentBalance === 0) {
      return NextResponse.json({ 
        error: 'No USDC balance available',
        status: 'skipped' 
      }, { status: 400 });
    }

    // Calculate first week's amount
    const remainingWeeks = schedule.totalWeeks - schedule.executedWeeks;
    const weeklyAmount = Math.floor(currentBalance / remainingWeeks);
    
    console.log(`💰 First swap: ${(weeklyAmount / 1_000_000).toFixed(2)} USDC`);
    
    // Execute the swap
    const authContext = {
      authorization_private_keys: [process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY!]
    };

    const amountIn = weeklyAmount;

    console.log('📝 Fetching swap quote from 0x API...');
    
    const quoteParams = new URLSearchParams({
      chainId: '8453',
      sellToken: USDC_ADDRESS,
      buyToken: NATIVE_ETH_ADDRESS,
      sellAmount: amountIn.toString(),
      taker: schedule.walletAddress
    });

    const quoteResponse = await fetch(
      `https://api.0x.org/swap/allowance-holder/quote?${quoteParams}`,
      {
        headers: {
          '0x-api-key': process.env.ZEROX_API_KEY || '',
          '0x-version': 'v2'
        }
      }
    );

    if (!quoteResponse.ok) {
      throw new Error(`0x API error: ${await quoteResponse.text()}`);
    }

    const quote = await quoteResponse.json();
    
    console.log('📝 Swap quote received');

    // Approve if needed
    if (quote.allowanceTarget && quote.allowanceTarget !== schedule.walletAddress) {
      console.log('📝 Approving USDC...');
      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [quote.allowanceTarget as `0x${string}`, BigInt(amountIn) * 2n]
      });

      await privy
        .wallets()
        .ethereum()
        .sendTransaction(schedule.walletId, {
          caip2: 'eip155:8453',
          params: {
            transaction: {
              to: USDC_ADDRESS,
              data: approveData,
              value: '0x0',
              chain_id: 8453
            }
          },
          sponsor: true,
          authorization_context: authContext
        });

      console.log('✅ USDC approved');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Execute the swap
    console.log('📝 Executing swap...');
    
    const txTo = quote.transaction?.to || quote.to;
    const txData = quote.transaction?.data || quote.data;
    let txValue = quote.transaction?.value || quote.value || '0x0';
    
    if (txValue && !txValue.startsWith('0x')) {
      txValue = txValue === '0' ? '0x0' : `0x${txValue}`;
    }
    
    const result = await privy
      .wallets()
      .ethereum()
      .sendTransaction(schedule.walletId, {
        caip2: 'eip155:8453',
        params: {
          transaction: {
            to: txTo,
            data: txData,
            value: txValue,
            chain_id: 8453
          }
        },
        sponsor: true,
        authorization_context: authContext
      });

    // Update schedule
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    schedule.executedWeeks += 1;
    schedule.lastExecutionTime = now;
    schedule.nextExecutionTime = now + oneWeek; // Next one in 1 week

    const updatedSchedules = schedules.map(s => 
      s.userId === userId ? schedule : s
    );
    await writeSchedules(updatedSchedules);

    console.log(`✅ First DCA swap executed: ${result.hash}`);

    return NextResponse.json({
      success: true,
      transactionHash: result.hash,
      week: schedule.executedWeeks,
      totalWeeks: schedule.totalWeeks,
      weeklyAmount: (weeklyAmount / 1_000_000).toFixed(2),
      nextSwapIn: '1 week'
    });

  } catch (error) {
    console.error('❌ First DCA execution failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute first swap',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

