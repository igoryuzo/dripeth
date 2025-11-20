'use client';

import { useFundWallet } from '@privy-io/react-auth';
import { base } from 'viem/chains';

export default function FundWalletButton({ address }: { address?: string }) {
  const { fundWallet } = useFundWallet();

  const handleFund = async () => {
    if (!address) return;
    
    await fundWallet({
      address,
      options: {
        chain: base,
        amount: '20', // Default funding amount in USDC
        asset: 'USDC', // Fund with USDC
        card: {
          preferredProvider: 'coinbase', // Force Coinbase Onramp
        },
      },
    });
  };

  return (
    <button
      onClick={handleFund}
      disabled={!address}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-500"
    >
      Fund Wallet
    </button>
  );
}

