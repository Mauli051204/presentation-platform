import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  PlayCircle,
  Lock,
  MapPin,
  CalendarDays,
  IndianRupee,
  Users2,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import TextInput from '@/components/ui/TextInput';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import {
  getMyRequirements,
  createRequirement,
  updateRequirement,
  updateRequirementStatus,
  deleteRequirement,
} from '../api/requirementApi';
import { formatBudget } from '@/utils/formatBudget';

const emptyForm = {
  title: '',
  description: '',
  department: '',
  presentationType: 'online',
  requiredSkills: '',
  requiredLanguages: '',
  budget: '',
  numberOfPresentersNeeded: 1,
  eventDate: '',
  durationMinutes: 60,
  applicationDeadline: '',
  location: { city: '', state: '', venue: '' },
};

const statusVariant = {
  draft: 'neutral',
  active: 'success',
  closed: 'warning',
  cancelled: 'danger',
};

const RequirementsPage = () => {
  const [requirements, setRequirements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await getMyRequirements();
      setRequirements(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load requirements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRequirements = requirements.filter((r) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (req) => {
    setEditingId(req._id);
    setForm({
      title: req.title,
      description: req.description,
      department: req.department || '',
      presentationType: req.presentationType,
      requiredSkills: (req.requiredSkills || []).join(', '),
      requiredLanguages: (req.requiredLanguages || []).join(', '),
      budget: req.budgetMin,
      numberOfPresentersNeeded: req.numberOfPresentersNeeded,
      eventDate: req.eventDate ? req.eventDate.slice(0, 10) : '',
      durationMinutes: req.durationMinutes,
      applicationDeadline: req.applicationDeadline ? req.applicationDeadline.slice(0, 10) : '',
      location: req.location || { city: '', state: '', venue: '' },
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const budgetValue = Number(form.budget);
      const payload = {
        title: form.title,
        description: form.description,
        department: form.department,
        presentationType: form.presentationType,
        requiredSkills: form.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        requiredLanguages: form.requiredLanguages
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
        budgetMin: budgetValue,
        budgetMax: budgetValue,
        numberOfPresentersNeeded: Number(form.numberOfPresentersNeeded),
        eventDate: form.eventDate,
        durationMinutes: Number(form.durationMinutes),
        applicationDeadline: form.applicationDeadline,
        location: form.location,
      };

      if (editingId) {
        await updateRequirement(editingId, payload);
        toast.success('Requirement updated');
      } else {
        await createRequirement(payload);
        toast.success('Requirement created as draft');
      }
      setModalOpen(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save requirement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateRequirementStatus(id, status);
      toast.success(`Marked as ${status}`);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this requirement? This cannot be undone.')) return;
    try {
      await deleteRequirement(id);
      toast.success('Requirement deleted');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete requirement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your requirements..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Post New Requirement
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredRequirements.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-slate-500 text-sm">
            {requirements.length === 0
              ? 'No requirements posted yet.'
              : 'No requirements match your search.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequirements.map((req) => (
            <Card key={req._id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{req.title}</h3>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{req.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant={statusVariant[req.status]}>{req.status}</Badge>
                    <Badge variant="neutral">{req.presentationType}</Badge>
                    <Badge variant="primary">
                      <Users2 className="w-3 h-3" /> {req.applicationsCount || 0} application(s)
                    </Badge>
                    <Badge variant="neutral">
                      <CalendarDays className="w-3 h-3" />{' '}
                      {new Date(req.eventDate).toLocaleDateString()}
                    </Badge>
                    {req.location?.city && (
                      <Badge variant="neutral">
                        <MapPin className="w-3 h-3" /> {req.location.city}
                      </Badge>
                    )}
                    <Badge variant="success">
                      <IndianRupee className="w-3 h-3" />{' '}
                      {formatBudget(req.budgetMin, req.budgetMax)}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col flex-wrap gap-3 sm:gap-2 sm:items-end shrink-0">
                  <Link
                    to={`/college/requirements/${req._id}/applications`}
                    className="flex items-center gap-1.5 text-sm text-primary font-medium whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" /> Applications
                  </Link>
                  <button
                    onClick={() => openEditModal(req)}
                    className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  {req.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange(req._id, 'active')}
                      className="flex items-center gap-1.5 text-sm text-success font-medium whitespace-nowrap"
                    >
                      <PlayCircle className="w-4 h-4" /> Publish
                    </button>
                  )}
                  {req.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(req._id, 'closed')}
                      className="flex items-center gap-1.5 text-sm text-warning font-medium whitespace-nowrap"
                    >
                      <Lock className="w-4 h-4" /> Close
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(req._id)}
                    className="flex items-center gap-1.5 text-sm text-danger whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Requirement' : 'Post New Requirement'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <TextInput
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <TextArea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
          />
          <TextInput
            label="Department"
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
          />
          <Select
            label="Presentation Type"
            value={form.presentationType}
            onChange={(e) => setForm((f) => ({ ...f, presentationType: e.target.value }))}
          >
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </Select>
          <TextInput
            label="Required Skills (comma-separated)"
            value={form.requiredSkills}
            onChange={(e) => setForm((f) => ({ ...f, requiredSkills: e.target.value }))}
          />
          <TextInput
            label="Required Languages (comma-separated)"
            value={form.requiredLanguages}
            onChange={(e) => setForm((f) => ({ ...f, requiredLanguages: e.target.value }))}
          />
          <TextInput
            label="Budget (₹)"
            type="number"
            value={form.budget}
            onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Presenters Needed"
              type="number"
              min={1}
              value={form.numberOfPresentersNeeded}
              onChange={(e) => setForm((f) => ({ ...f, numberOfPresentersNeeded: e.target.value }))}
            />
            <TextInput
              label="Duration (minutes)"
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Event Date"
              type="date"
              value={form.eventDate}
              onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
              required
            />
            <TextInput
              label="Application Deadline"
              type="date"
              value={form.applicationDeadline}
              onChange={(e) => setForm((f) => ({ ...f, applicationDeadline: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <TextInput
              label="City"
              value={form.location.city}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: { ...f.location, city: e.target.value } }))
              }
            />
            <TextInput
              label="State"
              value={form.location.state}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: { ...f.location, state: e.target.value } }))
              }
            />
            <TextInput
              label="Venue"
              placeholder="Online / Auditorium name"
              value={form.location.venue}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: { ...f.location, venue: e.target.value } }))
              }
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="text-sm text-slate-500 px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create as Draft'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RequirementsPage;
