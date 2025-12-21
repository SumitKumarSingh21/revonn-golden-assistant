import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Phone, Store, FileText, Eye, EyeOff, Loader2, User, Briefcase } from 'lucide-react';
import revonnLogo from '@/assets/revonn-logo.jpeg';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    shopName: '',
    ownerName: '',
    businessType: 'retail' as 'retail' | 'service',
    gstin: ''
  });

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Create email from phone number for Supabase auth
    const email = `${formData.phone}@revonn.app`;
    
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: formData.password
        });

        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Invalid phone number or password');
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success('Welcome back!');
      } else {
        if (!formData.shopName) {
          toast.error('Please enter your shop name');
          return;
        }

        if (!formData.ownerName) {
          toast.error('Please enter owner name');
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              shop_name: formData.shopName,
              owner_name: formData.ownerName,
              business_type: formData.businessType,
              gstin: formData.gstin,
              phone: formData.phone
            }
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This phone number is already registered. Please login.');
            setIsLogin(true);
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success('Account created! Welcome to Revonn Demo Mode.');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg">
              <img src={revonnLogo} alt="Revonn" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold gold-text">Revonn</h1>
            <p className="text-muted-foreground mt-2">AI-Powered Business OS</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="Enter 10-digit mobile number"
                  className="input-field pl-12"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Owner Name - Only for signup */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Owner Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="Your name"
                    className="input-field pl-12"
                  />
                </div>
              </div>
            )}

            {/* Shop Name - Only for signup */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Business Name
                </label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    placeholder="Your shop/business name"
                    className="input-field pl-12"
                  />
                </div>
              </div>
            )}

            {/* Business Type - Only for signup */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Business Type
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value as 'retail' | 'service' })}
                    className="input-field pl-12 appearance-none"
                  >
                    <option value="retail">Retail / Shop</option>
                    <option value="service">Service Business</option>
                  </select>
                </div>
              </div>
            )}

            {/* GSTIN - Only for signup, optional */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  GSTIN <span className="text-muted-foreground text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="22AAAAA0000A1Z5"
                    className="input-field pl-12"
                    maxLength={15}
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 chars)'}
                  className="input-field pr-12"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl btn-gold font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Free Account'
              )}
            </button>

            {/* Demo Info */}
            {!isLogin && (
              <p className="text-xs text-center text-muted-foreground">
                Start with free demo mode. No payment required.
              </p>
            )}
          </form>

          {/* Toggle Login/Signup */}
          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer with Policy Links */}
      <div className="py-4 text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
          <Link to="/policies/terms" className="text-primary hover:underline">
            Terms & Conditions
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link to="/policies/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link to="/policies/refund" className="text-primary hover:underline">
            Refund Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
