import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Simple admin dashboard without problematic icons
export default function SimpleAdmin() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, transactions, and system settings</p>
        </div>
        <Button>
          <span className="mr-2">🔄</span>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <span className="text-muted-foreground">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              892 active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <span className="text-muted-foreground">📋</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">23</div>
            <p className="text-xs text-muted-foreground">
              Requires review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <span className="text-muted-foreground">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.8M</div>
            <p className="text-xs text-muted-foreground">
              15,420 transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <span className="text-muted-foreground">⚡</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex-col h-20">
              <span className="text-2xl mb-2">👥</span>
              <span className="text-sm">User Management</span>
            </Button>
            <Button variant="outline" className="flex-col h-20">
              <span className="text-2xl mb-2">💰</span>
              <span className="text-sm">Transactions</span>
            </Button>
            <Button variant="outline" className="flex-col h-20">
              <span className="text-2xl mb-2">⚙️</span>
              <span className="text-sm">Settings</span>
            </Button>
            <Button variant="outline" className="flex-col h-20">
              <span className="text-2xl mb-2">📊</span>
              <span className="text-sm">Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge className="bg-yellow-500">⚠️</Badge>
                <div>
                  <p className="font-medium">Large transaction requires review</p>
                  <p className="text-sm text-muted-foreground">$50,000 withdrawal request</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">2 min ago</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge className="bg-green-500">✅</Badge>
                <div>
                  <p className="font-medium">New user registration</p>
                  <p className="text-sm text-muted-foreground">jane.smith@email.com</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">15 min ago</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge className="bg-blue-500">ℹ️</Badge>
                <div>
                  <p className="font-medium">System backup completed</p>
                  <p className="text-sm text-muted-foreground">Database backup successful</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Info */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Information</CardTitle>
          <CardDescription>Current admin session details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Logged in as:</p>
              <p className="text-lg">Adminlaurent</p>
            </div>
            <div>
              <p className="text-sm font-medium">Session:</p>
              <p className="text-lg">Active</p>
            </div>
            <div>
              <p className="text-sm font-medium">Last login:</p>
              <p className="text-lg">{new Date().toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Permissions:</p>
              <p className="text-lg">Full Admin Access</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 