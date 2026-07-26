import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserCheck, UserX, Users2, Mail, CalendarDays } from 'lucide-react';
import Card from '@/components/ui/Card';
import FilterTabs from '@/components/ui/FilterTabs';
import Select from '@/components/ui/Select';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { listUsers, toggleUserActive } from '../api/adminApi';

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'presenter', label: 'Presenter' },
  { value: 'college', label: 'College' },
  { value: 'admin', label: 'Admin' },
];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 20 };
      if (roleFilter) params.role = roleFilter;
      if (activeFilter) params.isActive = activeFilter;

      const { data } = await listUsers(params);
      setUsers(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, activeFilter]);

  const handleToggle = async (id) => {
    setBusyId(id);
    try {
      await toggleUserActive(id);
      toast.success('User status updated');
      await load(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setBusyId(null);
    }
  };

  const ToggleButton = ({ u }) =>
    u.role !== 'admin' ? (
      <button
        onClick={() => handleToggle(u.id)}
        disabled={busyId === u.id}
        className={`flex items-center gap-1.5 text-xs font-medium disabled:opacity-50 whitespace-nowrap ${
          u.isActive ? 'text-danger' : 'text-success'
        }`}
      >
        {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
        {u.isActive ? 'Deactivate' : 'Activate'}
      </button>
    ) : null;

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-4">
          <FilterTabs options={roleOptions} value={roleFilter} onChange={setRoleFilter} />
          <div className="max-w-xs">
            <Select
              label="Status"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </Card>
      ) : users.length === 0 ? (
        <Card className="text-center py-10">
          <Users2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No users found.</p>
        </Card>
      ) : (
        <>
          {/* Card layout — mobile & tablet */}
          <div className="space-y-3 lg:hidden">
            {users.map((u) => (
              <Card key={u.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" /> {u.email}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      Joined {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant="primary">{u.role}</Badge>
                    <Badge variant={u.isActive ? 'success' : 'danger'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                  <ToggleButton u={u} />
                </div>
              </Card>
            ))}
          </div>

          {/* Table layout — laptop and up */}
          <Card className="hidden lg:block">
            <Table columns={['Name', 'Email', 'Role', 'Status', 'Joined', 'Action']}>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 px-3 font-medium text-slate-900">{u.name}</td>
                  <td className="py-3 px-3 text-slate-600">{u.email}</td>
                  <td className="py-3 px-3">
                    <Badge variant="primary">{u.role}</Badge>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={u.isActive ? 'success' : 'danger'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    <ToggleButton u={u} />
                  </td>
                </tr>
              ))}
            </Table>
          </Card>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => load(p)}
          />
        </>
      )}
    </div>
  );
};

export default UsersPage;
