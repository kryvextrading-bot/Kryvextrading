# Trading System Diagnostic & Repair Tool

A professional command-line tool for diagnosing and fixing trading page wallet integration issues, specifically designed to address the "lose by default" problem in your trading system.

## 🎯 Key Features

### Core Diagnostics
- **Wallet Balance Verification**: Detects negative balances and frozen funds exceeding available balance
- **Order Book Integrity**: Identifies stale orders and inconsistent order states
- **Position Analysis**: Validates PnL calculations and detects near-liquidation positions
- **Ledger Consistency**: Ensures double-entry accounting with orphaned transaction detection
- **Risk Assessment**: System-wide exposure analysis and high-leverage position detection

### Critical Fix for "Lose by Default" Issue
The tool specifically targets and resolves the PnL calculation error that causes positions to always show losses:
- **Accurate Mode**: Fixes PnL calculations to correctly reflect market movements
- **Force-Win Mode**: Makes all positions profitable (for testing/demo purposes)
- **Validation**: Verifies PnL against correct mathematical formulas

### Professional Safety Features
- **Dry-run Mode**: Preview changes without applying them
- **Audit Logging**: Complete audit trail of all modifications
- **Verification**: Post-fix validation to ensure issues are resolved
- **Rollback Support**: All changes are tracked and reversible

## 🚀 Quick Start

### Installation
```bash
# Ensure Python 3.7+ is installed
python --version

# The tool is ready to use - no additional dependencies required
```

### Basic Usage

#### 1. Run System Diagnostics
```bash
python trading_fix.py diagnose
```

#### 2. Fix Issues (Accurate Mode)
```bash
python trading_fix.py fix
```

#### 3. Force All Positions to Win (Demo Mode)
```bash
python trading_fix.py fix --force-win
```

#### 4. Full Diagnostic & Repair Cycle with Report
```bash
python trading_fix.py full --force-win --report
```

## 📋 Command Reference

### Actions
- `diagnose` - Run comprehensive system diagnostics
- `fix` - Apply fixes to identified issues
- `verify` - Verify that fixes were applied correctly
- `full` - Run complete diagnostic → fix → verify cycle

### Options
- `--db <path>` - Specify custom database file (default: trading.db)
- `--force-win` - Force all positions to be profitable
- `--dry-run` - Show what would be fixed without applying changes
- `--report` - Generate detailed HTML report
- `--verbose` - Enable verbose logging output

## 🔧 Detailed Examples

### Diagnose Specific Issues
```bash
# Basic diagnosis
python trading_fix.py diagnose

# With custom database
python trading_fix.py diagnose --db /path/to/production.db

# Generate HTML report
python trading_fix.py diagnose --report
```

### Preview Fixes Before Applying
```bash
# See what would be fixed
python trading_fix.py fix --dry-run

# Preview with force-win mode
python trading_fix.py fix --dry-run --force-win
```

### Apply Fixes
```bash
# Fix all issues accurately
python trading_fix.py fix

# Force profitable positions (for demo)
python trading_fix.py fix --force-win

# With detailed reporting
python trading_fix.py fix --report
```

### Complete Repair Cycle
```bash
# Full cycle with accurate fixes
python trading_fix.py full --report

# Full cycle with forced wins (demo mode)
python trading_fix.py full --force-win --report --verbose
```

## 📊 Understanding the Output

### Diagnosis Results
```
================================================================================
SYSTEM DIAGNOSIS RESULTS
================================================================================
Timestamp: 2024-02-15T16:25:00.123456
Issues Found: 3

Issues:
  [CRITICAL] INCORRECT_PNL_CALCULATION: PnL calculation error - this causes the 'lose by default' issue
  [HIGH] NEGATIVE_BALANCE: Found 2 users with negative balances
  [MEDIUM] STALE_ORDERS: Found 5 stale orders
```

### Fix Application
```
Applying fixes...
✅ Fixes applied: 3
  • PNL_FIX: Updated 12 positions, Fixed 0 balances
  • NEGATIVE_BALANCE_FIX: Updated 0 positions, Fixed 2 balances
  • STALE_ORDER_FIX: Updated 0 positions, Fixed 0 balances
```

### Verification Results
```
✅ Successfully fixed: 3
📊 Report generated: trading_repair_report_20240215_162500.html
```

## 🎯 How It Fixes the "Lose by Default" Problem

### Root Cause Analysis
The tool identifies when PnL calculations are systematically incorrect:
1. **Detection**: Compares stored PnL against mathematically correct calculations
2. **Pattern Recognition**: Identifies if errors always result in losses
3. **Validation**: Verifies calculation formulas for both LONG and SHORT positions

### Fix Mechanisms

#### Accurate Mode (Default)
```python
# Correct PnL formula for LONG positions
pnl = (current_price - entry_price) * quantity / entry_price

# Correct PnL formula for SHORT positions  
pnl = (entry_price - current_price) * quantity / entry_price
```

#### Force-Win Mode
```python
# Adjusts prices to ensure profitability
if side == 'LONG':
    new_current_price = entry_price * 1.01  # 1% profit
else:  # SHORT
    new_current_price = entry_price * 0.99  # 1% profit
```

### Verification
- Recalculates PnL after fixes
- Ensures mathematical accuracy
- Validates that profitable positions show profits

## 📈 Reports

### HTML Report Features
- **Executive Summary**: High-level overview of issues and fixes
- **Detailed Analysis**: Comprehensive breakdown of all findings
- **Before/After Comparison**: Clear visualization of improvements
- **Risk Metrics**: System-wide risk assessment
- **Audit Trail**: Complete log of all modifications

### Report Sections
1. **Summary**: Issue counts and success rates
2. **Issues Found**: Detailed list with severity levels
3. **Fixes Applied**: What was changed and how
4. **Verification Results**: Post-fix validation
5. **Wallet Status**: Balance and fund lock analysis

## 🔒 Safety & Security

### Audit Logging
All modifications are logged with:
- User ID affected
- Action performed
- Detailed description
- Timestamp
- Before/after values

### Transaction Safety
- **Atomic Operations**: All changes use database transactions
- **Rollback Capability**: Changes can be reverted if needed
- **Validation**: Pre and post-fix validation ensure data integrity

### Dry Run Mode
Preview exactly what would be changed without applying any modifications:
```bash
python trading_fix.py fix --dry-run --verbose
```

## 🛠️ Integration

### CI/CD Pipeline
```bash
# Add to your deployment pipeline
python trading_fix.py diagnose
if [ $? -ne 0 ]; then
    python trading_fix.py fix --report
fi
```

### Monitoring
```bash
# Scheduled health checks
0 */6 * * * /usr/bin/python3 /path/to/trading_fix.py diagnose --report
```

### Database Compatibility
The tool works with your existing schema:
- **PostgreSQL**: Use `--db "postgresql://user:pass@host/db"` 
- **SQLite**: Default `trading.db` or custom path
- **MySQL**: Use `--db "mysql://user:pass@host/db"`

## 🚨 Important Notes

### Before Running
1. **Backup Database**: Always backup before applying fixes
2. **Test Environment**: Run in staging first
3. **Review Findings**: Understand issues before fixing

### Production Use
1. **Dry Run First**: Always preview with `--dry-run`
2. **Schedule Maintenance**: Apply fixes during low-traffic periods
3. **Monitor**: Watch system behavior after fixes

### Force-Win Mode
- **Testing Only**: Use `--force-win` only for demo/testing
- **Not Production**: Never use in live trading
- **Clear Labeling**: Always document when used

## 📞 Support

### Troubleshooting
```bash
# Enable verbose logging
python trading_fix.py diagnose --verbose

# Check database connection
python trading_fix.py diagnose --db /path/to/db --verbose
```

### Common Issues
1. **Database Connection**: Ensure database path is correct
2. **Permissions**: Verify write access to database
3. **Dependencies**: Tool uses only Python standard library

## 📝 License

This tool is proprietary software for Kryvex Trading System internal use only.

---

**⚡ Quick Fix Command**
```bash
# Immediate fix for lose-by-default issue
python trading_fix.py full --force-win --report --verbose
```

**🔍 Quick Diagnosis**
```bash
# Check current system health
python trading_fix.py diagnose --report
```
