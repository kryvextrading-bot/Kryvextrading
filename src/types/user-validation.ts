// User validation types and functions based on database constraints
export type UserStatus = 'Active' | 'Pending' | 'Suspended';
export type KYCStatus = 'Verified' | 'Pending' | 'Rejected';
export type AccountType = 'Traditional IRA' | 'Roth IRA' | 'Admin';
export type AdminRole = 'admin' | 'superadmin' | 'finance' | 'support';
export type RiskTolerance = 'Conservative' | 'Moderate' | 'Aggressive' | 'Admin';
export type InvestmentGoal = 'Retirement' | 'Wealth Building' | 'Tax Savings' | 'Admin';

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  status: UserStatus | null;
  kyc_status: KYCStatus | null;
  account_type: AccountType | null;
  account_number: string | null;
  balance: number | null;
  last_login: string | null;
  registration_date: string | null;
  two_factor_enabled: boolean | null;
  risk_tolerance: RiskTolerance | null;
  investment_goal: InvestmentGoal | null;
  is_admin: boolean | null;
  admin_role: AdminRole | null;
  credit_score: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserInsert {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  status?: UserStatus | null;
  kyc_status?: KYCStatus | null;
  account_type?: AccountType | null;
  account_number?: string | null;
  balance?: number | null;
  last_login?: string | null;
  registration_date?: string | null;
  two_factor_enabled?: boolean | null;
  risk_tolerance?: RiskTolerance | null;
  investment_goal?: InvestmentGoal | null;
  is_admin?: boolean | null;
  admin_role?: AdminRole | null;
  credit_score?: number | null;
}

export interface UserUpdate {
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  status?: UserStatus | null;
  kyc_status?: KYCStatus | null;
  account_type?: AccountType | null;
  account_number?: string | null;
  balance?: number | null;
  last_login?: string | null;
  registration_date?: string | null;
  two_factor_enabled?: boolean | null;
  risk_tolerance?: RiskTolerance | null;
  investment_goal?: InvestmentGoal | null;
  is_admin?: boolean | null;
  admin_role?: AdminRole | null;
  credit_score?: number | null;
  updated_at?: string;
}

// Validation functions
export function validateUserEmail(email: string): string[] {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
    return errors;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }
  
  if (email.length > 255) {
    errors.push('Email must be less than 255 characters');
  }
  
  return errors;
}

export function validateUserStatus(status: string): string[] {
  const validStatuses: UserStatus[] = ['Active', 'Pending', 'Suspended'];
  if (!validStatuses.includes(status as UserStatus)) {
    return [`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`];
  }
  return [];
}

export function validateKYCStatus(kyc_status: string): string[] {
  const validStatuses: KYCStatus[] = ['Verified', 'Pending', 'Rejected'];
  if (!validStatuses.includes(kyc_status as KYCStatus)) {
    return [`Invalid KYC status: ${kyc_status}. Must be one of: ${validStatuses.join(', ')}`];
  }
  return [];
}

export function validateAccountType(account_type: string): string[] {
  const validTypes: AccountType[] = ['Traditional IRA', 'Roth IRA', 'Admin'];
  if (!validTypes.includes(account_type as AccountType)) {
    return [`Invalid account type: ${account_type}. Must be one of: ${validTypes.join(', ')}`];
  }
  return [];
}

export function validateAdminRole(admin_role: string): string[] {
  const validRoles: AdminRole[] = ['admin', 'superadmin', 'finance', 'support'];
  if (!validRoles.includes(admin_role as AdminRole)) {
    return [`Invalid admin role: ${admin_role}. Must be one of: ${validRoles.join(', ')}`];
  }
  return [];
}

export function validateRiskTolerance(risk_tolerance: string): string[] {
  const validTolerances: RiskTolerance[] = ['Conservative', 'Moderate', 'Aggressive', 'Admin'];
  if (!validTolerances.includes(risk_tolerance as RiskTolerance)) {
    return [`Invalid risk tolerance: ${risk_tolerance}. Must be one of: ${validTolerances.join(', ')}`];
  }
  return [];
}

export function validateInvestmentGoal(investment_goal: string): string[] {
  const validGoals: InvestmentGoal[] = ['Retirement', 'Wealth Building', 'Tax Savings', 'Admin'];
  if (!validGoals.includes(investment_goal as InvestmentGoal)) {
    return [`Invalid investment goal: ${investment_goal}. Must be one of: ${validGoals.join(', ')}`];
  }
  return [];
}

export function validateCreditScore(credit_score: number): string[] {
  const errors: string[] = [];
  
  if (credit_score < 300 || credit_score > 850) {
    errors.push('Credit score must be between 300 and 850');
  }
  
  if (!Number.isInteger(credit_score)) {
    errors.push('Credit score must be an integer');
  }
  
  return errors;
}

export function validateBalance(balance: number): string[] {
  const errors: string[] = [];
  
  if (balance < 0) {
    errors.push('Balance cannot be negative');
  }
  
  // Check for more than 8 decimal places (matches database numeric(20, 8))
  if (balance.toString().split('.')[1]?.length > 8) {
    errors.push('Balance cannot have more than 8 decimal places');
  }
  
  return errors;
}

export function validateUserInsert(user: UserInsert): string[] {
  const errors: string[] = [];
  
  // Required fields
  errors.push(...validateUserEmail(user.email));
  
  // Optional fields with validation (only validate if provided)
  if (user.status && user.status !== null) {
    errors.push(...validateUserStatus(user.status));
  }
  
  if (user.kyc_status && user.kyc_status !== null) {
    errors.push(...validateKYCStatus(user.kyc_status));
  }
  
  if (user.account_type && user.account_type !== null) {
    errors.push(...validateAccountType(user.account_type));
  }
  
  if (user.admin_role && user.admin_role !== null) {
    errors.push(...validateAdminRole(user.admin_role));
  }
  
  if (user.risk_tolerance && user.risk_tolerance !== null) {
    errors.push(...validateRiskTolerance(user.risk_tolerance));
  }
  
  if (user.investment_goal && user.investment_goal !== null) {
    errors.push(...validateInvestmentGoal(user.investment_goal));
  }
  
  if (user.credit_score !== undefined && user.credit_score !== null) {
    errors.push(...validateCreditScore(user.credit_score));
  }
  
  if (user.balance !== undefined && user.balance !== null) {
    errors.push(...validateBalance(user.balance));
  }
  
  // Name validation (only if provided)
  if (user.first_name && user.first_name !== null && user.first_name.length > 100) {
    errors.push('First name must be less than 100 characters');
  }
  
  if (user.last_name && user.last_name !== null && user.last_name.length > 100) {
    errors.push('Last name must be less than 100 characters');
  }
  
  if (user.phone && user.phone !== null && user.phone.length > 20) {
    errors.push('Phone number must be less than 20 characters');
  }
  
  return errors;
}

export function validateUserUpdate(user: UserUpdate): string[] {
  const errors: string[] = [];
  
  if (user.email) {
    errors.push(...validateUserEmail(user.email));
  }
  
  if (user.status) {
    errors.push(...validateUserStatus(user.status));
  }
  
  if (user.kyc_status) {
    errors.push(...validateKYCStatus(user.kyc_status));
  }
  
  if (user.account_type) {
    errors.push(...validateAccountType(user.account_type));
  }
  
  if (user.admin_role) {
    errors.push(...validateAdminRole(user.admin_role));
  }
  
  if (user.risk_tolerance) {
    errors.push(...validateRiskTolerance(user.risk_tolerance));
  }
  
  if (user.investment_goal) {
    errors.push(...validateInvestmentGoal(user.investment_goal));
  }
  
  if (user.credit_score !== undefined && user.credit_score !== null) {
    errors.push(...validateCreditScore(user.credit_score));
  }
  
  if (user.balance !== undefined && user.balance !== null) {
    errors.push(...validateBalance(user.balance));
  }
  
  // Name validation
  if (user.first_name !== undefined && user.first_name && user.first_name.length > 100) {
    errors.push('First name must be less than 100 characters');
  }
  
  if (user.last_name !== undefined && user.last_name && user.last_name.length > 100) {
    errors.push('Last name must be less than 100 characters');
  }
  
  if (user.phone !== undefined && user.phone && user.phone.length > 20) {
    errors.push('Phone number must be less than 20 characters');
  }
  
  return errors;
}
