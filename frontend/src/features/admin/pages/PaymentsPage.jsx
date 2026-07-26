import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Card from '@/components/ui/Card';
import FilterTabs from '@/components/ui/FilterTabs';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { listAllPayments, getRevenueReport } from '../api/adminApi';

const statusVariant = {
  created: 'neutral',
  paid: 'success',
  failed: 'danger',
  refunded: 'warning',
};

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'created', label: 'Created' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [revenueReport, setRevenueReport] = useState([]);

  const load = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await listAllPayments(params);
      setPayments(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRevenue = async () => {
    try {
      const { data } = await getRevenueReport();
      setRevenueReport(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load revenue report');
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    loadRevenue();
  }, []);

  const monthName = (m) =>
    ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m];

  const chartData = revenueReport.map((r) => ({
    label: `${monthName(r._id.month)} ${r._id.year}`,
    collected: r.totalCollected,
  }));

  return (
    <div className="space-y-6">
      <Card
        title={
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Monthly Revenue
          </span>
        }
      >
        {chartData.length === 0 ? (
          <p className="text-slate-500 text-sm">No paid transactions yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Bar dataKey="collected" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4">
          <FilterTabs options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-10">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No payments found.</p>
          </div>
        ) : (
          <>
            <Table
              columns={[
                'Requirement',
                'Presenter',
                'College',
                'Amount',
                'Commission',
                'Status',
                'Date',
              ]}
            >
              {payments.map((p) => (
                <tr key={p._id}>
                  <td className="py-3 px-3 font-medium text-slate-900">
                    {p.booking?.requirement?.title}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{p.booking?.presenter?.headline}</td>
                  <td className="py-3 px-3 text-slate-600">{p.booking?.college?.collegeName}</td>
                  <td className="py-3 px-3 text-slate-900">₹{p.amount}</td>
                  <td className="py-3 px-3 text-primary">₹{p.commissionAmount}</td>
                  <td className="py-3 px-3">
                    <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => load(p)}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default PaymentsPage;
