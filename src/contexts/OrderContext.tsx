import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMarketData } from './MarketDataContext';
import { useWallet } from './WalletContext';
import { v4 as uuidv4 } from 'uuid';

export type OrderType = 'Market' | 'Limit' | 'Stop' | 'Option';
export type OrderSide = 'Buy' | 'Sell';
export type OrderStatus = 'Open' | 'Filled' | 'Canceled' | 'Partially Filled';

export interface Order {
  id: string;
  type: OrderType;
  side: OrderSide;
  asset: string;
  price: number | null; // null for market orders
  amount: number;
  filled: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

interface OrderContextType {
  openOrders: Order[];
  closedOrders: Order[];
  placeOrder: (order: Omit<Order, 'id' | 'status' | 'filled' | 'createdAt' | 'updatedAt'>) => void;
  cancelOrder: (id: string) => void;
  modifyOrder: (id: string, updates: Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrderContext = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrderContext must be used within an OrderProvider');
  return ctx;
};

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [closedOrders, setClosedOrders] = useState<Order[]>([]);
  const { prices } = useMarketData();
  const { balance, setBalance, portfolio, updatePortfolio } = useWallet();

  // Helper: Reserve funds/assets for open orders
  const reserveForOrder = (order: Order) => {
    if (order.side === 'Buy') {
      // Reserve USDT
      const reserveAmount = order.price ? order.price * order.amount : (prices[order.asset] ?? 0) * order.amount;
      setBalance(balance - reserveAmount);
    } else {
      // Reserve asset
      updatePortfolio(
        portfolio.map(a =>
          a.symbol === order.asset ? { ...a, balance: a.balance - order.amount } : a
        )
      );
    }
  };
  // Helper: Release reserved funds/assets on cancel
  const releaseForOrder = (order: Order) => {
    if (order.side === 'Buy') {
      const reserveAmount = order.price ? order.price * order.amount : (prices[order.asset] ?? 0) * order.amount;
      setBalance(balance + reserveAmount);
    } else {
      updatePortfolio(
        portfolio.map(a =>
          a.symbol === order.asset ? { ...a, balance: a.balance + order.amount } : a
        )
      );
    }
  };
  // Helper: On fill, move reserved to actual (already done, so no-op unless you want to update average price, etc.)
  const fillOrder = (order: Order) => {
    if (order.side === 'Buy') {
      // Add asset to portfolio
      updatePortfolio(
        portfolio.map(a =>
          a.symbol === order.asset ? { ...a, balance: a.balance + order.amount } : a
        )
      );
    } else {
      // Add USDT to balance
      const reserveAmount = order.price ? order.price * order.amount : (prices[order.asset] ?? 0) * order.amount;
      setBalance(balance + reserveAmount);
    }
  };
  // Simulate order matching/filling
  useEffect(() => {
    setOpenOrders((orders) =>
      orders.map((order) => {
        if (order.status !== 'Open') return order;
        const currentPrice = prices[order.asset] ?? 0;
        let shouldFill = false;
        if (order.type === 'Market') {
          shouldFill = true;
        } else if (order.type === 'Limit') {
          shouldFill = order.side === 'Buy' ? currentPrice <= (order.price ?? 0) : currentPrice >= (order.price ?? 0);
        } else if (order.type === 'Stop') {
          shouldFill = order.side === 'Buy' ? currentPrice >= (order.price ?? 0) : currentPrice <= (order.price ?? 0);
        }
        if (shouldFill) {
          fillOrder(order);
          return {
            ...order,
            status: 'Filled' as const,
            filled: order.amount,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
  }, [prices]);
  // After filling or canceling an order, move it to closedOrders and remove from openOrders immediately.
  // In the setOpenOrders logic (e.g., in the effect that simulates order matching/filling):
  // After updating an order to 'Filled', move it to closedOrders and remove from openOrders.
  // In cancelOrder, after setting status to 'Canceled', move to closedOrders and remove from openOrders.
  //
  // The useEffect that was here is removed as per the edit hint.
  const placeOrder: OrderContextType['placeOrder'] = (orderInput) => {
    const now = new Date().toISOString();
    const order: Order = {
      id: uuidv4(),
      ...orderInput,
      status: 'Open', // Always set to 'Open' for all new orders
      filled: 0,
      createdAt: now,
      updatedAt: now,
    };
    reserveForOrder(order);
    setOpenOrders((prev) => [order, ...prev]);
  };

  const cancelOrder: OrderContextType['cancelOrder'] = (id) => {
    setOpenOrders((orders) =>
      orders.map((order) =>
        order.id === id && order.status === 'Open'
          ? { ...order, status: 'Canceled', updatedAt: new Date().toISOString() }
          : order
      )
    );
    setClosedOrders((prev) => [...prev, ...openOrders.filter(o => o.id === id)]);
    setOpenOrders((prev) => prev.filter(o => o.id !== id));
  };

  const modifyOrder: OrderContextType['modifyOrder'] = (id, updates) => {
    setOpenOrders((orders) =>
      orders.map((order) =>
        order.id === id && order.status === 'Open'
          ? { ...order, ...updates, updatedAt: new Date().toISOString() }
          : order
      )
    );
  };

  return (
    <OrderContext.Provider value={{ openOrders, closedOrders, placeOrder, cancelOrder, modifyOrder }}>
      {children}
    </OrderContext.Provider>
  );
}; 