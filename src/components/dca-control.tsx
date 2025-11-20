'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

interface DCAStatus {
  isActive: boolean;
  executedTransactions: number;
  totalTransactions: number;
  nextExecutionTime: number;
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

  // Auto-trigger cron job every 5 minutes when DCA is active
  useEffect(() => {
    if (!isActive) return;

    console.log('⏰ Starting DCA auto-execution (every 1 minute)');

    const executeCron = async () => {
      try {
        console.log('🔄 Triggering DCA execution...');
        const response = await fetch('/api/dca/cron');
        const data = await response.json();
        console.log('✅ DCA execution result:', data);
      } catch (error) {
        console.error('❌ DCA execution failed:', error);
      }
    };

    // Execute immediately on start, then every 1 minute
    executeCron();
    const interval = setInterval(executeCron, 1 * 60 * 1000); // 1 minute
    
    return () => clearInterval(interval);
  }, [isActive]);

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
          walletAddress,
          amount: 1, // $1 USDC
          intervalMinutes: 1, // Every 1 minute
          totalTransactions: 5 // 5 transactions total
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

  return (
    <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
        DCA Automation
      </h3>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Strategy:</span>
          <span className="font-medium text-zinc-900 dark:text-white">Swap USDC → ETH</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Amount per swap:</span>
          <span className="font-medium text-zinc-900 dark:text-white">$1 USDC</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Frequency:</span>
          <span className="font-medium text-zinc-900 dark:text-white">Every 1 minute</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Protocol:</span>
          <span className="font-medium text-zinc-900 dark:text-white">Uniswap V3</span>
        </div>
        {status && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Progress:</span>
            <span className="font-medium text-zinc-900 dark:text-white">
              {status.executedTransactions} / {status.totalTransactions}
            </span>
          </div>
        )}
      </div>

      {isActive ? (
        <button
          onClick={stopDCA}
          disabled={isLoading}
          className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:bg-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-500"
        >
          {isLoading ? 'Stopping...' : 'Stop DCA'}
        </button>
      ) : (
        <button
          onClick={startDCA}
          disabled={isLoading}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-500"
        >
          {isLoading ? 'Starting...' : 'Start DCA ($5 total)'}
        </button>
      )}

      {status && status.isActive && (
        <p className="mt-3 text-xs text-center text-zinc-500 dark:text-zinc-400">
          Next transaction in ~{Math.max(0, Math.floor((status.nextExecutionTime - Date.now()) / 60000))} minutes
        </p>
      )}
    </div>
  );
}

