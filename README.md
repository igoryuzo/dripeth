# ethdca

Making automated DCA accessible to everyone as a public good.

## How It Works

1. Fund wallet with USDC via Coinbase Apple Pay
2. Start DCA - Balance is divided over 52 weeks
3. First swap executes immediately, then weekly on Mondays at 12pm UTC
4. Add USDC anytime - Weekly amount auto-adjusts

**Weekly Amount:** `currentBalance / remainingWeeks`

## Technical Architecture

### Privy Session Signers

User-authorized server keys enable **gasless automated swaps** without requiring signatures for each transaction:

1. User logs in and authorizes a session signer
2. Server stores authorization key (`PRIVY_AUTHORIZATION_PRIVATE_KEY`)
3. Cron job uses this key to execute swaps on user's behalf
4. All transactions are gas-sponsored by Privy

**Result:** True automation - no approval needed for weekly swaps.

### 0x Swap Aggregation

Each swap routes through 0x Protocol for best execution:

1. Cron fetches quote for `USDC → ETH` swap
2. 0x aggregates liquidity across all Base DEXes
3. Returns optimized route with best price
4. Executes via 0x's `AllowanceHolder` contract

**Result:** Best available price across Uniswap, Curve, and other DEXes.

### Infrastructure

- **Vercel KV** - Redis storage for DCA schedules
- **Vercel Cron** - Weekly execution (Mondays 12pm UTC)
- **Base L2** - Low fees, fast finality

## Deployment

### 1. Create Vercel KV Database

Go to Vercel project → Storage → Create Database → Select "KV"

### 2. Environment Variables

```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
PRIVY_AUTHORIZATION_PRIVATE_KEY=your_privy_auth_key
ZEROX_API_KEY=your_0x_api_key
CRON_SECRET=$(openssl rand -base64 32)
```

Vercel KV variables are auto-added when you create the database.

### 3. Deploy

```bash
npm install
npm run build
```

Deploy to Vercel and the cron job will automatically run weekly.

## Stack

- **Next.js 16** - React framework
- **Privy** - Embedded wallets + session signers
- **0x Protocol** - DEX aggregation
- **Vercel** - Hosting + cron + KV storage
- **Base** - L2 network
- **viem** - Ethereum interactions

## Contributing

This is a public good project. Contributions welcome!

## License

MIT
