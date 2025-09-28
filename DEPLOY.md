# Deployment Guide for Harmonious Habitats

## Netlify Deployment

### Required Environment Variables

You MUST set these environment variables in Netlify:

1. Go to Netlify Dashboard > Site Settings > Environment Variables
2. Add these variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL (e.g., https://vcbhqzwrmahdmfeamgtl.supabase.co)
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

**IMPORTANT**: Do NOT add the service role key or database URL to Netlify - those are for local development only.

### Build Settings

The following settings are already configured in `netlify.toml`:
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 18

### Common Issues & Solutions

#### 1. Build Fails with "Missing environment variables"
**Solution**: Ensure you've added `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify environment variables.

#### 2. Blank page after deployment
**Solution**: Check browser console for errors. The app requires environment variables to connect to Supabase.

#### 3. "Cannot find module" errors
**Solution**: Clear cache and redeploy:
- In Netlify: Deploy settings > Clear cache and deploy site

#### 4. Authentication not working
**Solution**:
- Ensure your Supabase URL is correct
- Add your Netlify domain to Supabase Auth settings (Authentication > URL Configuration > Site URL)

### Supabase Configuration

1. In Supabase Dashboard > Authentication > URL Configuration:
   - Add your Netlify URL to "Site URL" (e.g., https://your-site.netlify.app)
   - Add the same URL to "Redirect URLs"

2. For production, re-enable email confirmations:
   - Authentication > Settings > Enable email confirmations

### Manual Deployment Steps

If automatic deployment fails:

1. Build locally:
```bash
npm run build
```

2. Drag the `dist` folder to Netlify's manual deploy area

### Environment Variables Reference

| Variable | Required | Where to Set | Description |
|----------|----------|--------------|-------------|
| VITE_SUPABASE_URL | Yes | Netlify | Your Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Yes | Netlify | Supabase anon/public key |
| SUPABASE_SERVICE_ROLE_KEY | No | Local only | Never add to Netlify |
| DATABASE_URL | No | Local only | Never add to Netlify |