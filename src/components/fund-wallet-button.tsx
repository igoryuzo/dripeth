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
        amount: '5', // Default funding amount in USDC
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
      className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
    >
      Add Funds
    </button>
  );
}

