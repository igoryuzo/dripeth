## ethdca

Dollar-cost averaging (DCA) automation using Privy embedded wallets, session signers, and 0x Swap API. Funding via Coinbase Apple Pay.

### How It Works

**Simple "Set It and Forget It" DCA:**

1. **Deposit USDC** - Fund your wallet with any amount via Coinbase Apple Pay
2. **Start DCA** - Your balance is automatically divided over 52 weeks (1 year)
3. **Weekly Swaps** - Every Monday at 12pm UTC, USDC is swapped to ETH
4. **Dynamic Adjustment** - Add more USDC anytime, and your weekly amount auto-updates
5. **No Complexity** - Just one simple schedule that adapts to your deposits

**Example:**
- Deposit $100 → DCA $1.92/week
- Add $50 later → DCA automatically increases to match new balance
- Week 52 completes → Ready to start a new 52-week cycle

**Weekly Amount Calculation:**
```
weeklyAmount = currentBalance / remainingWeeks
```

## Deployment

### Vercel KV Database

This app uses Vercel KV (Redis) to store DCA schedules. The file system storage doesn't work on Vercel's serverless functions.

### Vercel Cron Jobs

This app uses Vercel Cron Jobs to automatically execute DCA schedules. The cron job runs **every Monday at 12pm UTC** (`0 12 * * 1`).

### Required Environment Variables

Add these to your Vercel project settings:

- `NEXT_PUBLIC_PRIVY_APP_ID` - Your Privy app ID
- `PRIVY_APP_SECRET` - Your Privy app secret
- `PRIVY_AUTHORIZATION_PRIVATE_KEY` - Your Privy authorization private key
- `ZEROX_API_KEY` - Your 0x API key
- `CRON_SECRET` - A random secret string to secure the cron endpoint (generate a strong random string)
- Vercel KV environment variables (automatically added when you create a KV store)

### Setup Steps

1. **Create a Vercel KV Store**:
   - Go to your Vercel project → Storage tab
   - Click "Create Database" → Select "KV"
   - Choose a name (e.g., "ethdca-kv")
   - Select your region
   - Click "Create"
   - The KV environment variables will be automatically added to your project

2. **Add other environment variables** in Vercel project settings

3. **Deploy to Vercel**:
   ```bash
   git add .
   git commit -m "Migrate to Vercel KV storage"
   git push
   ```

4. **The cron job will automatically run** every 5 minutes at `/api/dca/cron`

To generate a secure `CRON_SECRET`, you can use:
```bash
openssl rand -base64 32
```

