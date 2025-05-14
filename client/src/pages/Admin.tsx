import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import AdminPanel from '@/components/admin/AdminPanel';

const Admin: React.FC = () => {
  const [, navigate] = useLocation();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);
  
  // Show loading state while checking auth
  if (loading || !isAuthenticated || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5350] mx-auto mb-4"></div>
        <p className="text-gray-500">Checking permissions...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | BitMon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <AdminPanel />
    </>
  );
};

export default Admin;
