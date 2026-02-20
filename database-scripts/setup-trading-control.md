# Trading Control Setup Guide

## 🚀 Quick Setup

The Trading Control Panel requires database tables to function properly. Follow these steps to set it up:

### 1. Run the Database Script

Execute the SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of:
-- database-scripts/trading-control-setup.sql
```

### 2. Verify Admin User

Ensure you have a user with `is_admin = true` in the `users` table:

```sql
-- Check if you're an admin
SELECT id, email, is_admin FROM users WHERE email = 'your-email@example.com';

-- If not, make yourself an admin (run this in Supabase SQL Editor)
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

### 3. Access the Panel

Navigate to:
- **Direct Access**: `/admin/trading-control`
- **Via Dashboard**: `/admin/dashboard` → "Trading Control" tab

## 📋 What Gets Created

### Database Tables
- `trade_outcomes` - User-specific win/loss settings
- `trade_windows` - Time-based outcome controls  
- `trading_settings` - System-wide defaults
- `trading_admin_audit` - Complete audit trail

### Security Functions
- `check_trade_outcome()` - Determines if user should win
- `log_trading_admin_action()` - Logs all admin actions

### Row Level Security
- Only admins can modify settings
- Trading service can read outcomes
- Complete audit logging

## 🎯 How It Works

### Priority System
1. **Time Windows** - Scheduled outcome periods
2. **User Settings** - Permanent per-user overrides  
3. **System Defaults** - Fallback for all users

### Default Behavior
- All users **lose** trades by default
- Admins can force wins for specific users
- Time windows allow scheduled outcomes
- Complete audit trail of all changes

## 🔧 Troubleshooting

### Panel Shows Error
1. Run the database setup script
2. Check you're an admin user
3. Refresh the page

### No Users Listed
1. Check the `users` table exists
2. Verify database connection
3. Check browser console for errors

### Settings Not Saving
1. Verify Row Level Security policies
2. Check you have admin privileges
3. Review audit logs for errors

## 📞 Support

If you encounter issues:

1. **Check Console**: Look for browser errors
2. **Verify Database**: Ensure all tables exist
3. **Check Permissions**: Confirm admin status
4. **Review Logs**: Check trading_admin_audit table

## 🛡️ Security Notes

- All actions are logged with admin user ID
- Row Level Security prevents unauthorized access
- Time windows automatically expire
- Default behavior favors losses (safer)

The system is designed to be **secure by default** - users lose unless explicitly set to win by an admin.
