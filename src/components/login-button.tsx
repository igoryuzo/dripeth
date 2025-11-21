'use client';

import { usePrivy, useLogin } from '@privy-io/react-auth';
import { useState } from 'react';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';
import { useEthBalance } from '@/hooks/use-eth-balance';

export default function LoginButton() {
  const { ready, authenticated, user, logout } = usePrivy();
  const [copied, setCopied] = useState(false);
  
  const embeddedWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'wallet' && account.walletClientType === 'privy'
  );
  const walletAddress = embeddedWallet && 'address' in embeddedWallet ? embeddedWallet.address : undefined;
  const { balance: usdcBalance } = useUsdcBalance(walletAddress);
  const { balance: ethBalance } = useEthBalance(walletAddress);
  const { login } = useLogin({
    onComplete: ({ user, isNewUser, loginMethod }) => {
      console.log('Login complete:', { user, isNewUser, loginMethod });
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!ready) {
    return (
      <button
        disabled
        className="rounded-xl bg-zinc-200 dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 cursor-not-allowed"
      >
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading
        </span>
      </button>
    );
  }

  if (authenticated && user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Wallet Info - Hidden on small mobile */}
        <div className="hidden sm:flex flex-col items-end gap-0.5">
          {embeddedWallet && 'address' in embeddedWallet && (
            <button
              onClick={() => copyAddress(embeddedWallet.address)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Click to copy wallet address"
            >
              <span>
                {embeddedWallet.address.slice(0, 4)}...{embeddedWallet.address.slice(-4)}
              </span>
              {copied ? (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 16 16" 
                  fill="currentColor" 
                  className="w-3 h-3"
                >
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              ) : (
                <img 
                  src="/copy-icon.svg" 
                  alt="Copy" 
                  className="w-3 h-3 opacity-60"
                />
              )}
            </button>
          )}
        </div>
        
        <button
          onClick={logout}
          className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 sm:px-5 py-2 text-sm font-semibold text-white dark:text-zinc-900 transition-all hover:bg-zinc-700 dark:hover:bg-zinc-300 active:scale-[0.98]"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 sm:px-6 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
    >
      Get Started
    </button>
  );
}
