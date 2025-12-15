import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import BOMUpload from "./pages/BOMUpload";
import Customers from "./pages/Customers";
import CustomerAdd from "./pages/CustomerAdd";
import CustomerDetail from "./pages/CustomerDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SettingsShop from "./pages/SettingsShop";
import SettingsAI from "./pages/SettingsAI";
import SettingsInvoice from "./pages/SettingsInvoice";
import SettingsNotifications from "./pages/SettingsNotifications";
import SettingsSync from "./pages/SettingsSync";
import SettingsPrivacy from "./pages/SettingsPrivacy";
import Help from "./pages/Help";
import Billing from "./pages/Billing";
import InvoiceDetail from "./pages/InvoiceDetail";
import Staff from "./pages/Staff";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Check if this is the first app load in this session
const isFirstLoad = !sessionStorage.getItem('app_loaded');
if (isFirstLoad) {
  sessionStorage.setItem('app_loaded', 'true');
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(isFirstLoad);
  const [isCheckingAuth, setIsCheckingAuth] = useState(!isFirstLoad);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isFirstLoad) {
      // Check auth immediately for non-first loads
      checkAuth();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleSplashComplete = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    setShowSplash(false);
  };

  // Show splash only on first app load
  if (showSplash) {
    return <Splash onComplete={handleSplashComplete} />;
  }

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} />
      <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />} />
      <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" replace />} />
      <Route path="/inventory" element={isAuthenticated ? <Inventory /> : <Navigate to="/auth" replace />} />
      <Route path="/inventory/upload" element={isAuthenticated ? <BOMUpload /> : <Navigate to="/auth" replace />} />
      <Route path="/inventory/add" element={isAuthenticated ? <BOMUpload /> : <Navigate to="/auth" replace />} />
      <Route path="/customers" element={isAuthenticated ? <Customers /> : <Navigate to="/auth" replace />} />
      <Route path="/customers/add" element={isAuthenticated ? <CustomerAdd /> : <Navigate to="/auth" replace />} />
      <Route path="/customers/:id" element={isAuthenticated ? <CustomerDetail /> : <Navigate to="/auth" replace />} />
      <Route path="/reports" element={isAuthenticated ? <Reports /> : <Navigate to="/auth" replace />} />
      <Route path="/invoices/:id" element={isAuthenticated ? <InvoiceDetail /> : <Navigate to="/auth" replace />} />
      <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/auth" replace />} />
      <Route path="/settings/shop" element={isAuthenticated ? <SettingsShop /> : <Navigate to="/auth" replace />} />
      <Route path="/settings/ai" element={isAuthenticated ? <SettingsAI /> : <Navigate to="/auth" replace />} />
      <Route path="/settings/invoice" element={isAuthenticated ? <SettingsInvoice /> : <Navigate to="/auth" replace />} />
      <Route path="/settings/notifications" element={isAuthenticated ? <SettingsNotifications /> : <Navigate to="/auth" replace />} />
      <Route path="/settings/sync" element={isAuthenticated ? <SettingsSync /> : <Navigate to="/auth" replace />} />
      <Route path="/settings/privacy" element={isAuthenticated ? <SettingsPrivacy /> : <Navigate to="/auth" replace />} />
      <Route path="/help" element={isAuthenticated ? <Help /> : <Navigate to="/auth" replace />} />
      <Route path="/billing" element={isAuthenticated ? <Billing /> : <Navigate to="/auth" replace />} />
      <Route path="/billing/new" element={isAuthenticated ? <Billing /> : <Navigate to="/auth" replace />} />
      <Route path="/staff" element={isAuthenticated ? <Staff /> : <Navigate to="/auth" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;