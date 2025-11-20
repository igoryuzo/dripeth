'use client';

import { useSendTransaction } from '@privy-io/react-auth';
import { useState } from 'react';
import { encodeFunctionData, erc20Abi } from 'viem';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

export default function WithdrawUsdcButton() {
  const { sendTransaction } = useSendTransaction();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    if (!recipient || !amount) {
      setError('Please enter both recipient address and amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Encode USDC transfer function call
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipient as `0x${string}`, BigInt(parseFloat(amount) * 1_000_000)] // USDC has 6 decimals
      });

      // Send USDC transaction with gas sponsorship
      const result = await sendTransaction(
        {
          to: USDC_ADDRESS,
          value: 0n, // No ETH value, we're calling the USDC contract
          data,
          chainId: 8453 // Base
        },
        {
          sponsor: true // Gas fees sponsored by your app
        }
      );

      setTxHash(result.hash);
      console.log('Withdrawal successful:', result);
      
      // Clear form
      setRecipient('');
      setAmount('');
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="space-y-3">
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Recipient Address
          </label>
          <input
            id="recipient"
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Amount (USDC)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            placeholder="10.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      <button
        onClick={handleWithdraw}
        disabled={isLoading || !recipient || !amount}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-500"
      >
        {isLoading ? 'Withdrawing...' : 'Withdraw USDC'}
      </button>

      {txHash && (
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Withdrawal Successful!
          </p>
          <p className="mt-1 text-xs text-green-700 dark:text-green-300 font-mono break-all">
            {txHash}
          </p>
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View on BaseScan →
          </a>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Withdrawal Failed
          </p>
          <p className="mt-1 text-xs text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

