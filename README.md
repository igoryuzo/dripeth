## ethdca

Dollar-cost averaging (DCA) automation using Privy embedded wallets, session signers, and 0x Swap API. Funding via Coinbase Apple Pay.

## Deployment

### Vercel KV Database

This app uses Vercel KV (Redis) to store DCA schedules. The file system storage doesn't work on Vercel's serverless functions.

### Vercel Cron Jobs

This app uses Vercel Cron Jobs to automatically execute DCA schedules. The cron job runs every 5 minutes.

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

