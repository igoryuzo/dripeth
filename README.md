## ethdca

Dollar-cost averaging (DCA) automation using Privy embedded wallets, session signers, and 0x Swap API. Funding via Coinbase Apple Pay.

## Deployment

### Vercel Cron Jobs

This app uses Vercel Cron Jobs to automatically execute DCA schedules. The cron job runs every 5 minutes.

### Required Environment Variables

Add these to your Vercel project settings:

- `NEXT_PUBLIC_PRIVY_APP_ID` - Your Privy app ID
- `PRIVY_APP_SECRET` - Your Privy app secret
- `PRIVY_AUTHORIZATION_PRIVATE_KEY` - Your Privy authorization private key
- `ZEROX_API_KEY` - Your 0x API key
- `CRON_SECRET` - A random secret string to secure the cron endpoint (generate a strong random string)

### Setup Steps

1. Deploy to Vercel
2. Add all environment variables in Vercel project settings
3. The cron job will automatically run every 5 minutes at `/api/dca/cron`

To generate a secure `CRON_SECRET`, you can use:
```bash
openssl rand -base64 32
```

