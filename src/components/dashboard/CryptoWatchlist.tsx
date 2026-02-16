import { useState, useEffect } from 'react';
import { TrendingDown } from 'lucide-react';
import { TrendingUp } from '@/components/icons/TrendingUp';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export function CryptoWatchlist() {
  const [cryptoData, setCryptoData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadCryptoData = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.getCryptoPrices();
        setCryptoData(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load crypto data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCryptoData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Watch List</h2>
          <Button className="text-primary hover:bg-muted">
            See All
          </Button>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 bg-gradient-card">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-20"></div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Watch List</h2>
        <Button className="text-primary hover:bg-muted">
          See All
        </Button>
      </div>

      <div className="space-y-3">
        {cryptoData.map((crypto) => (
          <Card key={crypto.symbol} className="p-4 bg-gradient-card hover:shadow-card transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  {crypto.symbol}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{crypto.symbol}/USD</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{crypto.name}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold">$ {crypto.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-end space-x-1">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                    crypto.change24h >= 0 
                      ? 'bg-success/20 text-success' 
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {crypto.change24h >= 0 ? (
                      <span className="text-green-500">↗</span>
                    ) : (
                      <span className="text-red-500">↘</span>
                    )}
                    <span>{crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}