import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  // Early return for unauthenticated users
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to portfolio page
  return <Navigate to="/portfolio" replace />;
}