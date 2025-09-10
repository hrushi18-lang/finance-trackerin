# Google OAuth Setup Guide

## Prerequisites
1. Google Cloud Console account
2. Supabase project with authentication enabled

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/v1/callback` (for development)
   - Copy the Client ID and Client Secret

## Step 2: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" and enable it
4. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Save the configuration

## Step 3: Update Environment Variables

Add to your `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the auth page
3. Click "Sign up with Google" or "Sign in with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back to your app

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**:
   - Ensure the redirect URI in Google Console matches exactly with Supabase
   - Check for trailing slashes and protocol (http vs https)

2. **"invalid_client" error**:
   - Verify Client ID and Secret are correct
   - Ensure the OAuth consent screen is configured

3. **"access_denied" error**:
   - Check if the OAuth consent screen is published
   - Verify the app domain is added to authorized domains

### Development vs Production:

- **Development**: Use `http://localhost:3000` in redirect URIs
- **Production**: Use your actual domain in redirect URIs
- **Supabase**: The callback URL is always `https://your-project-ref.supabase.co/auth/v1/callback`

## Security Notes

1. Never commit Client Secret to version control
2. Use environment variables for all sensitive data
3. Regularly rotate OAuth credentials
4. Monitor OAuth usage in Google Cloud Console

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
