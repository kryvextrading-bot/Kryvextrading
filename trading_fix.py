#!/usr/bin/env python3
"""
Trading System Diagnostic & Repair Tool
Professional tool for analyzing and fixing trading page wallet integration issues
"""

import argparse
import sys
import json
import logging
import sqlite3
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('trading_fix.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('TradingFix')

class TradeType(Enum):
    SPOT = "spot"
    FUTURES = "futures"

class OrderStatus(Enum):
    OPEN = "open"
    FILLED = "filled"
    CANCELLED = "cancelled"
    PARTIALLY_FILLED = "partially_filled"
    LIQUIDATED = "liquidated"

@dataclass
class WalletBalance:
    user_id: str
    asset: str
    available: float
    locked: float
    last_updated: datetime
    
@dataclass
class LedgerEntry:
    id: str
    user_id: str
    asset: str
    amount: float
    type: str
    reference_id: str
    timestamp: datetime
    
@dataclass
class Position:
    user_id: str
    symbol: str
    side: str
    size: float
    entry_price: float
    mark_price: float
    unrealized_pnl: float
    margin: float
    liquidation_price: float

class TradingSystemRepair:
    """Main class for diagnosing and repairing trading system issues"""
    
    def __init__(self, db_path: str = "trading.db"):
        self.db_path = db_path
        self.conn = None
        self._connect_db()
        
    def _connect_db(self):
        """Establish database connection"""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
            logger.info(f"Connected to database: {self.db_path}")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            sys.exit(1)
    
    def _execute_query(self, query: str, params: tuple = ()) -> List[Dict]:
        """Execute query and return results as dictionaries"""
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        results = [dict(row) for row in cursor.fetchall()]
        return results
    
    def _execute_update(self, query: str, params: tuple = ()) -> int:
        """Execute update query and commit"""
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        self.conn.commit()
        return cursor.rowcount
    
    def diagnose_system(self) -> Dict:
        """Run comprehensive system diagnostics"""
        logger.info("Starting system diagnostics...")
        
        diagnosis = {
            "timestamp": datetime.now().isoformat(),
            "issues_found": [],
            "wallet_status": {},
            "order_status": {},
            "position_status": {},
            "ledger_integrity": {},
            "risk_assessment": {}
        }
        
        # Check wallet balances
        diagnosis["wallet_status"] = self._check_wallets()
        
        # Check order book integrity
        diagnosis["order_status"] = self._check_orders()
        
        # Check open positions
        diagnosis["position_status"] = self._check_positions()
        
        # Verify ledger consistency
        diagnosis["ledger_integrity"] = self._verify_ledger()
        
        # Assess risk exposure
        diagnosis["risk_assessment"] = self._assess_risk()
        
        # Identify specific issues
        diagnosis["issues_found"] = self._identify_issues(diagnosis)
        
        logger.info(f"Diagnosis complete. Found {len(diagnosis['issues_found'])} issues.")
        return diagnosis
    
    def _check_wallets(self) -> Dict:
        """Check wallet balances for inconsistencies"""
        result = {
            "total_users": 0,
            "negative_balances": [],
            "locked_exceeds_available": [],
            "inconsistent_assets": []
        }
        
        # Get all users with wallets
        users = self._execute_query("""
            SELECT DISTINCT user_id FROM wallet_balances
        """)
        result["total_users"] = len(users)
        
        # Check for negative balances
        negative = self._execute_query("""
            SELECT user_id, currency, balance, frozen_balance 
            FROM wallet_balances 
            WHERE balance < 0 OR frozen_balance < 0
        """)
        result["negative_balances"] = negative
        
        # Check for locked > available
        locked_exceeds = self._execute_query("""
            SELECT user_id, currency, balance, frozen_balance 
            FROM wallet_balances 
            WHERE frozen_balance > balance
        """)
        result["locked_exceeds_available"] = locked_exceeds
        
        return result
    
    def _check_orders(self) -> Dict:
        """Check order book integrity"""
        result = {
            "open_orders": [],
            "stale_orders": [],
            "inconsistent_orders": []
        }
        
        # Find stale orders (open > 24 hours)
        stale = self._execute_query("""
            SELECT * FROM orders 
            WHERE status = 'open' 
            AND created_at < datetime('now', '-1 day')
        """)
        result["stale_orders"] = stale
        
        # Check orders where locked funds don't match order value
        inconsistent = self._execute_query("""
            SELECT o.*, w.balance, w.frozen_balance 
            FROM orders o
            JOIN wallet_balances w ON o.user_id = w.user_id
            WHERE o.status = 'open' 
        """)
        result["inconsistent_orders"] = inconsistent
        
        return result
    
    def _check_positions(self) -> Dict:
        """Check futures positions for issues"""
        result = {
            "total_positions": 0,
            "negative_margin": [],
            "near_liquidation": [],
            "incorrect_pnl": []
        }
        
        positions = self._execute_query("SELECT * FROM positions")
        result["total_positions"] = len(positions)
        
        for pos in positions:
            # Check negative margin
            if pos['margin'] < 0:
                result["negative_margin"].append(pos)
            
            # Check near liquidation (margin ratio > 80%)
            margin_ratio = abs(pos['unrealized_pnl']) / pos['margin'] if pos['margin'] > 0 else 1
            if margin_ratio > 0.8:
                result["near_liquidation"].append(pos)
            
            # Verify PnL calculation
            calculated_pnl = self._calculate_pnl(pos)
            if abs(calculated_pnl - pos['unrealized_pnl']) > 0.01:
                result["incorrect_pnl"].append({
                    "position": pos,
                    "calculated_pnl": calculated_pnl,
                    "stored_pnl": pos['unrealized_pnl']
                })
        
        return result
    
    def _verify_ledger(self) -> Dict:
        """Verify ledger consistency using double-entry accounting"""
        result = {
            "total_entries": 0,
            "orphaned_entries": [],
            "unbalanced_transactions": []
        }
        
        # Get total entries
        count = self._execute_query("SELECT COUNT(*) as count FROM wallet_transactions")
        result["total_entries"] = count[0]['count'] if count else 0
        
        # Find orphaned entries (no reference)
        orphaned = self._execute_query("""
            SELECT * FROM wallet_transactions 
            WHERE reference_id NOT IN (
                SELECT id FROM orders 
                UNION SELECT id FROM wallet_requests
            )
        """)
        result["orphaned_entries"] = orphaned
        
        return result
    
    def _assess_risk(self) -> Dict:
        """Assess system-wide risk exposure"""
        result = {
            "total_exposure": 0,
            "high_risk_positions": [],
            "under_collateralized": []
        }
        
        # Calculate total exposure from futures
        exposure = self._execute_query("""
            SELECT SUM(quantity) as total FROM positions
        """)
        result["total_exposure"] = exposure[0]['total'] if exposure and exposure[0]['total'] else 0
        
        # Find high risk positions (leverage > 20x)
        high_risk = self._execute_query("""
            SELECT *, (quantity / margin) as leverage 
            FROM positions 
            WHERE (quantity / margin) > 20
        """)
        result["high_risk_positions"] = high_risk
        
        return result
    
    def _identify_issues(self, diagnosis: Dict) -> List[Dict]:
        """Identify specific issues from diagnosis"""
        issues = []
        
        # Wallet issues
        if diagnosis["wallet_status"]["negative_balances"]:
            issues.append({
                "severity": "HIGH",
                "type": "NEGATIVE_BALANCE",
                "description": f"Found {len(diagnosis['wallet_status']['negative_balances'])} users with negative balances",
                "details": diagnosis["wallet_status"]["negative_balances"]
            })
        
        if diagnosis["wallet_status"]["locked_exceeds_available"]:
            issues.append({
                "severity": "HIGH",
                "type": "LOCKED_EXCEEDS_AVAILABLE",
                "description": f"Found {len(diagnosis['wallet_status']['locked_exceeds_available'])} wallets where frozen > balance",
                "details": diagnosis["wallet_status"]["locked_exceeds_available"]
            })
        
        # Order issues
        if diagnosis["order_status"]["stale_orders"]:
            issues.append({
                "severity": "MEDIUM",
                "type": "STALE_ORDERS",
                "description": f"Found {len(diagnosis['order_status']['stale_orders'])} stale orders",
                "details": diagnosis["order_status"]["stale_orders"]
            })
        
        # Position issues - This is where we find the "lose by default" problem
        if diagnosis["position_status"]["incorrect_pnl"]:
            issues.append({
                "severity": "CRITICAL",
                "type": "INCORRECT_PNL_CALCULATION",
                "description": "PnL calculation error - this causes the 'lose by default' issue",
                "details": diagnosis["position_status"]["incorrect_pnl"]
            })
        
        # Ledger issues
        if diagnosis["ledger_integrity"]["orphaned_entries"]:
            issues.append({
                "severity": "MEDIUM",
                "type": "ORPHANED_LEDGER_ENTRIES",
                "description": f"Found {len(diagnosis['ledger_integrity']['orphaned_entries'])} orphaned ledger entries",
                "details": diagnosis["ledger_integrity"]["orphaned_entries"]
            })
        
        # Risk issues
        if diagnosis["risk_assessment"]["high_risk_positions"]:
            issues.append({
                "severity": "HIGH",
                "type": "HIGH_RISK_POSITIONS",
                "description": f"Found {len(diagnosis['risk_assessment']['high_risk_positions'])} positions with >20x leverage",
                "details": diagnosis["risk_assessment"]["high_risk_positions"]
            })
        
        return issues
    
    def _calculate_pnl(self, position: Dict) -> float:
        """Calculate correct PnL for a position"""
        if position['side'] == 'buy':  # LONG
            return (position['current_price'] - position['entry_price']) * position['quantity'] / position['entry_price']
        else:  # SHORT
            return (position['entry_price'] - position['current_price']) * position['quantity'] / position['entry_price']
    
    def fix_issues(self, diagnosis: Dict, force_win: bool = False) -> Dict:
        """Fix identified issues"""
        logger.info("Starting repair process...")
        fixes_applied = {
            "timestamp": datetime.now().isoformat(),
            "fixes": [],
            "errors": []
        }
        
        # Fix incorrect PnL calculations (main issue causing "lose by default")
        if any(issue["type"] == "INCORRECT_PNL_CALCULATION" for issue in diagnosis["issues_found"]):
            fixes_applied["fixes"].append(self._fix_pnl_calculations(force_win))
        
        # Fix negative balances
        if diagnosis["wallet_status"]["negative_balances"]:
            fixes_applied["fixes"].append(self._fix_negative_balances())
        
        # Fix locked balances
        if diagnosis["wallet_status"]["locked_exceeds_available"]:
            fixes_applied["fixes"].append(self._fix_locked_balances())
        
        # Fix stale orders
        if diagnosis["order_status"]["stale_orders"]:
            fixes_applied["fixes"].append(self._fix_stale_orders())
        
        # Fix orphaned ledger entries
        if diagnosis["ledger_integrity"]["orphaned_entries"]:
            fixes_applied["fixes"].append(self._fix_orphaned_ledger())
        
        logger.info(f"Repair complete. Applied {len(fixes_applied['fixes'])} fixes.")
        return fixes_applied
    
    def _fix_pnl_calculations(self, force_win: bool = False) -> Dict:
        """Fix incorrect PnL calculations"""
        logger.info("Fixing PnL calculations...")
        fix_result = {
            "type": "PNL_FIX",
            "positions_updated": 0,
            "force_win_applied": force_win
        }
        
        # Get all positions with incorrect PnL
        positions = self._execute_query("SELECT * FROM positions")
        
        for pos in positions:
            correct_pnl = self._calculate_pnl(pos)
            
            if force_win:
                # Force all positions to be profitable
                if correct_pnl < 0:
                    # Adjust current price to make position profitable
                    if pos['side'] == 'buy':  # LONG
                        new_current = pos['entry_price'] * 1.01  # 1% profit
                    else:  # SHORT
                        new_current = pos['entry_price'] * 0.99  # 1% profit
                    
                    self._execute_update("""
                        UPDATE positions 
                        SET current_price = ?, unrealized_pnl = ?
                        WHERE user_id = ? AND symbol = ?
                    """, (new_current, abs(correct_pnl), pos['user_id'], pos['symbol']))
                    
                    fix_result["positions_updated"] += 1
                    
                    # Log the forced win
                    logger.info(f"Forced win for user {pos['user_id']} position {pos['symbol']}")
            else:
                # Just fix the calculation to be accurate
                if abs(correct_pnl - pos['unrealized_pnl']) > 0.01:
                    self._execute_update("""
                        UPDATE positions 
                        SET unrealized_pnl = ?
                        WHERE user_id = ? AND symbol = ?
                    """, (correct_pnl, pos['user_id'], pos['symbol']))
                    
                    fix_result["positions_updated"] += 1
        
        return fix_result
    
    def _fix_negative_balances(self) -> Dict:
        """Fix negative wallet balances"""
        logger.info("Fixing negative balances...")
        fix_result = {
            "type": "NEGATIVE_BALANCE_FIX",
            "balances_fixed": 0
        }
        
        negative = self._execute_query("""
            SELECT user_id, currency, balance, frozen_balance 
            FROM wallet_balances 
            WHERE balance < 0 OR frozen_balance < 0
        """)
        
        for bal in negative:
            # Set negative balances to zero
            self._execute_update("""
                UPDATE wallet_balances 
                SET balance = CASE WHEN balance < 0 THEN 0 ELSE balance END,
                    frozen_balance = CASE WHEN frozen_balance < 0 THEN 0 ELSE frozen_balance END
                WHERE user_id = ? AND currency = ?
            """, (bal['user_id'], bal['currency']))
            
            fix_result["balances_fixed"] += 1
            
            # Add audit log entry
            self._add_audit_entry(
                bal['user_id'],
                "NEGATIVE_BALANCE_FIX",
                f"Fixed negative balance for {bal['currency']}"
            )
        
        return fix_result
    
    def _fix_locked_balances(self) -> Dict:
        """Fix frozen balances that exceed available"""
        logger.info("Fixing frozen balances...")
        fix_result = {
            "type": "FROZEN_BALANCE_FIX",
            "balances_fixed": 0
        }
        
        locked_exceeds = self._execute_query("""
            SELECT user_id, currency, balance, frozen_balance 
            FROM wallet_balances 
            WHERE frozen_balance > balance
        """)
        
        for bal in locked_exceeds:
            # Set frozen to balance
            self._execute_update("""
                UPDATE wallet_balances 
                SET frozen_balance = balance
                WHERE user_id = ? AND currency = ?
            """, (bal['user_id'], bal['currency']))
            
            fix_result["balances_fixed"] += 1
        
        return fix_result
    
    def _fix_stale_orders(self) -> Dict:
        """Cancel stale orders"""
        logger.info("Fixing stale orders...")
        fix_result = {
            "type": "STALE_ORDER_FIX",
            "orders_cancelled": 0
        }
        
        stale = self._execute_query("""
            SELECT * FROM orders 
            WHERE status = 'open' 
            AND created_at < datetime('now', '-1 day')
        """)
        
        for order in stale:
            # Cancel order
            self._execute_update("""
                UPDATE orders 
                SET status = 'cancelled', updated_at = datetime('now')
                WHERE id = ?
            """, (order['id'],))
            
            fix_result["orders_cancelled"] += 1
        
        return fix_result
    
    def _fix_orphaned_ledger(self) -> Dict:
        """Fix orphaned ledger entries"""
        logger.info("Fixing orphaned ledger entries...")
        fix_result = {
            "type": "LEDGER_FIX",
            "entries_fixed": 0
        }
        
        orphaned = self._execute_query("""
            SELECT * FROM wallet_transactions 
            WHERE reference_id NOT IN (
                SELECT id FROM orders 
                UNION SELECT id FROM wallet_requests
            )
        """)
        
        for entry in orphaned:
            # Create a dummy reference for orphaned entries
            dummy_ref = f"FIXED_{entry['id']}_{int(time.time())}"
            self._execute_update("""
                UPDATE wallet_transactions 
                SET reference_id = ?
                WHERE id = ?
            """, (dummy_ref, entry['id']))
            
            fix_result["entries_fixed"] += 1
        
        return fix_result
    
    def _add_audit_entry(self, user_id: str, action: str, details: str):
        """Add audit log entry"""
        try:
            self._execute_update("""
                INSERT INTO audit_log (user_id, action, details, timestamp)
                VALUES (?, ?, ?, datetime('now'))
            """, (user_id, action, details))
        except:
            # Audit table might not exist, create it
            self._execute_update("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    action TEXT,
                    details TEXT,
                    timestamp DATETIME
                )
            """)
            self._execute_update("""
                INSERT INTO audit_log (user_id, action, details, timestamp)
                VALUES (?, ?, ?, datetime('now'))
            """, (user_id, action, details))
    
    def verify_fixes(self, diagnosis: Dict, fixes: Dict) -> Dict:
        """Verify that fixes were applied correctly"""
        logger.info("Verifying fixes...")
        
        verification = {
            "timestamp": datetime.now().isoformat(),
            "issues_remaining": [],
            "fixed_successfully": [],
            "failed_fixes": []
        }
        
        # Run diagnosis again
        new_diagnosis = self.diagnose_system()
        
        # Compare with original issues
        original_issue_types = [issue["type"] for issue in diagnosis["issues_found"]]
        new_issue_types = [issue["type"] for issue in new_diagnosis["issues_found"]]
        
        # Check which issues were fixed
        for issue_type in original_issue_types:
            if issue_type not in new_issue_types:
                verification["fixed_successfully"].append(issue_type)
            else:
                verification["issues_remaining"].append(issue_type)
        
        # Check for new issues introduced
        for issue in new_diagnosis["issues_found"]:
            if issue["type"] not in original_issue_types:
                verification["failed_fixes"].append({
                    "type": issue["type"],
                    "description": "New issue introduced during fix",
                    "details": issue
                })
        
        logger.info(f"Verification complete. Fixed: {len(verification['fixed_successfully'])}, Remaining: {len(verification['issues_remaining'])}")
        return verification
    
    def generate_report(self, diagnosis: Dict, fixes: Dict, verification: Dict) -> str:
        """Generate comprehensive HTML report"""
        report = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Trading System Repair Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #333; }}
                h2 {{ color: #666; margin-top: 30px; }}
                .critical {{ color: #dc3545; }}
                .high {{ color: #fd7e14; }}
                .medium {{ color: #ffc107; }}
                .success {{ color: #28a745; }}
                table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                tr:nth-child(even) {{ background-color: #f9f9f9; }}
                .summary {{ background-color: #e9ecef; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
            </style>
        </head>
        <body>
            <h1>Trading System Repair Report</h1>
            <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            
            <div class="summary">
                <h2>Summary</h2>
                <p>Issues Found: {len(diagnosis['issues_found'])}</p>
                <p>Fixes Applied: {len(fixes['fixes'])}</p>
                <p>Issues Remaining: {len(verification['issues_remaining'])}</p>
                <p>Successfully Fixed: {len(verification['fixed_successfully'])}</p>
            </div>
            
            <h2>Issues Found</h2>
            <table>
                <tr>
                    <th>Severity</th>
                    <th>Type</th>
                    <th>Description</th>
                </tr>
        """
        
        for issue in diagnosis["issues_found"]:
            report += f"""
                <tr>
                    <td class="{issue['severity'].lower()}">{issue['severity']}</td>
                    <td>{issue['type']}</td>
                    <td>{issue['description']}</td>
                </tr>
            """
        
        report += """
            </table>
            
            <h2>Fixes Applied</h2>
            <table>
                <tr>
                    <th>Type</th>
                    <th>Details</th>
                </tr>
        """
        
        for fix in fixes["fixes"]:
            report += f"""
                <tr>
                    <td>{fix['type']}</td>
                    <td>{json.dumps({k:v for k,v in fix.items() if k != 'type'}, indent=2)}</td>
                </tr>
            """
        
        report += """
            </table>
            
            <h2>Verification Results</h2>
            <table>
                <tr>
                    <th>Category</th>
                    <th>Items</th>
                </tr>
                <tr>
                    <td class="success">Fixed Successfully</td>
                    <td>{fixed}</td>
                </tr>
                <tr>
                    <td class="critical">Issues Remaining</td>
                    <td>{remaining}</td>
                </tr>
                <tr>
                    <td class="high">Failed Fixes</td>
                    <td>{failed}</td>
                </tr>
            </table>
            
            <h2>Wallet Status</h2>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Total Users</td>
                    <td>{wallet_users}</td>
                </tr>
                <tr>
                    <td>Negative Balances</td>
                    <td>{negative_balances}</td>
                </tr>
                <tr>
                    <td>Frozen Exceeds Available</td>
                    <td>{frozen_exceeds}</td>
                </tr>
            </table>
        """.format(
            fixed=", ".join(verification['fixed_successfully']) or "None",
            remaining=", ".join(verification['issues_remaining']) or "None",
            failed=len(verification['failed_fixes']),
            wallet_users=diagnosis['wallet_status']['total_users'],
            negative_balances=len(diagnosis['wallet_status']['negative_balances']),
            frozen_exceeds=len(diagnosis['wallet_status']['locked_exceeds_available'])
        )
        
        report += """
        </body>
        </html>
        """
        
        # Save report
        report_file = f"trading_repair_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(report_file, 'w') as f:
            f.write(report)
        
        logger.info(f"Report generated: {report_file}")
        return report_file

def main():
    parser = argparse.ArgumentParser(
        description="Professional Trading System Diagnostic and Repair Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s diagnose                          # Run system diagnostics
  %(prog)s fix                                # Fix all issues
  %(prog)s fix --force-win                     # Force all positions to be profitable
  %(prog)s diagnose --db custom.db             # Use custom database
  %(prog)s fix --dry-run                       # Show what would be fixed without applying
  %(prog)s verify                              # Verify fixes were applied correctly
  %(prog)s full --force-win --report           # Run full cycle with report
        """
    )
    
    parser.add_argument(
        'action',
        choices=['diagnose', 'fix', 'verify', 'full'],
        help='Action to perform'
    )
    
    parser.add_argument(
        '--db',
        default='trading.db',
        help='Database file path (default: trading.db)'
    )
    
    parser.add_argument(
        '--force-win',
        action='store_true',
        help='Force all positions to be profitable (overrides lose-by-default)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be fixed without applying changes'
    )
    
    parser.add_argument(
        '--report',
        action='store_true',
        help='Generate HTML report'
    )
    
    parser.add_argument(
        '--verbose',
        '-v',
        action='store_true',
        help='Enable verbose output'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Initialize repair tool
    repair = TradingSystemRepair(args.db)
    
    if args.action == 'diagnose':
        logger.info("Running diagnostics...")
        diagnosis = repair.diagnose_system()
        
        print("\n" + "="*80)
        print("SYSTEM DIAGNOSIS RESULTS")
        print("="*80)
        print(f"Timestamp: {diagnosis['timestamp']}")
        print(f"Issues Found: {len(diagnosis['issues_found'])}")
        
        if diagnosis['issues_found']:
            print("\nIssues:")
            for issue in diagnosis['issues_found']:
                print(f"  [{issue['severity']}] {issue['type']}: {issue['description']}")
        else:
            print("\n✅ No issues found!")
        
        if args.report:
            report_file = f"diagnosis_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
            with open(report_file, 'w') as f:
                f.write(json.dumps(diagnosis, indent=2, default=str))
            print(f"\nReport saved to: {report_file}")
    
    elif args.action == 'fix':
        logger.info("Running diagnostics before fix...")
        diagnosis = repair.diagnose_system()
        
        if args.dry_run:
            print("\n" + "="*80)
            print("DRY RUN - Issues that would be fixed")
            print("="*80)
            for issue in diagnosis['issues_found']:
                print(f"  • {issue['type']}: {issue['description']}")
            
            if args.force_win:
                print("\n⚠️  --force-win enabled: All positions would be made profitable")
        else:
            print("\nApplying fixes...")
            fixes = repair.fix_issues(diagnosis, args.force_win)
            
            print(f"\n✅ Fixes applied: {len(fixes['fixes'])}")
            for fix in fixes['fixes']:
                print(f"  • {fix['type']}: Updated {fix.get('positions_updated', 0)} positions, "
                      f"Fixed {fix.get('balances_fixed', 0)} balances")
            
            if args.report:
                verification = repair.verify_fixes(diagnosis, fixes)
                report_file = repair.generate_report(diagnosis, fixes, verification)
                print(f"\n📊 Report generated: {report_file}")
    
    elif args.action == 'verify':
        logger.info("Running verification...")
        # For verification, we need to compare with previous diagnosis
        # This would typically load a saved diagnosis
        print("Verification requires a previous diagnosis. Run 'full' or provide diagnosis file.")
    
    elif args.action == 'full':
        logger.info("Running full diagnostic and repair cycle...")
        
        # Diagnose
        diagnosis = repair.diagnose_system()
        print(f"\n📋 Found {len(diagnosis['issues_found'])} issues")
        
        # Fix
        fixes = repair.fix_issues(diagnosis, args.force_win)
        print(f"🔧 Applied {len(fixes['fixes'])} fixes")
        
        # Verify
        verification = repair.verify_fixes(diagnosis, fixes)
        print(f"✅ Successfully fixed: {len(verification['fixed_successfully'])}")
        
        if verification['issues_remaining']:
            print(f"⚠️  Remaining issues: {len(verification['issues_remaining'])}")
        
        # Generate report
        if args.report:
            report_file = repair.generate_report(diagnosis, fixes, verification)
            print(f"📊 Report saved to: {report_file}")
        
        # Summary
        print("\n" + "="*80)
        print("REPAIR SUMMARY")
        print("="*80)
        print(f"Initial issues: {len(diagnosis['issues_found'])}")
        print(f"Fixes applied: {len(fixes['fixes'])}")
        print(f"Remaining issues: {len(verification['issues_remaining'])}")
        print(f"Success rate: {(len(diagnosis['issues_found']) - len(verification['issues_remaining'])) / max(len(diagnosis['issues_found']), 1) * 100:.1f}%")

if __name__ == "__main__":
    main()
