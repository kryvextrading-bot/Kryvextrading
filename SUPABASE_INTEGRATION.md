# Supabase Integration Guide

This document explains how to set up and use Supabase with the Kryvextrading.com application.

## 🚀 Quick Setup

### 1. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update the environment variables with your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://trzvvacsfxfpwuekenfc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xhmrUNQOfyYeqX44jlSAKA_HVQpKndg

# External APIs (get your own keys)
VITE_ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
VITE_TWELVE_DATA_KEY=your_twelve_data_key_here

# API Configuration
VITE_API_URL=http://localhost:3001/api
```

### 2. Database Setup

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL script to create all tables and policies

### 3. Storage Setup

The schema automatically creates a storage bucket for KYC documents:
- Bucket name: `kyc-documents`
- Access: Private (only users and admins can access)

## 📊 Database Schema

### Tables

#### `users`
User accounts and profile information
- Authentication via Supabase Auth
- KYC status tracking
- Account balances and settings

#### `transactions`
All financial transactions
- Trading, deposits, withdrawals
- Status tracking (Pending, Completed, Failed)
- Detailed transaction metadata

#### `kyc_documents`
KYC verification documents
- File uploads to Supabase Storage
- Verification status tracking
- Admin review workflow

#### `system_settings`
Platform configuration
- General settings (platform name, maintenance mode)
- Security policies (password requirements, 2FA)
- Trading limits and rules

#### `investments`
Investment products
- Quant trading, staking, arbitrage options
- Risk levels and expected returns
- Minimum investment amounts

## 🔐 Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Admins can access all data
- Automatic JWT-based authentication

### Storage Policies
- Secure file uploads for KYC documents
- User-isolated document storage
- Admin access for verification

## 🛠️ API Integration

### Authentication
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { login, register, logout, user } = useAuth();

// Login
await login(email, password);

// Register
await register({ email, first_name, last_name, ... });

// Logout
await logout();
```

### Database Operations
```typescript
import supabaseApi from '@/services/supabase-api';

// Get users
const users = await supabaseApi.getUsers();

// Create transaction
const transaction = await supabaseApi.createTransaction({
  user_id: userId,
  type: 'Trade',
  asset: 'BTC/USDT',
  amount: 100,
  value: 67000,
  status: 'Pending'
});

// Upload KYC document
const document = await supabaseApi.uploadKYCDocument(
  userId,
  'ID Card',
  file
);
```

## 📁 File Structure

```
src/
├── lib/
│   └── supabase.ts          # Supabase client and types
├── services/
│   └── supabase-api.ts     # API service layer
├── contexts/
│   ├── AuthContext.tsx      # Authentication context
│   └── WalletContext.tsx    # Wallet and transactions
└── .env.example            # Environment template
```

## 🔄 Migration from Mock Data

The application now supports both mock data (for development) and Supabase data (for production):

### Mock Data Mode
- Uses in-memory data
- No database required
- Perfect for development and demos

### Supabase Mode
- Persistent data storage
- Real authentication
- Production-ready

## 🚀 Deployment

### Environment Variables
Make sure to set these environment variables in your hosting platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ALPHA_VANTAGE_KEY`
- `VITE_TWELVE_DATA_KEY`

### Build and Deploy
```bash
npm run build
# Deploy the dist/ folder to your hosting provider
```

## 🛠️ Development

### Running Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start backend server (for mock data fallback)
npm run server
```

### Testing Supabase Integration
1. Set up your `.env.local` file
2. Run the database schema
3. Test authentication and data operations

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Make sure your Supabase project has the correct CORS settings
   - Add your development URL to allowed origins

2. **Authentication Issues**
   - Check that your environment variables are correct
   - Verify the database schema was applied

3. **Storage Issues**
   - Ensure the storage bucket was created
   - Check storage policies are correctly applied

### Debug Mode
Enable debug logging by setting:
```env
VITE_DEBUG_SUPABASE=true
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)

## 🆘 Support

If you encounter issues with the Supabase integration:

1. Check the browser console for error messages
2. Verify your environment variables are set correctly
3. Ensure the database schema was applied successfully
4. Check Supabase logs for any errors

## 🔄 Next Steps

1. Set up your Supabase project
2. Run the database schema
3. Configure environment variables
4. Test the integration
5. Deploy to production

The application is now ready for production use with Supabase! 🎉
