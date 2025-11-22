'use client';

import { useSendTransaction, usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';
import { encodeFunctionData, erc20Abi } from 'viem';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';
import { useEthBalance } from '@/hooks/use-eth-balance';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

type AssetType = 'USDC' | 'ETH';

export default function WithdrawButton() {
  const { user } = usePrivy();
  const { sendTransaction } = useSendTransaction();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetType>('USDC');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const embeddedWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'wallet' && account.walletClientType === 'privy'
  );
  const walletAddress = embeddedWallet && 'address' in embeddedWallet ? embeddedWallet.address : undefined;
  
  const { balance: usdcBalance } = useUsdcBalance(walletAddress);
  const { balance: ethBalance } = useEthBalance(walletAddress);

  const handleWithdraw = async () => {
    if (!recipient || !amount) {
      setError('Please enter both recipient address and amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      if (selectedAsset === 'USDC') {
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
        console.log('USDC withdrawal successful:', result);
      } else {
        // Send ETH transaction
        const valueInWei = BigInt(Math.floor(parseFloat(amount) * 1e18)); // ETH has 18 decimals
        
        const result = await sendTransaction(
          {
            to: recipient as `0x${string}`,
            value: valueInWei,
            chainId: 8453 // Base
          },
          {
            sponsor: true // Gas fees sponsored by your app
          }
        );

        setTxHash(result.hash);
        console.log('ETH withdrawal successful:', result);
      }
      
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

  const handleOpenModal = () => {
    setIsOpen(true);
    setError(null);
    setTxHash(null);
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      setIsOpen(false);
      setRecipient('');
      setAmount('');
      setError(null);
      setTxHash(null);
    }
  };

  const setMaxAmount = () => {
    const balance = selectedAsset === 'USDC' ? usdcBalance : ethBalance;
    if (balance) {
      setAmount(balance);
    }
  };

  const currentBalance = selectedAsset === 'USDC' ? usdcBalance : ethBalance;

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98]"
      >
        Withdraw
      </button>

      {isOpen && (
        <>
          {/* Backdrop with blur - Privy style */}
          <div 
            className="modal-centered fixed inset-0 z-[999998]"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
            onClick={handleCloseModal}
          />

          {/* Modal - Bottom on mobile, centered on desktop */}
          <div className="modal-centered fixed z-[999999] bottom-0 left-0 right-0 w-full sm:w-[500px]">
            <div className="bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">
                  Withdraw Funds
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Send to any address on Base
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isLoading}
                className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Asset Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Select Asset
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedAsset('USDC')}
                  className={`rounded-2xl p-4 text-left transition-all ${
                    selectedAsset === 'USDC'
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500 shadow-lg shadow-green-500/10'
                      : 'bg-zinc-100/50 dark:bg-zinc-800/50 border-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">💵</span>
                    {selectedAsset === 'USDC' && (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[var(--foreground)] mb-1">USDC</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {usdcBalance ? `${usdcBalance} available` : 'Loading...'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAsset('ETH')}
                  className={`rounded-2xl p-4 text-left transition-all ${
                    selectedAsset === 'ETH'
                      ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-zinc-100/50 dark:bg-zinc-800/50 border-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">⟠</span>
                    {selectedAsset === 'ETH' && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[var(--foreground)] mb-1">ETH</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {ethBalance ? `${ethBalance} available` : 'Loading...'}
                  </div>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Recipient Address
                </label>
                <input
                  id="recipient"
                  type="text"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="amount" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Amount ({selectedAsset})
                  </label>
                  <button
                    type="button"
                    onClick={setMaxAmount}
                    disabled={isLoading || !currentBalance}
                    className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50"
                  >
                    Max
                  </button>
                </div>
                <input
                  id="amount"
                  type="number"
                  step={selectedAsset === 'USDC' ? '0.01' : '0.000001'}
                  placeholder={selectedAsset === 'USDC' ? '10.00' : '0.001'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleWithdraw}
              disabled={isLoading || !recipient || !amount}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Withdrawing...
                </span>
              ) : (
                `Withdraw ${selectedAsset}`
              )}
            </button>

            {/* Success Message */}
            {txHash && (
              <div className="mt-4 rounded-2xl bg-green-500/10 border border-green-500/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Withdrawal Successful!
                    </p>
                    <p className="mt-1 text-xs text-green-700 dark:text-green-300 font-mono break-all">
                      {txHash}
                    </p>
                    <a
                      href={`https://basescan.org/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 hover:underline"
                    >
                      View on BaseScan
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      Withdrawal Failed
                    </p>
                    <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

