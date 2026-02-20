// Validation middleware for ledger entries
import { Request, Response, NextFunction } from 'express';
import { validateLedgerEntry } from '@/types/database';

export const validateLedgerEntryMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validateLedgerEntry(req.body);
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
        message: 'Invalid ledger entry data',
        received: req.body
      });
    }
    
    // Add timestamps if not provided
    if (!req.body.created_at) {
      req.body.created_at = new Date().toISOString();
    }
    
    next();
  } catch (error) {
    console.error('Ledger entry validation error:', error);
    return res.status(500).json({
      error: 'Internal server error during validation',
      message: 'Failed to validate ledger entry'
    });
  }
};

// Helper function to log detailed errors
export const logValidationError = (error: any, body: any) => {
  console.error('🚨 Ledger Entry Validation Error:', {
    error: error.message,
    stack: error.stack,
    requestBody: body,
    timestamp: new Date().toISOString()
  });
};
