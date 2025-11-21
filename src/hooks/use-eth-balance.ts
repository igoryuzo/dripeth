import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

export function useEthBalance(address?: string) {
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
        const result = await publicClient.getBalance({
          address: address as `0x${string}`
        });

        // Convert from wei (18 decimals) to ETH
        const balanceInEth = Number(result) / 1e18;
        setBalance(balanceInEth.toFixed(6));
      } catch (error) {
        console.error('Failed to fetch ETH balance:', error);
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

