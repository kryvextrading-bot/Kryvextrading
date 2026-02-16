import React from 'react';
import { TrendingUp as TrendingUpIcon } from 'lucide-react';

interface TrendingUpProps {
  size?: number | string;
  className?: string;
  [key: string]: any;
}

export const TrendingUp: React.FC<TrendingUpProps> = (props) => {
  return <TrendingUpIcon {...props} />;
};

export default TrendingUp;
