import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Users,
  Phone,
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { db } from '@/lib/database';
import type { Staff, Attendance } from '@/types';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    phone: '',
    role: 'staff' as 'staff' | 'manager',
    pin: '',
    baseSalary: 0,
    salaryType: 'monthly' as 'monthly' | 'daily'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [staff, att] = await Promise.all([
        db.staff.getAll(),
        loadTodayAttendance()
      ]);
      setStaffList(staff);
      setAttendance(att);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTodayAttendance = async () => {
    const database = await (await import('@/lib/database')).getDB();
    const allAttendance = await database.getAll('attendance');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allAttendance.filter((a: Attendance) => {
      const attDate = new Date(a.date);
      attDate.setHours(0, 0, 0, 0);
      return attDate.getTime() === today.getTime();
    });
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.phone) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const staff: Staff = {
        id: uuidv4(),
        name: newStaff.name,
        phone: newStaff.phone,
        role: newStaff.role,
        pin: newStaff.pin || '1234',
        baseSalary: newStaff.baseSalary,
        salaryType: newStaff.salaryType,
        createdAt: new Date()
      };

      await db.staff.add(staff);
      setStaffList([...staffList, staff]);
      setShowAddModal(false);
      setNewStaff({
        name: '',
        phone: '',
        role: 'staff',
        pin: '',
        baseSalary: 0,
        salaryType: 'monthly'
      });
      toast.success('Staff member added!');
    } catch (error) {
      toast.error('Error adding staff');
    }
  };

  const markAttendance = async (staffId: string, status: 'present' | 'absent' | 'half-day') => {
    try {
      const database = await (await import('@/lib/database')).getDB();
      const existingToday = attendance.find(a => a.staffId === staffId);

      if (existingToday) {
        // Update existing
        const updated: Attendance = {
          ...existingToday,
          status,
          checkIn: status === 'present' || status === 'half-day' ? new Date() : undefined
        };
        await database.put('attendance', updated);
        setAttendance(prev => prev.map(a => a.id === existingToday.id ? updated : a));
      } else {
        // Create new
        const newAtt: Attendance = {
          id: uuidv4(),
          staffId,
          date: new Date(),
          status,
          checkIn: status === 'present' || status === 'half-day' ? new Date() : undefined
        };
        await database.add('attendance', newAtt);
        setAttendance([...attendance, newAtt]);
      }
      toast.success('Attendance marked!');
    } catch (error) {
      toast.error('Error marking attendance');
    }
  };

  const getStaffAttendance = (staffId: string) => {
    return attendance.find(a => a.staffId === staffId);
  };

  const calculateSalary = (staff: Staff) => {
    // Simplified calculation - would need full month data in production
    const daysWorked = 22; // Placeholder
    if (staff.salaryType === 'daily') {
      return staff.baseSalary * daysWorked;
    }
    return staff.baseSalary;
  };

  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery)
  );

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;

  return (
    <AppLayout title="Staff">
      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-3 rounded-xl bg-primary text-primary-foreground"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-card text-center">
            <p className="text-2xl font-bold text-foreground">{staffList.length}</p>
            <p className="text-xs text-muted-foreground">Total Staff</p>
          </div>
          <div className="p-3 rounded-xl bg-card text-center">
            <p className="text-2xl font-bold text-success">{presentCount}</p>
            <p className="text-xs text-muted-foreground">Present Today</p>
          </div>
          <div className="p-3 rounded-xl bg-card text-center">
            <p className="text-2xl font-bold text-destructive">{absentCount}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </div>
        </div>

        {/* Today's Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-IN', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>

        {/* Staff List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No staff members</h3>
              <p className="text-sm text-muted-foreground mb-4">Add your first staff member</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Staff
              </button>
            </div>
          ) : (
            filteredStaff.map((staff) => {
              const att = getStaffAttendance(staff.id);
              return (
                <div
                  key={staff.id}
                  className="p-4 bg-card rounded-xl border border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {staff.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{staff.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {staff.phone}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {staff.role} • {formatCurrency(staff.baseSalary)}/{staff.salaryType === 'daily' ? 'day' : 'month'}
                        </p>
                      </div>
                    </div>
                    {att && (
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        att.status === 'present' && 'bg-success/10 text-success',
                        att.status === 'absent' && 'bg-destructive/10 text-destructive',
                        att.status === 'half-day' && 'bg-warning/10 text-warning'
                      )}>
                        {att.status === 'half-day' ? 'Half Day' : att.status}
                      </span>
                    )}
                  </div>

                  {/* Attendance Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAttendance(staff.id, 'present')}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1',
                        att?.status === 'present' 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-success/10 text-success hover:bg-success/20'
                      )}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Present
                    </button>
                    <button
                      onClick={() => markAttendance(staff.id, 'half-day')}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1',
                        att?.status === 'half-day' 
                          ? 'bg-warning text-warning-foreground' 
                          : 'bg-warning/10 text-warning hover:bg-warning/20'
                      )}
                    >
                      <Clock className="w-4 h-4" />
                      Half Day
                    </button>
                    <button
                      onClick={() => markAttendance(staff.id, 'absent')}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1',
                        att?.status === 'absent' 
                          ? 'bg-destructive text-destructive-foreground' 
                          : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                      )}
                    >
                      <XCircle className="w-4 h-4" />
                      Absent
                    </button>
                  </div>

                  {/* Salary Info */}
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Est. Monthly Salary</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" />
                      {formatCurrency(calculateSalary(staff))}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold text-foreground">Add Staff Member</h2>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name *"
                value={newStaff.name}
                onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={newStaff.phone}
                onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                className="input-field"
              />
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value as 'staff' | 'manager' }))}
                className="input-field"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
              <input
                type="password"
                placeholder="PIN (4 digits)"
                maxLength={4}
                value={newStaff.pin}
                onChange={(e) => setNewStaff(prev => ({ ...prev, pin: e.target.value }))}
                className="input-field"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Base Salary"
                  value={newStaff.baseSalary || ''}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, baseSalary: Number(e.target.value) }))}
                  className="input-field flex-1"
                />
                <select
                  value={newStaff.salaryType}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, salaryType: e.target.value as 'monthly' | 'daily' }))}
                  className="input-field w-32"
                >
                  <option value="monthly">Monthly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                className="flex-1 py-3 rounded-xl btn-gold font-medium"
              >
                Add Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
