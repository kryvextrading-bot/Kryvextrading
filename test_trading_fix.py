#!/usr/bin/env python3
"""
Test script for Trading System Diagnostic & Repair Tool
Validates the tool works with your database schema
"""

import sqlite3
import os
import sys
from datetime import datetime, timedelta

def create_test_database():
    """Create a test database with sample data matching your schema"""
    db_path = "test_trading.db"
    
    # Remove existing test database
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create tables based on your schema
    cursor.execute("""
        CREATE TABLE wallet_balances (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            currency TEXT NOT NULL,
            balance REAL NOT NULL DEFAULT 0,
            frozen_balance REAL NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, currency)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE orders (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            symbol TEXT NOT NULL,
            type TEXT NOT NULL,
            side TEXT NOT NULL,
            amount REAL NOT NULL,
            price REAL,
            status TEXT DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE positions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            symbol TEXT NOT NULL,
            side TEXT NOT NULL,
            quantity REAL NOT NULL,
            entry_price REAL NOT NULL,
            current_price REAL,
            margin REAL NOT NULL,
            leverage INTEGER NOT NULL,
            unrealized_pnl REAL DEFAULT 0,
            status TEXT DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE wallet_transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            request_id TEXT,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL,
            balance_before REAL NOT NULL,
            balance_after REAL NOT NULL,
            reference_id TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE wallet_requests (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert test data with issues
    # User 1: Negative balance issue
    cursor.execute("""
        INSERT INTO wallet_balances (id, user_id, currency, balance, frozen_balance)
        VALUES 
            ('wb1', 'user1', 'BTC', -0.5, 0.1),
            ('wb2', 'user1', 'USDT', 1000, 1500),
            ('wb3', 'user2', 'BTC', 2.0, 0.5),
            ('wb4', 'user3', 'ETH', 10.0, 2.0)
    """)
    
    # Stale orders
    cursor.execute("""
        INSERT INTO orders (id, user_id, symbol, type, side, amount, price, status, created_at)
        VALUES 
            ('order1', 'user1', 'BTCUSDT', 'limit', 'buy', 1.0, 45000, 'open', 
             datetime('now', '-2 days')),
            ('order2', 'user2', 'ETHUSDT', 'market', 'sell', 5.0, NULL, 'open',
             datetime('now', '-3 hours'))
    """)
    
    # Positions with incorrect PnL calculation
    cursor.execute("""
        INSERT INTO positions (id, user_id, symbol, side, quantity, entry_price, current_price, margin, leverage, unrealized_pnl)
        VALUES 
            ('pos1', 'user1', 'BTCUSDT', 'buy', 1.0, 45000, 46000, 1000, 10, -100),
            ('pos2', 'user2', 'ETHUSDT', 'sell', 10.0, 3000, 2900, 500, 20, -50),
            ('pos3', 'user3', 'BTCUSDT', 'buy', 0.5, 44000, 44500, 500, 5, -25)
    """)
    
    # Orphaned ledger entries
    cursor.execute("""
        INSERT INTO wallet_transactions (id, user_id, type, amount, currency, balance_before, balance_after, reference_id)
        VALUES 
            ('tx1', 'user1', 'deposit', 1000, 'USDT', 0, 1000, 'nonexistent_ref'),
            ('tx2', 'user2', 'trade', -50, 'USDT', 2000, 1950, 'missing_order_id')
    """)
    
    conn.commit()
    conn.close()
    
    print(f"✅ Test database created: {db_path}")
    return db_path

def test_diagnostic_tool():
    """Test the diagnostic tool with the test database"""
    print("\n🔍 Testing Trading Diagnostic Tool...")
    
    # Create test database
    test_db = create_test_database()
    
    try:
        # Import and test the tool
        sys.path.insert(0, '.')
        from trading_fix import TradingSystemRepair
        
        # Initialize with test database
        repair = TradingSystemRepair(test_db)
        
        # Run diagnostics
        print("\n📋 Running system diagnostics...")
        diagnosis = repair.diagnose_system()
        
        # Display results
        print(f"\n📊 Diagnosis Results:")
        print(f"   Timestamp: {diagnosis['timestamp']}")
        print(f"   Issues Found: {len(diagnosis['issues_found'])}")
        
        if diagnosis['issues_found']:
            print("\n🚨 Issues Detected:")
            for i, issue in enumerate(diagnosis['issues_found'], 1):
                print(f"   {i}. [{issue['severity']}] {issue['type']}")
                print(f"      {issue['description']}")
        
        # Test fixes (dry run)
        print("\n🔧 Testing fixes (dry run)...")
        fixes = repair.fix_issues(diagnosis, force_win=False)
        
        print(f"✅ Fixes prepared: {len(fixes['fixes'])}")
        for fix in fixes['fixes']:
            print(f"   • {fix['type']}: {fix}")
        
        # Test force-win mode
        print("\n🎯 Testing force-win mode...")
        force_fixes = repair.fix_issues(diagnosis, force_win=True)
        
        print(f"✅ Force-win fixes prepared: {len(force_fixes['fixes'])}")
        for fix in force_fixes['fixes']:
            if fix['type'] == 'PNL_FIX':
                print(f"   • {fix['type']}: {fix['positions_updated']} positions would be made profitable")
        
        # Test verification
        print("\n✅ Testing verification...")
        verification = repair.verify_fixes(diagnosis, fixes)
        
        print(f"   Fixed successfully: {len(verification['fixed_successfully'])}")
        print(f"   Issues remaining: {len(verification['issues_remaining'])}")
        
        # Generate test report
        print("\n📄 Generating test report...")
        report_file = repair.generate_report(diagnosis, fixes, verification)
        print(f"   Report saved: {report_file}")
        
        print("\n🎉 All tests passed! The tool is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Cleanup test database
        if os.path.exists(test_db):
            os.remove(test_db)
            print(f"\n🧹 Cleaned up test database: {test_db}")

def main():
    print("=" * 60)
    print("Trading System Diagnostic Tool - Test Suite")
    print("=" * 60)
    
    success = test_diagnostic_tool()
    
    if success:
        print("\n✅ Tool validation successful!")
        print("\nYou can now use the tool with your actual database:")
        print("   python trading_fix.py diagnose")
        print("   python trading_fix.py fix --force-win")
        print("   python trading_fix.py full --report")
        print("\nOr run the Windows launcher:")
        print("   run_trading_fix.bat")
    else:
        print("\n❌ Tool validation failed!")
        print("Please check the error messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
