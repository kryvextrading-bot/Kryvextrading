import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Home, 
  ArrowLeft, 
  Search, 
  Compass, 
  AlertTriangle,
  FileQuestion,
  Map,
  RefreshCw,
  Shield,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  // Suggested routes
  const suggestedRoutes = [
    { path: '/', label: 'Home', icon: Home, description: 'Return to dashboard' },
    { path: '/portfolio', label: 'Portfolio', icon: Compass, description: 'View your investments' },
    { path: '/trading', label: 'Trading', icon: RefreshCw, description: 'Trade cryptocurrencies' },
    { path: '/wallet', label: 'Wallet', icon: Shield, description: 'Manage your assets' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#181A20] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-4xl mx-auto">
        
        {/* Main 404 Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="bg-[#1E2329] border border-[#2B3139] overflow-hidden">
            
            {/* Animated Background */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#F0B90B]/5 via-transparent to-[#F0B90B]/5" />
              
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#F0B90B]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#F0B90B]/10 rounded-full blur-3xl" />
              
              <div className="relative p-8 md:p-12 text-center">
                
                {/* 404 Illustration */}
                <motion.div 
                  className="relative mb-8"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="relative inline-block">
                    {/* Glowing Background */}
                    <div className="absolute inset-0 bg-[#F0B90B] blur-3xl opacity-20 rounded-full" />
                    
                    {/* Main Icon */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-[#F0B90B]/20">
                      <span className="text-[#181A20] font-bold text-6xl md:text-7xl">404</span>
                    </div>
                    
                    {/* Floating Elements */}
                    <motion.div 
                      className="absolute -top-4 -right-4 w-12 h-12 bg-[#2B3139] rounded-full flex items-center justify-center border-2 border-[#F0B90B]/20"
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, 10, 0]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <FileQuestion className="w-6 h-6 text-[#F0B90B]" />
                    </motion.div>
                    
                    <motion.div 
                      className="absolute -bottom-4 -left-4 w-10 h-10 bg-[#2B3139] rounded-full flex items-center justify-center border-2 border-[#F0B90B]/20"
                      animate={{ 
                        y: [0, 10, 0],
                        rotate: [0, -10, 0]
                      }}
                      transition={{ 
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Map className="w-5 h-5 text-[#F0B90B]" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Error Message */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <h1 className="text-3xl md:text-4xl font-bold text-[#EAECEF] mb-3">
                    Page Not Found
                  </h1>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-[#F0B90B]" />
                    <p className="text-lg text-[#848E9C]">
                      The page you're looking for doesn't exist or has been moved.
                    </p>
                  </div>
                  
                  {/* Requested Path */}
                  <div className="bg-[#2B3139]/30 rounded-lg p-3 mb-6 inline-block mx-auto">
                    <code className="text-sm font-mono text-[#F0B90B]">
                      {location.pathname}
                    </code>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <Button 
                    className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold px-6 h-12 rounded-xl"
                    onClick={() => navigate('/')}
                  >
                    <Home className="w-5 h-5 mr-2" />
                    Return Home
                    <span className="ml-2 text-xs bg-[#181A20]/20 px-2 py-1 rounded">
                      {countdown}s
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F] px-6 h-12 rounded-xl"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Go Back
                  </Button>
                </motion.div>

                {/* Search Bar */}
                <motion.form 
                  onSubmit={handleSearch}
                  className="max-w-md mx-auto mb-8"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#848E9C]" />
                    <input
                      type="text"
                      placeholder="Search for pages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#181A20] border border-[#2B3139] rounded-xl text-[#EAECEF] placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition-colors"
                    />
                    <Button 
                      type="submit"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-8"
                    >
                      Go
                    </Button>
                  </div>
                </motion.form>

                {/* Suggested Routes */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-[#F0B90B] rounded-full" />
                    <h2 className="text-sm font-semibold text-[#EAECEF]">
                      Popular Destinations
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestedRoutes.map((route) => {
                      const Icon = route.icon;
                      return (
                        <button
                          key={route.path}
                          onClick={() => navigate(route.path)}
                          className="flex items-center justify-between p-3 bg-[#181A20] hover:bg-[#23262F] rounded-lg border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center group-hover:bg-[#F0B90B]/20 transition-colors">
                              <Icon className="w-4 h-4 text-[#F0B90B]" />
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-medium text-[#EAECEF]">
                                {route.label}
                              </div>
                              <div className="text-xs text-[#848E9C]">
                                {route.description}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#848E9C] group-hover:text-[#F0B90B] transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Support Link */}
                <motion.div 
                  className="mt-8 pt-6 border-t border-[#2B3139]"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                >
                  <p className="text-sm text-[#848E9C]">
                    Need assistance?{' '}
                    <button 
                      onClick={() => navigate('/contact')}
                      className="text-[#F0B90B] hover:text-yellow-400 font-medium transition-colors"
                    >
                      Contact Support
                    </button>
                    {' '}or{' '}
                    <button 
                      onClick={() => navigate('/faq')}
                      className="text-[#F0B90B] hover:text-yellow-400 font-medium transition-colors"
                    >
                      Visit FAQ
                    </button>
                  </p>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Error Details */}
        <motion.div 
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.5 }}
        >
          <p className="text-xs text-[#5E6673]">
            Error 404 • {new Date().toLocaleDateString()} • Reference: ERR-404-{Math.random().toString(36).substring(2, 8).toUpperCase()}
          </p>
          <p className="text-xs text-[#5E6673] mt-1">
            If you believe this is a mistake, please report this issue to our support team.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotFound;