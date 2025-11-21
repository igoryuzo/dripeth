'use client';

import { usePrivy, useSessionSigners } from '@privy-io/react-auth';
import FundWalletButton from './fund-wallet-button';
import WithdrawButton from './withdraw-usdc-button';
import DCAControl from './dca-control';
import { useEffect } from 'react';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';
import { useEthBalance } from '@/hooks/use-eth-balance';

export default function AuthenticatedContent() {
  const { authenticated, user } = usePrivy();
  const { addSessionSigners } = useSessionSigners();
  
  const embeddedWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'wallet' && account.walletClientType === 'privy'
  );
  const walletAddress = embeddedWallet && 'address' in embeddedWallet ? embeddedWallet.address : undefined;
  
  const { balance: usdcBalance } = useUsdcBalance(walletAddress);
  const { balance: ethBalance } = useEthBalance(walletAddress);

  // Automatically add session signer when user logs in with a wallet
  useEffect(() => {
    const setupSessionSigner = async () => {
      if (authenticated && user?.wallet?.address) {
        try {
          await addSessionSigners({
            address: user.wallet.address,
            signers: [{
              signerId: 'dgg5zke13tkzuleu536fxsf6',
              policyIds: []
            }]
          });
          console.log('✅ Session signer added for DCA automation');
        } catch (error) {
          if (error instanceof Error && (
            error.message.includes('already') || 
            error.message.includes('Duplicate') ||
            error.message.includes('proxy not initialized')
          )) {
            console.log('Session signer already configured or wallet not ready yet');
          } else {
            console.error('Failed to add session signer:', error);
          }
        }
      }
    };

    const timer = setTimeout(setupSessionSigner, 1000);
    return () => clearTimeout(timer);
  }, [authenticated, user?.wallet?.address, addSessionSigners]);

  if (!authenticated) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
        {/* Hero Section */}
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--foreground)] leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Ethereum,
          <span className="block mt-2 pb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Dollar Cost Averaging
          </span>
        </h1>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-col items-center gap-5 max-w-lg mx-auto">
          <div className="glass-card rounded-2xl px-8 py-4 text-base text-zinc-700 dark:text-zinc-300 flex items-center gap-4 shadow-sm">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Secured and automated by</span>
            <img 
              src="/privy-black-logo.svg" 
              alt="Privy" 
              className="h-5 opacity-90 dark:invert"
            />
          </div>
          <div className="glass-card rounded-2xl px-8 py-4 text-base text-zinc-700 dark:text-zinc-300 flex items-center gap-4 shadow-sm">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Swaps routed via</span>
            <img 
              src="/0x-black-logo.svg" 
              alt="0x Protocol" 
              className="h-7 opacity-90 dark:invert"
            />
          </div>
        </div>
      </div>
    );
  }

  const hasBalance = usdcBalance && parseFloat(usdcBalance) > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)] tracking-tight">
            Your DCA Dashboard
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {hasBalance ? 'Ready to automate' : 'Fund your wallet to begin'}
          </p>
        </div>

        {/* Balance Cards */}
        <div className="mb-8 grid grid-cols-2 gap-3">
          <div className="glass-card rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">USDC Balance</div>
            <div className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">
              {usdcBalance !== null ? (
                `$${usdcBalance}`
              ) : (
                <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
              )}
            </div>
          </div>
          <div className="glass-card rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">ETH Balance</div>
            <div className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">
              {ethBalance !== null ? (
                ethBalance
              ) : (
                <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Progressive Disclosure: Show funding prominently when no balance */}
        {!hasBalance ? (
          <div className="mb-8 glass-card rounded-3xl p-8 text-center shadow-lg">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Fund Your Wallet</h3>
              <p className="text-base text-amber-600 dark:text-amber-400 font-medium mb-2">
                Add USDC to start your DCA strategy
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your balance will be automatically divided over 52 weeks
              </p>
            </div>
            <FundWalletButton address={walletAddress} />
          </div>
        ) : (
          <>
            {/* DCA Control - Main Feature */}
            <div className="mb-8">
              <DCAControl />
            </div>

            {/* Secondary Actions - Compact */}
            <div className="space-y-3">
              <div className="glass-card rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10">
                      <span className="text-lg">💳</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)]">Add More Funds</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Top up your balance</div>
                    </div>
                  </div>
                  <FundWalletButton address={walletAddress} />
                </div>
              </div>

              <div className="glass-card rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10">
                      <span className="text-lg">💸</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)]">Withdraw Funds</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">ETH or USDC to any address</div>
                    </div>
                  </div>
                  <WithdrawButton />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
