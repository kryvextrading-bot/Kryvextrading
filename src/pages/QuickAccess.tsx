import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Shield, ArrowRight, Home } from 'lucide-react';

export default function QuickAccess() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-3xl">S</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Swan IRA Portal</h1>
          <p className="text-xl text-muted-foreground">Quick Access Dashboard</p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* User Portal */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">User Portal</h2>
              <p className="text-blue-700 mb-6">
                Access your IRA account, view portfolio, and manage investments
              </p>
              <div className="space-y-3">
                <Link to="/login">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Admin Portal */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-purple-900 mb-2">Admin Portal</h2>
              <p className="text-purple-700 mb-6">
                Manage users, transactions, and system settings
              </p>
              <div className="space-y-3">
                <Link to="/admin">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Admin Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/admin/users">
                  <Button className="w-full border-2 border-purple-600 text-purple-600 hover:bg-purple-50 bg-transparent">
                    User Management
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/">
            <Button className="w-full h-12 border-2 border-gray-300 hover:bg-gray-50 bg-transparent">
              <Home className="mr-2 h-4 w-4" />
              Home Page
            </Button>
          </Link>
          <Link to="/about">
            <Button className="w-full h-12 border-2 border-gray-300 hover:bg-gray-50 bg-transparent">
              About Swan IRA
            </Button>
          </Link>
          <Link to="/contact">
            <Button className="w-full h-12 border-2 border-gray-300 hover:bg-gray-50 bg-transparent">
              Contact Support
            </Button>
          </Link>
        </div>

        {/* Test Credentials */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Test Credentials:</h3>
          <div className="text-sm space-y-1">
            <p><strong>User Login:</strong> john.doe@email.com / password</p>
            <p><strong>Admin Access:</strong> Available after user login (status: Active)</p>
          </div>
        </div>
      </div>
    </div>
  );
} 