'use client';

import { useSendTransaction } from '@privy-io/react-auth';
import { useState } from 'react';
import { encodeFunctionData } from 'viem';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const RECIPIENT_ADDRESS = '0xC934cE64152E2A846a977D51060356a9e5ddd351';

export default function SendDollarButton() {
  const { sendTransaction } = useSendTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Encode USDC transfer function call
      // transfer(address to, uint256 amount)
      // 1 USDC = 1000000 (6 decimals)
      const data = encodeFunctionData({
        abi: [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            outputs: [{ type: 'bool' }],
          },
        ],
        functionName: 'transfer',
        args: [RECIPIENT_ADDRESS, 1000000n], // 1 USDC
      });

      // Send USDC transaction with gas sponsorship
      const result = await sendTransaction(
        {
          to: USDC_ADDRESS,
          value: 0n, // No ETH value, we're calling the USDC contract
          data,
        },
        {
          sponsor: true, // Gas fees sponsored by your app
        }
      );

      setTxHash(result.hash);
      console.log('Transaction successful:', result);
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleSend}
        disabled={isLoading}
        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-500"
      >
        {isLoading ? 'Sending...' : 'Send $1 USDC'}
      </button>

      {txHash && (
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Transaction Successful!
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
            Transaction Failed
          </p>
          <p className="mt-1 text-xs text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
