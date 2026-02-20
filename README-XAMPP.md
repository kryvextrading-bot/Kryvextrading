# Swan Echo Portal - XAMPP Setup Guide

This guide will help you run the Swan Echo Portal project using XAMPP and Apache.

## Prerequisites

1. **XAMPP** - Download and install from [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. **Node.js** - Download and install from [https://nodejs.org/](https://nodejs.org/) (version 16 or higher)
3. **Git** - For cloning the repository (optional)

## Project Structure

This project consists of:
- **Frontend**: React application built with Vite (served by Apache)
- **Backend**: Express.js API server (runs on port 3001)

## Setup Instructions

### Step 1: Install Dependencies

1. Open Command Prompt or PowerShell
2. Navigate to the project directory:
   ```bash
   cd path\to\swan-echo-portal-main
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Step 2: Build the Frontend

1. Build the React application:
   ```bash
   npm run build
   ```
   This creates a `dist` folder with the production build.

### Step 3: Deploy to XAMPP

#### Option A: Manual Deployment

1. Copy the contents of the `dist` folder to:
   ```
   C:\xampp\htdocs\swan-echo-portal\
   ```

2. Copy the `.htaccess` file to the same directory.

#### Option B: Automated Deployment (Recommended)

1. Double-click `build-and-deploy.bat` in the project directory
2. This script will automatically:
   - Install dependencies if needed
   - Build the project
   - Copy files to XAMPP htdocs
   - Set up the correct directory structure

### Step 4: Start XAMPP Services

1. Open XAMPP Control Panel
2. Start **Apache** service
3. Verify Apache is running (should show green status)

### Step 5: Start the Backend Server

1. Open a new Command Prompt or PowerShell window
2. Navigate to the project directory
3. Run the backend server:
   ```bash
   npm run server
   ```
   
   Or double-click `start-backend.bat`

## Accessing the Application

- **Frontend**: http://localhost/swan-echo-portal
- **Backend API**: http://localhost:3001

## API Endpoints

The backend provides the following endpoints:

- `GET /api/health` - Health check
- `GET /api/users` - Get all users
- `GET /api/transactions` - Get all transactions
- `GET /api/crypto/prices` - Get crypto prices
- `GET /api/dashboard/stats` - Get dashboard statistics
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

## Troubleshooting

### Common Issues

1. **Port 3001 already in use**
   - Check if another application is using port 3001
   - Kill the process or change the port in `server.js`

2. **Apache not starting**
   - Check if port 80 or 443 is in use
   - Try changing Apache ports in XAMPP configuration

3. **CORS errors**
   - Ensure the backend server is running on port 3001
   - Check that the `.htaccess` file is properly configured

4. **Page not found errors**
   - Verify the `.htaccess` file is in the correct directory
   - Check Apache mod_rewrite is enabled

### Enabling Apache Modules

If you encounter issues, ensure these Apache modules are enabled in XAMPP:
- mod_rewrite
- mod_headers

To enable them:
1. Open `C:\xampp\apache\conf\httpd.conf`
2. Uncomment these lines (remove the #):
   ```apache
   LoadModule rewrite_module modules/mod_rewrite.so
   LoadModule headers_module modules/mod_headers.so
   ```
3. Restart Apache

## Development Mode

For development, you can run both frontend and backend simultaneously:

```bash
npm run dev:full
```

This will start:
- Frontend dev server on http://localhost:8080
- Backend API server on http://localhost:3001

## File Structure After Deployment

```
C:\xampp\htdocs\swan-echo-portal\
├── index.html
├── assets\
│   ├── css\
│   └── js\
├── .htaccess
└── [other build files]
```

## Security Notes

- This setup is for development purposes
- For production, consider:
  - Using HTTPS
  - Implementing proper authentication
  - Securing API endpoints
  - Using environment variables for sensitive data

## Support

If you encounter any issues, check:
1. XAMPP error logs: `C:\xampp\apache\logs\error.log`
2. Backend server console output
3. Browser developer tools console 