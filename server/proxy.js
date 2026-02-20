import express from 'express';
import cors from 'cors';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3001;

// Deposit addresses (same as frontend)
const depositAddresses = [
  { label: 'BTC', value: '1FTUbAx5QNTWbxyeMPpxRbwqH3XnvwKQb', note: "Don't send NFTs to this address. Smart contract deposits are not supported with the exception of ETH via ERC20, BSC via BEP20, Arbitrum and Optimism networks." },
  { label: 'ETH', value: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' },
  { label: 'BNB', value: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2' },
  { label: 'XRP', value: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh' },
  { label: 'ADA', value: 'addr1q9d5u0w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2' },
  { label: 'DOGE', value: 'D5d8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8' },
  { label: 'SOL', value: '72K1NJZfx4nNDKWNYwkDRMDzBxYfsmn8o2qTiDspfqkd' },
  { label: 'LTC', value: 'LZg8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8' },
  { label: 'DOT', value: '1dotdotdotdotdotdotdotdotdotdotdotdotdot' },
  { label: 'LINK', value: '0xlinklinklinklinklinklinklinklinklinklink' },
  { label: 'MATIC', value: '0xmaticmaticmaticmaticmaticmaticmaticmatic' },
  { label: 'TRC20', value: 'TYdFjAfhWL9DjaDBAe5LS7zUjBqpYGkRYB' },
  { label: 'BEP20', value: '0xd5fffaa3740af39c265563aec8c14bd08c05e838' },
  { label: 'ERC20', value: '0xd5fffaa3740af39c265563aec8c14bd08c05e838' },
  { label: 'Optimism', value: '0xd5fffaa3740af39c265563aec8c14bd08c05e838' },
  { label: 'BNB Smart Chain (BEP20)', value: '0xd5fffaa3740af39c265563aec8c14bd08c05e838' },
  { label: 'Arbitrum One', value: '0xd5fffaa3740af39c265563aec8c14bd08c05e838' },
  { label: 'Avalanche', value: 'X-avax18pps7dlperx5z49sfls524ctznjdyq0q8z5py0', note: 'This deposit address supports X-Chain deposits. For C-Chain deposits, please use the AVAXC network.' },
];

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// In-memory cache to reduce API calls
const cache = new Map();
const CACHE_TTL = 60000; // 60 seconds cache

// Rate limiting for our proxy (more restrictive)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Reduced to 10 requests per minute
  message: { error: 'Too many requests from this IP', retryAfter: 60 },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CoinGecko proxy endpoint with caching
app.get('/api/crypto/prices', async (req, res) => {
  try {
    const { ids = 'bitcoin,ethereum,binancecoin,solana,cardano,ripple,dogecoin,matic-network' } = req.query;
    const cacheKey = `prices_${ids}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📦 Serving from cache');
      return res.json(cached.data);
    }
    
    console.log('🌐 Fetching from CoinGecko API');
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids,
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_market_cap: true,
          include_24hr_vol: true
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'CryptoProxy/1.0'
        },
        timeout: 15000 // Increased timeout
      }
    );

    // Cache the response
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });

    // Clean old cache entries periodically
    if (cache.size > 50) {
      for (const [key, value] of cache.entries()) {
        if (Date.now() - value.timestamp > CACHE_TTL * 2) {
          cache.delete(key);
        }
      }
    }

    // Cache headers for client
    res.set('Cache-Control', 'public, max-age=30'); // 30 seconds cache
    res.json(response.data);
  } catch (error) {
    console.error('CoinGecko API Error:', error.response?.data || error.message);
    
    // If we have cached data, serve it even if expired
    const cacheKey = `prices_${req.query.ids}`;
    const staleCache = cache.get(cacheKey);
    if (staleCache) {
      console.log('🔄 Serving stale cache due to API error');
      res.set('Cache-Control', 'public, max-age=5'); // Short cache for stale data
      return res.json(staleCache.data);
    }
    
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: parseInt(retryAfter) || 60,
        fallback: 'Using cached data if available'
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({ 
        error: 'Request timeout. CoinGecko API is slow.',
        retryAfter: 30
      });
    } else {
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to fetch crypto prices',
        details: error.message,
        retryAfter: 30
      });
    }
  }
});

// Health check with cache info
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cacheSize: cache.size,
    cacheTTL: CACHE_TTL / 1000
  });
});

// Clear cache endpoint for debugging
app.get('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared', timestamp: new Date().toISOString() });
});

// Deposit request endpoint
app.post('/api/deposit-requests', upload.single('proof'), async (req, res) => {
  try {
    const { amount, currency, network, userId, userEmail, userName } = req.body;
    const proofFile = req.file;

    if (!amount || !currency || !network || !userId || !proofFile) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Amount, currency, network, userId, and proof file are required'
      });
    }

    // Create deposit request object
    const depositRequest = {
      id: `deposit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userEmail,
      userName,
      type: 'deposit',
      amount: parseFloat(amount),
      currency,
      network,
      status: 'pending',
      method: 'blockchain',
      address: depositAddresses.find(a => a.label === network)?.value || '',
      proof: {
        filename: proofFile.filename,
        originalName: proofFile.originalname,
        path: proofFile.path,
        size: proofFile.size,
        mimetype: proofFile.mimetype
      },
      description: `Deposit request for ${amount} ${currency} via ${network}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      riskScore: 25,
      kycVerified: true,
      metadata: {
        network,
        proofUrl: `/uploads/${proofFile.filename}`
      }
    };

    // Store deposit request in memory (in production, this would go to a database)
    if (!global.depositRequests) {
      global.depositRequests = [];
    }
    global.depositRequests.push(depositRequest);

    console.log('📝 New deposit request:', depositRequest);

    // In a real implementation, you would:
    // 1. Save to database
    // 2. Send notification to admin
    // 3. Send confirmation email to user

    res.json({ 
      success: true,
      message: 'Deposit request submitted successfully',
      requestId: depositRequest.id,
      status: 'pending'
    });

  } catch (error) {
    console.error('Deposit request error:', error);
    res.status(500).json({ 
      error: 'Failed to submit deposit request',
      details: error.message
    });
  }
});

// Get all deposit requests endpoint
app.get('/api/deposit-requests', (req, res) => {
  try {
    const requests = global.depositRequests || [];
    res.json({
      success: true,
      requests: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Error fetching deposit requests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch deposit requests',
      details: error.message
    });
  }
});

// Update deposit request status endpoint
app.put('/api/deposit-requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!global.depositRequests) {
      global.depositRequests = [];
    }
    
    const requestIndex = global.depositRequests.findIndex(req => req.id === id);
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Deposit request not found' });
    }
    
    global.depositRequests[requestIndex].status = status;
    global.depositRequests[requestIndex].updatedAt = new Date().toISOString();
    
    console.log(`📝 Deposit request ${id} updated to status: ${status}`);
    
    res.json({
      success: true,
      message: 'Deposit request updated successfully',
      request: global.depositRequests[requestIndex]
    });
  } catch (error) {
    console.error('Error updating deposit request:', error);
    res.status(500).json({ 
      error: 'Failed to update deposit request',
      details: error.message
    });
  }
});

// Serve uploaded files
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Crypto proxy server running on http://localhost:${PORT}`);
  console.log(`📦 Cache TTL: ${CACHE_TTL/1000}s`);
  console.log(`🚦 Rate limit: 10 requests/minute`);
});
