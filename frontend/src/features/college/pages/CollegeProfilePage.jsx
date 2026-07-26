import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Circle, Building2, Users2, ImageIcon, Globe, Phone } from 'lucide-react';
import Card from '@/components/ui/Card';
import TextInput from '@/components/ui/TextInput';
import TextArea from '@/components/ui/TextArea';
import {
  getMyCollegeProfile,
  saveMyCollegeProfile,
  updateDepartments,
  uploadLogo,
  uploadGalleryImage,
  removeGalleryImage,
} from '../api/collegeApi';

const emptyProfile = {
  collegeName: '',
  description: '',
  website: '',
  contactPerson: { name: '', designation: '', phone: '' },
  address: { city: '', state: '', pincode: '' },
  departments: [],
};

const OptionalTag = () => (
  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
    Optional
  </span>
);

const RequiredTag = () => (
  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
    Required
  </span>
);

const ChecklistRow = ({ done, label }) => (
  <div className="flex items-center gap-2 text-sm">
    {done ? (
      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
    ) : (
      <Circle className="w-4 h-4 text-slate-300 shrink-0" />
    )}
    <span className={done ? 'text-slate-600' : 'text-slate-500'}>{label}</span>
  </div>
);

const SectionHeading = ({ icon: Icon, title, tag }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-primary" />
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    {tag}
  </div>
);

const CollegeProfilePage = () => {
  const [profile, setProfile] = useState(emptyProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const { data } = await getMyCollegeProfile();
      const p = data.data;
      setProfile({
        ...emptyProfile,
        ...p,
        contactPerson: p.contactPerson || emptyProfile.contactPerson,
        address: p.address || emptyProfile.address,
        departments: p.departments || [],
      });
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const checklist = [
    { key: 'collegeName', label: 'College name', done: Boolean(profile.collegeName) },
    { key: 'description', label: 'Description', done: Boolean(profile.description) },
    { key: 'city', label: 'City', done: Boolean(profile.address.city) },
    {
      key: 'contactPerson',
      label: 'Contact person name',
      done: Boolean(profile.contactPerson.name),
    },
    { key: 'logo', label: 'Logo uploaded', done: Boolean(profile.logo?.url) },
  ];
  const completedCount = checklist.filter((c) => c.done).length;
  const completionPercent = Math.round((completedCount / checklist.length) * 100);

  const handleSaveBasics = async (e) => {
    e.preventDefault();
    if (!profile.collegeName.trim()) {
      toast.error('College name is required');
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await saveMyCollegeProfile({
        collegeName: profile.collegeName,
        description: profile.description,
        website: profile.website,
        contactPerson: profile.contactPerson,
        address: profile.address,
      });
      setProfile((prev) => ({ ...prev, ...data.data }));
      toast.success('Profile saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const addDepartment = () => {
    setProfile((prev) => ({
      ...prev,
      departments: [...prev.departments, { name: '', headOfDepartment: '', contactEmail: '' }],
    }));
  };

  const updateDepartmentField = (index, field, value) => {
    setProfile((prev) => {
      const updated = [...prev.departments];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, departments: updated };
    });
  };

  const removeDepartmentField = (index) => {
    setProfile((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index),
    }));
  };

  const handleSaveDepartments = async () => {
    setIsSaving(true);
    try {
      const { data } = await updateDepartments(profile.departments);
      setProfile((prev) => ({ ...prev, departments: data.data }));
      toast.success('Departments saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save departments');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadLogo(file);
      toast.success('Logo uploaded');
      await loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const caption = document.getElementById('gallery-caption').value;
    try {
      await uploadGalleryImage(file, caption);
      toast.success('Gallery image uploaded');
      document.getElementById('gallery-caption').value = '';
      await loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveGalleryImage = async (assetId) => {
    try {
      await removeGalleryImage(assetId);
      toast.success('Image removed');
      await loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove image');
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
    <div className="space-y-6 max-w-3xl">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-900">Profile completeness</h3>
          <span
            className={`text-sm font-medium ${completionPercent === 100 ? 'text-success' : 'text-primary'}`}
          >
            {completionPercent}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              completionPercent === 100 ? 'bg-success' : 'bg-primary'
            }`}
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checklist.map((item) => (
            <ChecklistRow key={item.key} done={item.done} label={item.label} />
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeading icon={Building2} title="Basic Information" tag={<RequiredTag />} />
        <form onSubmit={handleSaveBasics} className="space-y-4 mt-4">
          <TextInput
            label="College Name"
            value={profile.collegeName}
            onChange={(e) => setProfile((p) => ({ ...p, collegeName: e.target.value }))}
          />
          <TextArea
            label="Description"
            rows={4}
            maxLength={2000}
            value={profile.description}
            onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
          />
          <TextInput
            label="Website"
            placeholder="https://yourcollege.edu"
            value={profile.website}
            onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextInput
              label="Contact Person Name"
              value={profile.contactPerson.name}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  contactPerson: { ...p.contactPerson, name: e.target.value },
                }))
              }
            />
            <TextInput
              label="Designation"
              value={profile.contactPerson.designation}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  contactPerson: { ...p.contactPerson, designation: e.target.value },
                }))
              }
            />
            <TextInput
              label="Phone"
              value={profile.contactPerson.phone}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  contactPerson: { ...p.contactPerson, phone: e.target.value },
                }))
              }
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextInput
              label="City"
              value={profile.address.city}
              onChange={(e) =>
                setProfile((p) => ({ ...p, address: { ...p.address, city: e.target.value } }))
              }
            />
            <TextInput
              label="State"
              value={profile.address.state}
              onChange={(e) =>
                setProfile((p) => ({ ...p, address: { ...p.address, state: e.target.value } }))
              }
            />
            <TextInput
              label="Pincode"
              value={profile.address.pincode}
              onChange={(e) =>
                setProfile((p) => ({ ...p, address: { ...p.address, pincode: e.target.value } }))
              }
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSaving ? 'Saving...' : 'Save Basic Info'}
          </button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <SectionHeading icon={Users2} title="Departments" tag={<OptionalTag />} />
          <button onClick={addDepartment} className="text-sm text-primary font-medium">
            + Add
          </button>
        </div>
        <div className="space-y-4 mt-4">
          {profile.departments.map((dept, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border-b border-slate-100 pb-4"
            >
              <TextInput
                label="Department Name"
                value={dept.name}
                onChange={(e) => updateDepartmentField(i, 'name', e.target.value)}
              />
              <TextInput
                label="Head of Department"
                value={dept.headOfDepartment}
                onChange={(e) => updateDepartmentField(i, 'headOfDepartment', e.target.value)}
              />
              <TextInput
                label="Contact Email"
                value={dept.contactEmail}
                onChange={(e) => updateDepartmentField(i, 'contactEmail', e.target.value)}
              />
              <button onClick={() => removeDepartmentField(i)} className="text-danger text-sm h-10">
                Remove
              </button>
            </div>
          ))}
          {profile.departments.length === 0 && (
            <p className="text-sm text-slate-500">No departments added yet.</p>
          )}
          {profile.departments.length > 0 && (
            <button
              onClick={handleSaveDepartments}
              disabled={isSaving}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSaving ? 'Saving...' : 'Save Departments'}
            </button>
          )}
        </div>
      </Card>

      <Card>
        <SectionHeading icon={ImageIcon} title="Logo & Gallery" tag={<OptionalTag />} />
        <div className="space-y-5 mt-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Logo {profile.logo?.url && <span className="text-success">(uploaded)</span>}
            </p>
            <div className="flex items-center gap-4">
              {profile.logo?.url && (
                <img
                  src={profile.logo.url}
                  alt="College logo"
                  className="w-20 h-20 rounded-lg object-cover border border-slate-200"
                />
              )}
              <label className="text-sm text-primary font-medium cursor-pointer">
                {profile.logo?.url ? 'Change logo' : 'Upload logo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Gallery</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {(profile.gallery || []).map((img) => (
                <div key={img._id} className="relative group">
                  <img
                    src={img.url}
                    alt={img.caption}
                    className="w-full h-24 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    onClick={() => handleRemoveGalleryImage(img._id)}
                    className="absolute top-1.5 right-1.5 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                  {img.caption && (
                    <p className="text-xs text-slate-500 mt-1 truncate">{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                id="gallery-caption"
                placeholder="Caption (optional)"
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-56"
              />
              <label className="text-sm text-primary font-medium cursor-pointer">
                Choose file
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleGalleryUpload}
                />
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CollegeProfilePage;
