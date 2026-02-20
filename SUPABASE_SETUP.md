# Supabase Database Setup - Quick Guide

## 🚨 **URGENT: Database Setup Required**

The authentication errors are occurring because the Supabase database hasn't been configured yet.

## 📋 **Step-by-Step Fix**

### **Step 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Select your project: `trzvvacsfxfpwuekenfc`
3. Click on **SQL Editor** in the left sidebar

### **Step 2: Run the Schema**
1. Open file: `supabase-schema.sql` in your project
2. **Copy entire contents** (Ctrl+A, Ctrl+C)
3. **Paste** into Supabase SQL Editor
4. Click **"Run"** button

### **Step 3: Verify Setup**
After running the schema, you should see:
- ✅ **All tables created** (20+ tables)
- ✅ **RLS policies enabled**
- ✅ **Storage bucket created**
- ✅ **Indexes created**
- ✅ **Admin user created**

### **Step 4: Test Authentication**
1. Go back to your app: `http://localhost:8081`
2. Try registering a new user
3. Or login with default admin:
   - **Email:** `admin@kryvextrading.com`
   - **Password:** (change after first login)

## 🔧 **What the Schema Creates**

### **Core Tables:**
- `users` - User profiles and authentication
- `wallets` - Multi-currency wallets
- `transactions` - Transaction history
- `orders` - Trading orders
- `positions` - Trading positions
- `kyc_documents` - KYC verification

### **Security Features:**
- Row Level Security (RLS) policies
- User and admin access control
- JWT authentication
- API key management

### **Storage:**
- `kyc-documents` bucket for file uploads
- Secure access policies

## 🚨 **Common Issues & Solutions**

### **Error: "invalid_credentials"**
**Cause:** Database tables don't exist
**Solution:** Run the complete schema in Supabase SQL Editor

### **Error: "relation does not exist"**
**Cause:** Missing tables
**Solution:** Re-run schema script

### **Error: "column does not exist"**
**Cause:** Incomplete schema execution
**Solution:** Drop and re-run schema

## 🔄 **If Problems Persist**

### **Reset Database:**
```sql
-- Drop all tables (CAREFUL - deletes all data)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Then re-run the complete schema
```

### **Check Table Creation:**
```sql
-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## ✅ **Success Indicators**

After successful setup, you should see:
1. **No more auth errors** in console
2. **User registration** works
3. **Login successful** 
4. **Dashboard loads** with user data
5. **All features accessible**

## 📞 **Need Help?**

1. **Check console logs** for specific errors
2. **Verify schema execution** completed successfully
3. **Confirm Supabase project URL** is correct
4. **Check network connection** to Supabase

---

**🎯 Once you run the schema in Supabase, all authentication errors will be resolved!**
