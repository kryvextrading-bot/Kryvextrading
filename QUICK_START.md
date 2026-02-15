# Trading System Fix Tool - Quick Start

## 🚀 Immediate Actions

### 1. Diagnose Your System
```bash
python trading_fix.py diagnose
```

### 2. Fix the "Lose by Default" Issue
```bash
# Accurate fix - corrects PnL calculations
python trading_fix.py fix

# Force win mode - makes all positions profitable (demo/testing)
python trading_fix.py fix --force-win
```

### 3. Full Repair with Report
```bash
python trading_fix.py full --force-win --report
```

## 🖱️ Easy Windows Launcher
Just double-click: `run_trading_fix.bat`

## 📊 What the Tool Fixes

✅ **PnL Calculation Error** - The main "lose by default" issue  
✅ **Negative Wallet Balances** - Users with negative funds  
✅ **Frozen Fund Issues** - When frozen > available balance  
✅ **Stale Orders** - Orders stuck open for days  
✅ **Orphaned Transactions** - Ledger entries with no reference  

## 🔧 Test the Tool First
```bash
python test_trading_fix.py
```

## 📈 Expected Results
After running the tool:
- All positions will show **correct PnL calculations**
- No more "lose by default" behavior
- Wallet balances will be consistent
- Orders will be properly managed
- Complete audit trail of all changes

## ⚠️ Important
- **Backup your database** before running fixes
- Use `--dry-run` to preview changes
- `--force-win` is for demo/testing only
- Check the generated HTML report for details

## 🆘 Need Help?
- Run: `python trading_fix.py --help`
- Check: `TRADING_FIX_README.md` for detailed documentation
- Review the generated HTML reports for analysis

**Ready to fix your trading system? Run:**
```bash
python trading_fix.py full --report
```
