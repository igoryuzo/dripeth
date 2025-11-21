import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/node';
import { encodeFunctionData, erc20Abi, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { readSchedules, writeSchedules, type DCASchedule } from '@/lib/storage';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base  
const NATIVE_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // 0x API uses this for native ETH

const privy = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

export async function GET(request: Request) {
  console.log('🔄 DCA Cron job triggered');
  
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const schedules = await readSchedules();
    const now = Date.now();
    const updated: DCASchedule[] = [];
    const results = [];

    console.log(`📋 Found ${schedules.length} DCA schedule(s)`);

    for (const schedule of schedules) {
      // Skip if not active or not due yet
      if (!schedule.isActive || schedule.nextExecutionTime > now) {
        updated.push(schedule);
        continue;
      }

      // Check if all weeks completed
      if (schedule.executedWeeks >= schedule.totalWeeks) {
        schedule.isActive = false;
        updated.push(schedule);
        results.push({ 
          walletId: schedule.walletId, 
          status: 'completed', 
          message: `DCA completed: ${schedule.executedWeeks} weeks` 
        });
        continue;
      }

      // Get current USDC balance to calculate this week's amount
      console.log(`💰 Fetching USDC balance for wallet ${schedule.walletAddress}...`);
      const balanceResult = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [schedule.walletAddress as `0x${string}`]
      });

      const currentBalance = Number(balanceResult); // in USDC (6 decimals)
      
      if (currentBalance === 0) {
        console.log(`⚠️ No USDC balance for wallet ${schedule.walletId}, skipping this week`);
        updated.push(schedule);
        results.push({ 
          walletId: schedule.walletId, 
          status: 'skipped', 
          message: 'No USDC balance' 
        });
        continue;
      }

      // Calculate this week's swap amount: currentBalance / remainingWeeks
      const remainingWeeks = schedule.totalWeeks - schedule.executedWeeks;
      const weeklyAmount = Math.floor(currentBalance / remainingWeeks); // Round down to avoid dust
      
      console.log(`💰 Executing DCA swap for wallet ${schedule.walletId} (Week ${schedule.executedWeeks + 1}/${schedule.totalWeeks})`);
      console.log(`   Current balance: ${(currentBalance / 1_000_000).toFixed(2)} USDC`);
      console.log(`   Weekly amount: ${(weeklyAmount / 1_000_000).toFixed(2)} USDC`);
      
      try {
        const authContext = {
          authorization_private_keys: [process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY!]
        };

        const amountIn = weeklyAmount; // Already in USDC units (6 decimals)

        // Use 0x Swap API for reliable swaps that work with smart wallets
        console.log('📝 Fetching swap quote from 0x API...');
        
        const quoteParams = new URLSearchParams({
          chainId: '8453', // Base
          sellToken: USDC_ADDRESS,
          buyToken: NATIVE_ETH_ADDRESS, // Native ETH
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
        
        console.log('📝 Swap quote received:', {
          sellAmount: `${(weeklyAmount / 1_000_000).toFixed(2)} USDC`,
          buyAmount: `${(Number(quote.buyAmount) / 1e18).toFixed(6)} ETH`,
          price: quote.price,
          to: quote.transaction?.to || quote.to,
          value: quote.transaction?.value || quote.value || '0x0'
        });

        // Step 1: Approve if needed
        if (quote.allowanceTarget && quote.allowanceTarget !== schedule.walletAddress) {
          console.log('📝 Approving USDC to 0x allowance target...');
          const approveData = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [quote.allowanceTarget as `0x${string}`, BigInt(amountIn) * 2n] // Approve 2x for safety
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

        // Step 2: Execute the swap using 0x's optimized calldata
        console.log('📝 Executing swap via 0x aggregator...');
        
        const txTo = quote.transaction?.to || quote.to;
        const txData = quote.transaction?.data || quote.data;
        let txValue = quote.transaction?.value || quote.value || '0x0';
        
        // Ensure value starts with 0x (Privy requirement)
        if (txValue && !txValue.startsWith('0x')) {
          txValue = txValue === '0' ? '0x0' : `0x${txValue}`;
        }
        
        console.log('📝 Transaction details:', {
          to: txTo,
          hasData: !!txData,
          value: txValue
        });
        
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
        schedule.executedWeeks += 1;
        schedule.lastExecutionTime = now;
        schedule.nextExecutionTime = now + (7 * 24 * 60 * 60 * 1000); // Next week

        updated.push(schedule);
        results.push({
          walletId: schedule.walletId,
          status: 'success',
          transactionHash: result.hash,
          week: schedule.executedWeeks,
          totalWeeks: schedule.totalWeeks,
          weeklyAmount: (weeklyAmount / 1_000_000).toFixed(2)
        });

        console.log(`✅ DCA swap executed for wallet ${schedule.walletId}: ${result.hash}`);
      } catch (error) {
        updated.push(schedule);
        results.push({
          walletId: schedule.walletId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ DCA failed for wallet ${schedule.walletId}:`, error);
      }
    }

    await writeSchedules(updated);

    return NextResponse.json({
      success: true,
      executedCount: results.length,
      results
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron execution failed' },
      { status: 500 }
    );
  }
}

