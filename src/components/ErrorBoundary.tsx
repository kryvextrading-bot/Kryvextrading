import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
          <div className="max-w-md mx-auto px-4">
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
                <p className="text-gray-400 mb-4">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="w-full bg-[#F0B90B] text-black hover:bg-yellow-400"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/admin/dashboard'}
                    className="w-full border-gray-700"
                  >
                    Back to Dashboard
                  </Button>
                </div>
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-400">
                    💡 If this persists, check the browser console for more details
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
