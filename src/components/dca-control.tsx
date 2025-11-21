'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';

interface DCAStatus {
  isActive: boolean;
  executedWeeks: number;
  totalWeeks: number;
  nextExecutionTime: number;
  lastExecutionTime?: number;
}

export default function DCAControl() {
  const { user } = usePrivy();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<DCAStatus | null>(null);

  const embeddedWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'wallet' && account.walletClientType === 'privy'
  );

  const walletAddress = embeddedWallet && 'address' in embeddedWallet ? embeddedWallet.address : undefined;
  const walletId = embeddedWallet && 'id' in embeddedWallet ? embeddedWallet.id : undefined;
  
  const { balance: usdcBalance } = useUsdcBalance(walletAddress);

  // Check if DCA is active
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`/api/dca/schedule?userId=${user.id}`);
        const data = await response.json();
        if (data) {
          setIsActive(data.isActive);
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to check DCA status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [user?.id]);

  const startDCA = async () => {
    if (!user?.id || !walletId || !walletAddress) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/dca/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          walletId,
          walletAddress
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsActive(true);
        setStatus(data.schedule);
      }
    } catch (error) {
      console.error('Failed to start DCA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopDCA = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/dca/schedule?userId=${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setIsActive(false);
        setStatus(null);
      }
    } catch (error) {
      console.error('Failed to stop DCA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!walletAddress) {
    return null;
  }

  // Calculate weekly amount from current balance
  const balance = parseFloat(usdcBalance || '0');
  const remainingWeeks = status ? status.totalWeeks - status.executedWeeks : 52;
  const weeklyAmount = balance > 0 && remainingWeeks > 0 ? balance / remainingWeeks : 0;

  // Calculate time until next swap
  const getTimeUntilNext = () => {
    if (!status || !status.nextExecutionTime) return null;
    const diff = status.nextExecutionTime - Date.now();
    if (diff <= 0) return 'Soon';
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `in ${days}d ${hours}h`;
    return `in ${hours}h`;
  };

  return (
    <div className="w-full glass-card rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all">
      {/* Header with Status Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-md">
            <span className="text-2xl">🔄</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">
              {isActive ? 'DCA Active' : 'DCA Strategy'}
            </h3>
            {isActive && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 pulse-glow"></div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isActive ? (
        // Before Starting DCA
        <>
          {balance > 0 ? (
            <>
              <div className="mb-6 text-center">
                <div className="text-3xl font-bold text-[var(--foreground)] mb-1">
                  ${balance.toFixed(2)}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Ready to DCA
                </div>
              </div>

              <div className="mb-6 space-y-3 rounded-2xl bg-gradient-to-br from-zinc-100/80 to-zinc-50/50 dark:from-zinc-800/80 dark:to-zinc-900/50 p-5 border border-zinc-200/50 dark:border-zinc-700/50">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-center mb-3">
                  Your DCA Plan
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Total Amount</span>
                    <span className="font-semibold text-[var(--foreground)]">${balance.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Duration</span>
                    <span className="font-semibold text-[var(--foreground)]">52 weeks</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <span className="text-zinc-600 dark:text-zinc-400">Weekly Purchase</span>
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">~${weeklyAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={startDCA}
                disabled={isLoading}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Starting...
                  </span>
                ) : (
                  `Start DCA`
                )}
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 mb-4">
                <span className="text-3xl opacity-40">🔒</span>
              </div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                DCA will be available once you fund your wallet
              </p>
            </div>
          )}
        </>
      ) : (
        // Active DCA
        <>
          <div className="mb-8 text-center">
            <div className="text-4xl font-bold text-[var(--foreground)] mb-2 flex items-center justify-center gap-2">
              ${weeklyAmount.toFixed(2)}
              {balance > 0 && status && status.executedWeeks > 0 && (
                <span className="text-base font-normal text-green-600 dark:text-green-400">⬆️</span>
              )}
            </div>
            <div className="text-base text-zinc-600 dark:text-zinc-400 font-medium">
              USDC → ETH every week
            </div>
          </div>

          {/* Progress Bar */}
          {status && (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Week {status.executedWeeks}/{status.totalWeeks}</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{Math.round((status.executedWeeks / status.totalWeeks) * 100)}%</span>
                </div>
                <div className="h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 shadow-sm"
                    style={{ width: `${(status.executedWeeks / status.totalWeeks) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between text-sm rounded-2xl bg-gradient-to-br from-zinc-100/80 to-zinc-50/50 dark:from-zinc-800/80 dark:to-zinc-900/50 px-4 py-3 border border-zinc-200/50 dark:border-zinc-700/50">
                  <span className="text-zinc-600 dark:text-zinc-400">Current Balance</span>
                  <span className="font-semibold text-[var(--foreground)]">${balance.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm rounded-2xl bg-gradient-to-br from-zinc-100/80 to-zinc-50/50 dark:from-zinc-800/80 dark:to-zinc-900/50 px-4 py-3 border border-zinc-200/50 dark:border-zinc-700/50">
                  <span className="text-zinc-600 dark:text-zinc-400">Next Swap</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{getTimeUntilNext()}</span>
                </div>
              </div>

              <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-4 text-center shadow-sm">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  💡 Add USDC anytime to increase your weekly amount
                </p>
              </div>
            </>
          )}

          <button
            onClick={stopDCA}
            disabled={isLoading}
            className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:shadow-xl hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Stopping...
              </span>
            ) : (
              'Stop DCA'
            )}
          </button>
        </>
      )}
    </div>
  );
}

