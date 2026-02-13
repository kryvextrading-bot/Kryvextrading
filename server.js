import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios'; // Add this at the top if not already present

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const users = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    status: 'Active',
    kycStatus: 'Verified',
    accountType: 'Traditional IRA',
    accountNumber: 'IRA-2024-001234',
    balance: 45230.50,
    lastLogin: '2 hours ago',
    registrationDate: '2024-01-15',
    twoFactorEnabled: true,
    riskTolerance: 'Moderate',
    investmentGoal: 'Retirement',
    isAdmin: false
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    phone: '+1 (555) 234-5678',
    status: 'Pending',
    kycStatus: 'Pending',
    accountType: 'Roth IRA',
    accountNumber: 'IRA-2024-001235',
    balance: 12450.00,
    lastLogin: '1 day ago',
    registrationDate: '2024-01-20',
    twoFactorEnabled: false,
    riskTolerance: 'Conservative',
    investmentGoal: 'Wealth Building',
    isAdmin: false
  },
  // --- ADMIN USER ---
  {
    id: '99',
    firstName: 'Admin',
    lastName: 'Laurent',
    email: 'admin@swan-ira.com',
    phone: '+1 (555) 000-0000',
    status: 'Active',
    kycStatus: 'Verified',
    accountType: 'Admin',
    accountNumber: 'ADMIN-0001',
    balance: 0,
    lastLogin: 'just now',
    registrationDate: '2024-01-01',
    twoFactorEnabled: true,
    riskTolerance: 'N/A',
    investmentGoal: 'Admin',
    isAdmin: true,
    password: 'admin123'
  }
];

const transactions = [
  {
    id: 'TXN-001',
    userId: '1',
    userEmail: 'john.doe@email.com',
    type: 'Buy',
    asset: 'Bitcoin',
    amount: '0.5 BTC',
    value: 23450.00,
    status: 'Completed',
    date: '2024-01-15 14:30:00',
    fee: 12.50
  },
  {
    id: 'TXN-002',
    userId: '2',
    userEmail: 'jane.smith@email.com',
    type: 'Sell',
    asset: 'Ethereum',
    amount: '2.5 ETH',
    value: 7890.00,
    status: 'Pending',
    date: '2024-01-15 13:45:00',
    fee: 8.75
  }
];

const cryptoPrices = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 117727.00,
    change24h: 0.70,
    volume24h: 48163307000,
    marketCap: 2300000000000
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2967.59,
    change24h: 0.59,
    volume24h: 48596018000,
    marketCap: 356000000000
  }
];

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Swan IRA API is running' });
});

// User routes
app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const newUser = {
    id: (users.length + 1).toString(),
    ...req.body,
    status: 'Pending',
    kycStatus: 'Pending',
    accountNumber: `IRA-2024-${String(users.length + 1).padStart(6, '0')}`,
    balance: 0,
    lastLogin: new Date().toISOString(),
    registrationDate: new Date().toISOString().split('T')[0],
    twoFactorEnabled: false,
    riskTolerance: 'Moderate',
    investmentGoal: 'Retirement'
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

// Transaction routes
app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

app.get('/api/transactions/:id', (req, res) => {
  const transaction = transactions.find(t => t.id === req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json(transaction);
});

// Crypto routes
app.get('/api/crypto/prices', (req, res) => {
  res.json(cryptoPrices);
});

app.get('/api/crypto/prices/:symbol', (req, res) => {
  const crypto = cryptoPrices.find(c => c.symbol === req.params.symbol.toUpperCase());
  if (!crypto) {
    return res.status(404).json({ error: 'Crypto not found' });
  }
  res.json(crypto);
});

// KuCoin orderbook route
app.get('/api/kucoin/orderbook', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Missing symbol parameter' });
  }
  try {
    const kucoinUrl = `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${symbol}`;
    const response = await axios.get(kucoinUrl);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from KuCoin', details: err.message });
  }
});

// Add this route near your other API routes:
let coinGeckoCache = null;
let coinGeckoCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

app.get('/api/coingecko/prices', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (coinGeckoCache && (now - coinGeckoCacheTime) < CACHE_DURATION) {
      return res.json(coinGeckoCache);
    }

    const params = new URLSearchParams(req.query).toString();
    const url = `https://api.coingecko.com/api/v3/simple/price?${params}`;
    
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Swan-IRA-Portal/1.0'
      }
    });
    
    // Cache the response
    coinGeckoCache = response.data;
    coinGeckoCacheTime = now;
    
    res.json(response.data);
  } catch (err) {
    console.error('CoinGecko API error:', err.message);
    
    // Return cached data if available, even if expired
    if (coinGeckoCache) {
      return res.json(coinGeckoCache);
    }
    
    // Return fallback data if no cache available
    const fallbackData = {
      bitcoin: { usd: 45000 },
      ethereum: { usd: 2500 },
      binancecoin: { usd: 320 },
      solana: { usd: 120 },
      cardano: { usd: 0.55 },
      ripple: { usd: 0.65 },
      dogecoin: { usd: 0.08 },
      'matic-network': { usd: 0.85 }
    };
    
    res.json(fallbackData);
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const totalVolume = transactions.reduce((sum, t) => sum + t.value, 0);
  const pendingTransactions = transactions.filter(t => t.status === 'Pending').length;
  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);

  res.json({
    totalUsers,
    activeUsers,
    totalVolume,
    pendingTransactions,
    totalBalance
  });
});

// Authentication routes
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login attempt:', { email: req.body.email, password: req.body.password ? '***' : 'missing' });
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    console.log('❌ Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Mock authentication - in real app, you'd check against database
  const user = users.find(u => u.email === email);
  console.log('👤 User found:', user ? `ID: ${user.id}, Admin: ${user.isAdmin}` : 'Not found');
  
  // Check admin password for admin user
  if (user && user.isAdmin && password === user.password) {
    console.log('✅ Admin login successful');
    const token = `mock-jwt-token-${Date.now()}`;
    const { password, ...userWithoutPassword } = user;
    return res.json({ token, user: userWithoutPassword });
  }
  
  // Regular user login
  if (!user || (!user.isAdmin && password !== 'password')) {
    console.log('❌ Invalid credentials');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  console.log('✅ Regular user login successful');
  const token = `mock-jwt-token-${Date.now()}`;
  const { password: pw, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, phone } = req.body;
  
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser = {
    id: (users.length + 1).toString(),
    firstName,
    lastName,
    email,
    phone: phone || '',
    status: 'Pending',
    kycStatus: 'Pending',
    accountType: 'Traditional IRA',
    accountNumber: `IRA-2024-${String(users.length + 1).padStart(6, '0')}`,
    balance: 0,
    lastLogin: new Date().toISOString(),
    registrationDate: new Date().toISOString().split('T')[0],
    twoFactorEnabled: false,
    riskTolerance: 'Moderate',
    investmentGoal: 'Retirement'
  };

  users.push(newUser);
  const token = `mock-jwt-token-${Date.now()}`;
  res.status(201).json({ token, user: newUser });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Swan IRA Server running on http://localhost:${PORT}`);
  console.log(`📊 API Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`💰 Transactions API: http://localhost:${PORT}/api/transactions`);
  console.log(`📈 Crypto API: http://localhost:${PORT}/api/crypto/prices`);
}); 