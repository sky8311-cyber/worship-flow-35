

# Store REVENUECAT_WEBHOOK_SECRET

## What needs to happen

The `REVENUECAT_WEBHOOK_SECRET` needs to be stored as a runtime secret so the `revenuecat-webhook` edge function can verify incoming requests from RevenueCat.

## Steps

### 1. Create the secret value in RevenueCat
In your **RevenueCat Dashboard**:
1. Go to your project → **Project Settings → Webhooks**
2. Set the webhook URL to: `https://jihozsqrrmzzrqvwilyy.supabase.co/functions/v1/revenuecat-webhook`
3. In the **Authorization header** field, enter a strong random string (this is your secret — you create it yourself)
4. Copy that string

### 2. Store it in Lovable
Once you switch me back to implementation mode, I will use the `add_secret` tool to prompt you to paste the value. The secret will be named `REVENUECAT_WEBHOOK_SECRET` and will be available to the edge function at runtime.

### 3. Test the webhook
After storing the secret, I'll redeploy the edge function and send a test POST to verify it accepts valid requests and rejects invalid ones.

## Summary
- No code changes needed — the edge function already reads `REVENUECAT_WEBHOOK_SECRET` from `Deno.env.get()`
- Just need to store the secret value and test

