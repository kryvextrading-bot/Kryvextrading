import { Calendar, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const newsData = [
  {
    id: '1',
    title: 'XRP Price Prediction: Geopolitical Tensions Spur Ripple Sell-Off – Will $XRP Drop below $2?',
    category: 'Latest',
    date: '2025-01-12',
    time: '13:20:33',
    image: '/api/placeholder/400/200'
  },
  {
    id: '2',
    title: 'Blockstream\'s Adam Back Says Altcoin Season \'Is Over\' — Time to Rotate Into Bitcoin Treasuries',
    category: 'Latest',
    date: '2025-01-12',
    time: '11:10:51',
    image: '/api/placeholder/400/200'
  },
  {
    id: '3',
    title: 'Ethereum Price Prediction As ETH Continues to Fall Behind Bitcoin in January 2025',
    category: 'Latest',
    date: '2025-01-11',
    time: '19:25:15',
    image: '/api/placeholder/400/200'
  },
  {
    id: '4',
    title: '\'Rich Dad Poor Dad\' Author Robert Kiyosaki Predicts \'Biggest Debt Bubble\' Collapse, Says Buy Bitcoin to Get Richer',
    category: 'Latest',
    date: '2025-01-11',
    time: '18:50:11',
    image: '/api/placeholder/400/200'
  },
];

export function NewsSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">News</h2>
        <Button variant="ghost" size="sm" className="text-primary">
          See All
        </Button>
      </div>

      <div className="space-y-4">
        {newsData.map((news) => (
          <Card key={news.id} className="p-4 bg-gradient-card hover:shadow-card transition-all duration-300 cursor-pointer">
            <div className="flex space-x-3">
              <div className="w-16 h-16 bg-secondary rounded-lg flex-shrink-0 overflow-hidden">
                <div className="w-full h-full bg-gradient-primary/20 flex items-center justify-center">
                  <span className="text-xs text-center px-1">📰</span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <span className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded">
                    {news.category}
                  </span>
                </div>
                
                <h3 className="font-medium text-sm leading-tight mb-2 line-clamp-2">
                  {news.title}
                </h3>
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{news.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{news.time}</span>
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