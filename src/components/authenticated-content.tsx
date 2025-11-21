'use client';

import { usePrivy, useSessionSigners } from '@privy-io/react-auth';
import FundWalletButton from './fund-wallet-button';
import WithdrawUsdcButton from './withdraw-usdc-button';
import DCAControl from './dca-control';
import { useEffect } from 'react';

export default function AuthenticatedContent() {
  const { authenticated, user } = usePrivy();
  const { addSessionSigners } = useSessionSigners();

  // Automatically add session signer when user logs in with a wallet
  useEffect(() => {
    const setupSessionSigner = async () => {
      if (authenticated && user?.wallet?.address) {
        try {
          await addSessionSigners({
            address: user.wallet.address,
            signers: [{
              signerId: 'dgg5zke13tkzuleu536fxsf6', // Your DCA server key ID
              policyIds: [] // No policy = full permissions for DCA
            }]
          });
          console.log('✅ Session signer added for DCA automation');
        } catch (error) {
          // Ignore duplicate signer errors - this is expected on re-renders
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

    // Add a small delay to ensure wallet is fully initialized
    const timer = setTimeout(setupSessionSigner, 1000);
    return () => clearTimeout(timer);
  }, [authenticated, user?.wallet?.address, addSessionSigners]);

  if (!authenticated) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-bold text-zinc-900 dark:text-white sm:text-6xl">
          Welcome to ethdca
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Your journey starts here. Discover something amazing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-bold text-zinc-900 dark:text-white sm:text-6xl">
        Welcome back!
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
        Send a transaction on Base network with sponsored gas fees.
      </p>
      <div className="mt-8 flex flex-col gap-6 items-center w-full max-w-2xl">
        <FundWalletButton address={user?.wallet?.address} />

        <div className="w-full border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            DCA Automation
          </h2>
          <DCAControl />
        </div>
        
        <div className="w-full border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Withdraw USDC
          </h2>
          <WithdrawUsdcButton />
        </div>
      </div>
    </div>
  );
}
