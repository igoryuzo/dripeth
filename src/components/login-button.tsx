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
        className="rounded-lg bg-zinc-300 px-6 py-2 text-sm font-medium text-zinc-500 cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  if (authenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.email?.address || 'Logged in'}
          </span>
          {embeddedWallet && 'address' in embeddedWallet && (
            <>
              <button
                onClick={() => copyAddress(embeddedWallet.address)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500 font-mono hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
                title="Click to copy wallet address"
              >
                <span>
                  {embeddedWallet.address.slice(0, 6)}...{embeddedWallet.address.slice(-4)}
                </span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 16 16" 
                  fill="currentColor" 
                  className="w-3.5 h-3.5"
                >
                  {copied ? (
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  ) : (
                    <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h2.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V9.5A1.5 1.5 0 0 1 12 11V8.621a3 3 0 0 0-.879-2.121L9 4.379A3 3 0 0 0 6.879 3.5H5.5ZM4 5a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 4 14h5a1.5 1.5 0 0 0 1.5-1.5V6.5A1.5 1.5 0 0 0 9 5H4Z" />
                  )}
                </svg>
              </button>
              <div className="flex items-center gap-2">
                {usdcBalance !== null && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {usdcBalance} USDC
                  </span>
                )}
                {ethBalance !== null && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {ethBalance} ETH
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        <button
          onClick={logout}
          className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      Login
    </button>
  );
}
