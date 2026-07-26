import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Users2,
  Building2,
  FileText,
  ClipboardList,
  CalendarCheck2,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { getDashboardStats } from '../api/adminApi';

const StatBox = ({ icon: Icon, label, value, tint }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-sm text-slate-500 truncate">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-0.5">{value}</p>
    </div>
  </div>
);

const PIE_COLORS = ['#2563EB', '#16A34A', '#7C3AED'];

const AdminDashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getDashboardStats();
        setStats(data.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load dashboard stats');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!stats) return null;

  const userComposition = [
    { name: 'Presenters', value: stats.totalPresenters },
    { name: 'Colleges', value: stats.totalColleges },
  ];

  const revenueBreakdown = [
    {
      name: 'Revenue',
      collected: stats.revenue.totalCollected,
      commission: stats.revenue.totalCommission,
      payouts: stats.revenue.totalPayouts,
    },
  ];

  const funnel = [
    { name: 'Requirements', value: stats.activeRequirements },
    { name: 'Applications', value: stats.totalApplications },
    { name: 'Bookings', value: stats.totalBookings },
    { name: 'Completed', value: stats.completedBookings },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBox
          icon={Users2}
          label="Presenters"
          value={stats.totalPresenters}
          tint="bg-primary/10 text-primary"
        />
        <StatBox
          icon={Building2}
          label="Colleges"
          value={stats.totalColleges}
          tint="bg-secondary/10 text-secondary"
        />
        <StatBox
          icon={FileText}
          label="Active Requirements"
          value={stats.activeRequirements}
          tint="bg-success/10 text-success"
        />
        <StatBox
          icon={ClipboardList}
          label="Applications"
          value={stats.totalApplications}
          tint="bg-warning/10 text-warning"
        />
        <StatBox
          icon={CalendarCheck2}
          label="Bookings"
          value={stats.totalBookings}
          tint="bg-primary/10 text-primary"
        />
        <StatBox
          icon={CheckCircle2}
          label="Completed Bookings"
          value={stats.completedBookings}
          tint="bg-success/10 text-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="User Composition">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userComposition}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {userComposition.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Pipeline Funnel">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563EB" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Revenue Breakdown">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
              <Bar
                dataKey="collected"
                name="Total Collected"
                fill="#2563EB"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
              <Bar
                dataKey="commission"
                name="Platform Commission"
                fill="#7C3AED"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
              <Bar
                dataKey="payouts"
                name="Presenter Payouts"
                fill="#16A34A"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
            <Wallet className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Total Collected</p>
              <p className="text-lg font-semibold text-slate-900">
                ₹{stats.revenue.totalCollected}
              </p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
            <Wallet className="w-5 h-5 text-secondary shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Platform Commission</p>
              <p className="text-lg font-semibold text-secondary">
                ₹{stats.revenue.totalCommission}
              </p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
            <Wallet className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Presenter Payouts</p>
              <p className="text-lg font-semibold text-success">₹{stats.revenue.totalPayouts}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboardHome;
