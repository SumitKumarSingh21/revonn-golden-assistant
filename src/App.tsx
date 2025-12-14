import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/upload" element={<BOMUpload />} />
          <Route path="/inventory/add" element={<BOMUpload />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/add" element={<CustomerAdd />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/shop" element={<SettingsShop />} />
          <Route path="/settings/ai" element={<SettingsAI />} />
          <Route path="/settings/invoice" element={<SettingsInvoice />} />
          <Route path="/settings/notifications" element={<SettingsNotifications />} />
          <Route path="/settings/sync" element={<SettingsSync />} />
          <Route path="/settings/privacy" element={<SettingsPrivacy />} />
          <Route path="/help" element={<Help />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/billing/new" element={<Billing />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
