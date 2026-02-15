import { OrderSide } from '@/constants/trading';
import { Position } from '@/types/trading';

export const formatPrice = (price: number, tickSize: number = 0.01): string => {
  return price.toFixed(tickSize.toString().split('.')[1]?.length || 2);
};

export const formatAmount = (amount: number, stepSize: number = 0.0001): string => {
  return amount.toFixed(stepSize.toString().split('.')[1]?.length || 4);
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const calculateMargin = (amount: number, leverage: number): number => {
  return amount / leverage;
};

export const calculatePositionSize = (margin: number, leverage: number): number => {
  return margin * leverage;
};

export const calculateLiquidationPrice = (
  entryPrice: number,
  leverage: number,
  side: OrderSide,
  maintenanceMargin: number = 0.005
): number => {
  const liquidationBuffer = 0.01; // 1% buffer
  
  if (side === 'buy') {
    return entryPrice * (1 - (1 / leverage) - maintenanceMargin - liquidationBuffer);
  } else {
    return entryPrice * (1 + (1 / leverage) + maintenanceMargin + liquidationBuffer);
  }
};

export const calculatePnL = (
  entryPrice: number,
  currentPrice: number,
  size: number,
  side: OrderSide
): number => {
  if (side === 'buy') {
    return (currentPrice - entryPrice) * size;
  } else {
    return (entryPrice - currentPrice) * size;
  }
};

export const calculatePnLPercentage = (
  entryPrice: number,
  currentPrice: number,
  leverage: number,
  side: OrderSide
): number => {
  const priceChange = side === 'buy'
    ? (currentPrice - entryPrice) / entryPrice
    : (entryPrice - currentPrice) / entryPrice;
  
  return priceChange * leverage * 100;
};

export const calculateRequiredMargin = (
  positionSize: number,
  leverage: number
): number => {
  return positionSize / leverage;
};

export const calculateMaxPositionSize = (
  availableBalance: number,
  leverage: number,
  currentPrice: number
): number => {
  return (availableBalance * leverage) / currentPrice;
};

export const validateOrder = (params: {
  type: string;
  side: OrderSide;
  amount: number;
  price: number;
  balance: number;
  minAmount?: number;
  maxAmount?: number;
}): { valid: boolean; error?: string } => {
  if (params.amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (params.minAmount && params.amount < params.minAmount) {
    return { valid: false, error: `Minimum amount is ${params.minAmount}` };
  }

  if (params.maxAmount && params.amount > params.maxAmount) {
    return { valid: false, error: `Maximum amount is ${params.maxAmount}` };
  }

  const total = params.amount * params.price;
  if (total > params.balance) {
    return { valid: false, error: 'Insufficient balance' };
  }

  return { valid: true };
};

export const calculateFee = (amount: number, rate: number): number => {
  return amount * rate;
};

export const calculateSlippage = (
  expectedPrice: number,
  actualPrice: number
): number => {
  return ((actualPrice - expectedPrice) / expectedPrice) * 100;
};

export const calculateRiskReward = (
  entryPrice: number,
  takeProfit: number,
  stopLoss: number,
  side: OrderSide
): number => {
  if (side === 'buy') {
    const reward = takeProfit - entryPrice;
    const risk = entryPrice - stopLoss;
    return risk > 0 ? reward / risk : 0;
  } else {
    const reward = entryPrice - takeProfit;
    const risk = stopLoss - entryPrice;
    return risk > 0 ? reward / risk : 0;
  }
};

export const calculatePositionValue = (
  amount: number,
  price: number
): number => {
  return amount * price;
};

export const calculateLeverageEffect = (
  percentageChange: number,
  leverage: number
): number => {
  return percentageChange * leverage;
};

export const calculateFundingFee = (
  positionSize: number,
  fundingRate: number
): number => {
  return positionSize * fundingRate;
};

export const calculateMaintenanceMargin = (
  positionSize: number,
  maintenanceRate: number
): number => {
  return positionSize * maintenanceRate;
};

export const isNearLiquidation = (
  currentPrice: number,
  liquidationPrice: number,
  side: OrderSide,
  threshold: number = 0.05
): boolean => {
  if (side === 'buy') {
    const distance = (currentPrice - liquidationPrice) / liquidationPrice;
    return distance <= threshold;
  } else {
    const distance = (liquidationPrice - currentPrice) / currentPrice;
    return distance <= threshold;
  }
};

export const calculateOptimalLeverage = (
  volatility: number,
  riskTolerance: number = 0.02
): number => {
  // Kelly Criterion based optimal leverage
  return Math.min(100, Math.max(1, Math.floor(riskTolerance / volatility)));
};

export const calculateDrawdown = (
  peak: number,
  current: number
): number => {
  return ((peak - current) / peak) * 100;
};

export const calculateSharpeRatio = (
  returns: number[],
  riskFreeRate: number = 0.02
): number => {
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return (avgReturn - riskFreeRate) / stdDev;
};