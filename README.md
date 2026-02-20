# Swan IRA Portal

A comprehensive cryptocurrency IRA platform built with React, TypeScript, and Node.js.

## 🚀 Quick Start

### Option 1: Automated Launch (Recommended)
1. **Windows Batch File:**
   ```bash
   launch.bat
   ```

2. **PowerShell Script:**
   ```powershell
   .\launch.ps1
   ```

### Option 2: Manual Launch
1. **Start Backend Server:**
   ```bash
   npm run server
   ```

2. **Start Frontend (in new terminal):**
   ```bash
   npm run dev
   ```

3. **Open in Browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Quick Access: http://localhost:5173/#/quick-access

## 🔑 Test Credentials

### User Login
- **Email:** john.doe@email.com
- **Password:** password

### Admin Access
- Available after user login (status: Active)
- Access admin panel at: http://localhost:5173/#/admin

## 📁 Project Structure

```
swan-echo-portal-main/
├── src/
│   ├── components/          # UI Components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── layout/          # Header, Navigation
│   │   └── ui/              # Reusable UI components
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   └── ...              # User pages
│   ├── services/            # API services
│   ├── contexts/            # React contexts
│   └── hooks/               # Custom hooks
├── server.js                # Express backend server
├── launch.bat               # Windows batch launcher
├── launch.ps1               # PowerShell launcher
└── package.json
```

## 🛠️ Features

### User Features
- ✅ User registration and authentication
- ✅ Dashboard with portfolio overview
- ✅ Real-time crypto price tracking
- ✅ Account management
- ✅ Investment options
- ✅ News section

### Admin Features
- ✅ User management
- ✅ Transaction management
- ✅ System settings
- ✅ Dashboard statistics
- ✅ Role-based access control

### Technical Features
- ✅ React 18 with TypeScript
- ✅ Tailwind CSS for styling
- ✅ Express.js backend API
- ✅ Protected routes
- ✅ Authentication context
- ✅ Responsive design
- ✅ Modern UI components

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Chrome browser

### Installation
```bash
npm install
```

### Available Scripts
- `npm run dev` - Start frontend development server
- `npm run server` - Start backend API server
- `npm run dev:full` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID

### Crypto
- `GET /api/crypto/prices` - Get crypto prices
- `GET /api/crypto/prices/:symbol` - Get specific crypto price

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🎨 UI Components

Built with shadcn/ui components:
- Buttons, Cards, Forms
- Navigation, Dropdowns
- Tables, Modals
- Charts, Progress bars
- And more...

## 🔒 Security Features

- Protected routes with authentication
- Role-based access control
- JWT token management
- CORS configuration
- Input validation

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Adaptive navigation

## 🚀 Deployment

### Frontend (Vite)
```bash
npm run build
```

### Backend (Node.js)
```bash
node server.js
```

## 📞 Support

For support or questions:
- Email: support@swan-ira.com
- Documentation: [Coming Soon]
- Issues: [GitHub Issues]

## 📄 License

This project is licensed under the MIT License.

---

**Swan IRA Portal** - Secure • Compliant • Insured
