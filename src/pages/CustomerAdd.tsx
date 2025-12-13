import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Tag,
  Save
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { db } from '@/lib/database';
import type { Customer, CustomerTag } from '@/types';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const availableTags: CustomerTag[] = ['Regular', 'VIP', 'New', 'Wholesale'];

export default function CustomerAdd() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    tags: ['New'] as CustomerTag[],
    outstandingCredit: 0
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag: CustomerTag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      const customer: Customer = {
        id: uuidv4(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        tags: formData.tags,
        outstandingCredit: formData.outstandingCredit,
        createdAt: new Date()
      };

      await db.customers.add(customer);
      toast.success('Customer added successfully!');
      navigate('/customers');
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Error adding customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout title="Add Customer" hideNav>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Add Customer</h1>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Customer Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter customer name"
                className="input-field pl-11"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="input-field pl-11"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Email (Optional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter email address"
                className="input-field pl-11"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Address (Optional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Enter address"
                rows={3}
                className="input-field pl-11 resize-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Customer Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2',
                    formData.tags.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  <Tag className="w-4 h-4" />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Outstanding Credit */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Outstanding Credit (₹)
            </label>
            <input
              type="number"
              value={formData.outstandingCredit}
              onChange={(e) => handleChange('outstandingCredit', Number(e.target.value))}
              placeholder="0"
              min="0"
              className="input-field"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl btn-gold font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? 'Saving...' : 'Save Customer'}
        </button>
      </div>
    </AppLayout>
  );
}
