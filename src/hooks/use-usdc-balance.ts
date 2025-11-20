import { useEffect, useState } from 'react';
import { createPublicClient, http, erc20Abi } from 'viem';
import { base } from 'viem/chains';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

export function useUsdcBalance(address?: string) {
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      setIsLoading(true);
      try {
        const result = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        });

        // Convert from 6 decimals to display format
        const balanceInUsdc = Number(result) / 1_000_000;
        setBalance(balanceInUsdc.toFixed(2));
      } catch (error) {
        console.error('Failed to fetch USDC balance:', error);
        setBalance(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();

    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);

    return () => clearInterval(interval);
  }, [address]);

  return { balance, isLoading };
}

