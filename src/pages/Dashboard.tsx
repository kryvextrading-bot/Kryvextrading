import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user, loading } = useAuth();

  // 1️⃣ Wait until auth state is resolved
  if (loading) {
    return null; // or a spinner component
  }

  // 2️⃣ Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3️⃣ Redirect authenticated users to portfolio
  return <Navigate to="/portfolio" replace />;
}
