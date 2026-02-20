# Kryvextrading.com - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Supabase account
- Cloudinary account

## 📋 Step 1: Clone Repository

```bash
git clone https://github.com/kryvextrading-bot/Kryvextrading.git
cd Kryvextrading.com
```

## 🔧 Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

## 🌐 Step 3: Environment Setup

### Copy Environment Template
```bash
cp .env.example .env.local
```

### Update .env.local with your credentials:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key
VITE_CLOUDINARY_API_SECRET=your-api-secret

# External APIs (Optional)
VITE_ALPHA_VANTAGE_KEY=your-alpha-vantage-key
VITE_TWELVE_DATA_KEY=your-twelve-data-key

# API Configuration
VITE_API_URL=http://localhost:3001/api
```

## 🗄️ Step 4: Supabase Database Setup

### 4.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your Project URL and Anon Key

### 4.2 Run Database Schema
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `supabase-schema.sql`
3. Paste and run the SQL script
4. Verify all tables are created successfully

### 4.3 Create Storage Bucket
The schema automatically creates the `kyc-documents` bucket, but verify:
1. Go to Storage section
2. Ensure `kyc-documents` bucket exists
3. Set bucket policies (handled by schema)

## 📁 Step 5: Cloudinary Setup

### 5.1 Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. Get your Cloud Name, API Key, and API Secret

### 5.2 Configure Cloudinary
Update your `.env.local` with Cloudinary credentials from Step 3

## 🚀 Step 6: Run Development Server

```bash
npm run dev
# or
yarn dev
```

The app will be available at: `http://localhost:5173`

## 👤 Step 7: Create Admin Account

### 7.1 Register First User
1. Open the app in browser
2. Click "Sign Up"
3. Create account with email/password

### 7.2 Make User Admin
Run this SQL in Supabase SQL Editor:

```sql
UPDATE public.users 
SET is_admin = true, admin_role = 'superadmin' 
WHERE email = 'your-admin-email@example.com';
```

## 🔐 Authentication Setup

### Supabase Auth Configuration
1. Go to Supabase Dashboard → Authentication → Settings
2. Configure:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/*`
   - Enable email confirmation
   - Configure SMTP (optional for development)

### Default Admin User
The schema creates a default admin user:
- **Email:** `admin@kryvextrading.com`
- **Password:** Change after first login
- **Role:** `superadmin`

## 📊 Database Features

### Available Tables
- **users** - User management and profiles
- **wallets** - Multi-currency wallet support
- **transactions** - Transaction history
- **orders** - Trading orders
- **positions** - Trading positions
- **kyc_documents** - KYC verification
- **investment_products** - Investment catalog
- **user_investments** - User investments
- **arbitrage_contracts** - Arbitrage trading
- **staking_positions** - Crypto staking
- **user_loans** - Loan management
- **notifications** - User notifications
- **audit_logs** - Admin audit trail
- **security_events** - Security monitoring

### Security Features
- ✅ Row Level Security (RLS) on all tables
- ✅ Role-based access control
- ✅ JWT authentication
- ✅ API key management
- ✅ Audit logging

## 🛠️ Development Workflow

### Making Changes
1. Modify code
2. Test locally
3. Commit changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
4. Push to repository:
   ```bash
   git push origin master
   ```

### Database Migrations
- All schema changes are idempotent
- Use `ALTER TABLE IF EXISTS` for migrations
- Test in development first

## 🔧 Troubleshooting

### Common Issues

#### 1. Supabase Connection Error
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

#### 2. Database Schema Errors
- Verify all tables exist in Supabase Dashboard
- Check RLS policies are enabled
- Run schema script again if needed

#### 3. Cloudinary Upload Issues
- Verify Cloudinary credentials in .env.local
- Check bucket permissions
- Test with small files first

#### 4. Authentication Issues
- Clear browser cache
- Check Supabase auth settings
- Verify redirect URLs

### Debug Mode
Enable debug logging:
```bash
VITE_DEBUG=true npm run dev
```

## 📱 Production Deployment

### Environment Variables for Production
```bash
# Production .env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
VITE_CLOUDINARY_CLOUD_NAME=your-prod-cloud-name
VITE_CLOUDINARY_API_KEY=your-prod-api-key
VITE_CLOUDINARY_API_SECRET=your-prod-api-secret
```

### Build for Production
```bash
npm run build
# Output in dist/ folder
```

### Deploy Options
- **Vercel** (Recommended for React apps)
- **Netlify**
- **AWS Amplify**
- **DigitalOcean App Platform**

## 📚 API Documentation

### Supabase Client Usage
```typescript
import { supabase } from './src/lib/supabase'

// Example: Get current user
const { data: user } = await supabase.auth.getUser()

// Example: Query transactions
const { data: transactions } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
```

### Cloudinary Usage
```typescript
import { cloudinaryService } from './src/lib/cloudinary'

// Example: Upload KYC document
const result = await cloudinaryService.uploadKYCDocument(
  file, 
  'passport', 
  userId
)
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

For issues and questions:
1. Check this README
2. Review Supabase documentation
3. Review Cloudinary documentation
4. Create GitHub issue

---

**🎉 Your Kryvextrading.com application is now ready for development!**

The complete setup includes:
- ✅ Supabase database with all tables
- ✅ Row Level Security policies
- ✅ Cloudinary file storage
- ✅ Authentication system
- ✅ Admin dashboard
- ✅ Trading functionality
- ✅ Investment management
- ✅ KYC verification system
