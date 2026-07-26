import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Percent, Save } from 'lucide-react';
import Card from '@/components/ui/Card';
import TextInput from '@/components/ui/TextInput';
import { getCommissionSettings, updateCommissionSettings } from '../api/adminApi';

const CommissionSettingsPage = () => {
  const [commissionPercent, setCommissionPercent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await getCommissionSettings();
      setCommissionPercent(String(data.data.commissionPercent));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load commission settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await updateCommissionSettings(Number(commissionPercent));
      setCommissionPercent(String(data.data.commissionPercent));
      toast.success('Commission percent updated — applies to new bookings going forward');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update commission');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Card
        title={
          <span className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-primary" /> Platform Commission
          </span>
        }
      >
        <p className="text-sm text-slate-500 mb-4">
          This percentage is added on top of the agreed fee when a college books a presenter. The
          college pays <span className="font-medium text-slate-700">agreed fee + commission</span>,
          and the presenter always receives the{' '}
          <span className="font-medium text-slate-700">full agreed fee</span>. Changing this only
          affects bookings created after saving — existing bookings keep the commission rate that
          was active when they were created.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Commission Percent (%)"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Commission Rate'}
          </button>
        </form>
      </Card>
    </div>
  );
};

export default CommissionSettingsPage;
