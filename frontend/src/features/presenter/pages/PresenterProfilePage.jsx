import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Circle,
  User,
  GraduationCap,
  Briefcase,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Presentation,
  CalendarDays,
  Eye, Download,
} from "lucide-react";
import { downloadFile } from '@/utils/downloadFile';
import { viewFile } from '@/utils/viewFile';
import Card from "@/components/ui/Card";
import TextInput from "@/components/ui/TextInput";
import TextArea from "@/components/ui/TextArea";
import {
  getMyPresenterProfile,
  saveMyPresenterProfile,
  updateAvailability,
  uploadProfileImage,
  uploadResume,
  uploadCertificate,
  uploadVideo,
  uploadSlide,
  deleteCertificate,
  deleteVideo,
  deleteSlide,
} from "../api/presenterApi";

const emptyProfile = {
  headline: "",
  bio: "",
  skills: [],
  languages: [],
  location: { city: "", state: "" },
  education: [],
  experience: [],
};

const OptionalTag = () => (
  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
    Optional
  </span>
);

const RequiredTag = () => (
  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
    Required to apply
  </span>
);

const ChecklistRow = ({ done, label }) => (
  <div className="flex items-center gap-2 text-sm">
    {done ? (
      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
    ) : (
      <Circle className="w-4 h-4 text-slate-300 shrink-0" />
    )}
    <span className={done ? "text-slate-600" : "text-slate-500"}>{label}</span>
  </div>
);

const SectionHeading = ({ icon: Icon, title, tag }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-primary" />
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    {tag}
  </div>
);

const PresenterProfilePage = () => {
  const [profile, setProfile] = useState(emptyProfile);
  const [skillsInput, setSkillsInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availabilityInput, setAvailabilityInput] = useState("");

  const loadProfile = async () => {
    try {
      const { data } = await getMyPresenterProfile();
      const p = data.data;
      setProfile({
        ...emptyProfile,
        ...p,
        location: p.location || { city: "", state: "" },
      });
      setSkillsInput((p.skills || []).join(", "));
      setLanguagesInput((p.languages || []).join(", "));
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error("Failed to load profile");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

const checklist = [
  { key: 'headline', label: 'Headline', done: Boolean(profile.headline) },
  { key: 'bio', label: 'Bio', done: Boolean(profile.bio) },
  { key: 'skills', label: 'At least one skill', done: (profile.skills || []).length > 0 },
  {
    key: 'education',
    label: 'At least one education entry',
    done: (profile.education || []).length > 0,
  },
];
  const completedCount = checklist.filter((c) => c.done).length;
  const completionPercent = Math.round((completedCount / checklist.length) * 100);

  const handleSaveBasics = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        headline: profile.headline,
        bio: profile.bio,
        skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
        languages: languagesInput.split(",").map((l) => l.trim()).filter(Boolean),
        location: profile.location,
      };
      const { data } = await saveMyPresenterProfile(payload);
      setProfile((prev) => ({ ...prev, ...data.data }));
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const addEducation = () => {
    setProfile((prev) => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", yearOfCompletion: "" }],
    }));
  };

  const updateEducation = (index, field, value) => {
    setProfile((prev) => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const removeEducation = (index) => {
    setProfile((prev) => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  };

  const addExperience = () => {
    setProfile((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { title: "", organization: "", description: "", startDate: "", isCurrent: false },
      ],
    }));
  };

  const updateExperience = (index, field, value) => {
    setProfile((prev) => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const removeExperience = (index) => {
    setProfile((prev) => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
  };

  const saveEducationAndExperience = async () => {
    setIsSaving(true);
    try {
      const { data } = await saveMyPresenterProfile({
        education: profile.education.map((e) => ({ ...e, yearOfCompletion: Number(e.yearOfCompletion) })),
        experience: profile.experience,
      });
      setProfile((prev) => ({ ...prev, ...data.data }));
      toast.success("Education & experience saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (uploaderFn, successMsg, extra) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploaderFn(file, extra);
      toast.success(successMsg);
      await loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      e.target.value = "";
    }
  };

  const handleSaveAvailability = async () => {
    const dates = availabilityInput
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    if (dates.length === 0) {
      toast.error("Enter at least one date (YYYY-MM-DD, comma-separated)");
      return;
    }
    try {
      await updateAvailability(dates);
      toast.success("Availability updated");
      setAvailabilityInput("");
      await loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update availability");
    }
  };

  const handleDeleteAsset = (deleteFn) => async (assetId) => {
    try {
      await deleteFn(assetId);
      toast.success("Removed");
      await loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove");
    }
  };

  if (isLoading) return <p className="text-slate-500">Loading profile...</p>;

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
        {completionPercent < 100 && (
          <p className="text-xs text-slate-500 mt-3">
            Complete every item above to unlock applying to opportunities. Certificates, videos, and
            slides below are optional — they help you stand out but aren't required.
          </p>
        )}
      </Card>

      <Card>
        <SectionHeading icon={User} title="Basic Information" tag={<RequiredTag />} />
        <form onSubmit={handleSaveBasics} className="space-y-4 mt-4">
          <TextInput
            label="Headline"
            placeholder="e.g. Motivational Speaker & AI Educator"
            value={profile.headline}
            maxLength={150}
            onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))}
          />
          <TextArea
            label="Bio"
            rows={4}
            maxLength={2000}
            value={profile.bio}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
          />
          <TextInput
            label="Skills (comma-separated)"
            placeholder="Public Speaking, AI, Career Guidance"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
          />
          <TextInput
            label="Languages (comma-separated)"
            placeholder="English, Tamil, Hindi"
            value={languagesInput}
            onChange={(e) => setLanguagesInput(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="City"
              value={profile.location.city}
              onChange={(e) =>
                setProfile((p) => ({ ...p, location: { ...p.location, city: e.target.value } }))
              }
            />
            <TextInput
              label="State"
              value={profile.location.state}
              onChange={(e) =>
                setProfile((p) => ({ ...p, location: { ...p.location, state: e.target.value } }))
              }
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Basic Info'}
          </button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <SectionHeading icon={GraduationCap} title="Education" tag={<RequiredTag />} />
          <button onClick={addEducation} className="text-sm text-primary font-medium">
            + Add
          </button>
        </div>
        <div className="space-y-4 mt-4">
          {profile.education.map((edu, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border-b border-slate-100 pb-4"
            >
              <TextInput
                label="Degree"
                value={edu.degree}
                onChange={(e) => updateEducation(i, 'degree', e.target.value)}
              />
              <TextInput
                label="Institution"
                value={edu.institution}
                onChange={(e) => updateEducation(i, 'institution', e.target.value)}
              />
              <TextInput
                label="Year"
                type="number"
                value={edu.yearOfCompletion}
                onChange={(e) => updateEducation(i, 'yearOfCompletion', e.target.value)}
              />
              <button onClick={() => removeEducation(i)} className="text-danger text-sm h-10">
                Remove
              </button>
            </div>
          ))}
          {profile.education.length === 0 && (
            <p className="text-sm text-slate-500">
              No education entries yet — add at least one to apply.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <SectionHeading icon={Briefcase} title="Experience" tag={<OptionalTag />} />
          <button onClick={addExperience} className="text-sm text-primary font-medium">
            + Add
          </button>
        </div>
        <div className="space-y-4 mt-4">
          {profile.experience.map((exp, i) => (
            <div key={i} className="space-y-3 border-b border-slate-100 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextInput
                  label="Title"
                  value={exp.title}
                  onChange={(e) => updateExperience(i, 'title', e.target.value)}
                />
                <TextInput
                  label="Organization"
                  value={exp.organization}
                  onChange={(e) => updateExperience(i, 'organization', e.target.value)}
                />
              </div>
              <TextArea
                label="Description"
                rows={2}
                value={exp.description}
                onChange={(e) => updateExperience(i, 'description', e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <TextInput
                  label="Start Date"
                  type="date"
                  value={exp.startDate ? exp.startDate.slice(0, 10) : ''}
                  onChange={(e) => updateExperience(i, 'startDate', e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm text-slate-700 mt-6">
                  <input
                    type="checkbox"
                    checked={exp.isCurrent}
                    onChange={(e) => updateExperience(i, 'isCurrent', e.target.checked)}
                  />
                  Currently working here
                </label>
              </div>
              <button onClick={() => removeExperience(i)} className="text-danger text-sm">
                Remove this entry
              </button>
            </div>
          ))}
          {profile.experience.length === 0 && (
            <p className="text-sm text-slate-500">No experience entries yet.</p>
          )}
          {(profile.education.length > 0 || profile.experience.length > 0) && (
            <button
              onClick={saveEducationAndExperience}
              disabled={isSaving}
              className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Education & Experience'}
            </button>
          )}
        </div>
      </Card>

      <Card>
        <SectionHeading icon={FileText} title="Resume" tag={<OptionalTag />} />
        <div className="mt-4">
          {profile.resume?.url && (
            <div className="flex items-center gap-4 mb-3">
              {/* <button
                onClick={() => viewFile(profile.resume.url)}
                className="text-sm text-primary font-medium flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" /> View Resume
              </button> */}
              <button
                onClick={() =>
                  downloadFile(profile.resume.url, `${profile.headline || 'resume'}.pdf`)
                }
                className="text-sm text-primary font-medium flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download Resume
              </button>
            </div>
          )}
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg py-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <FileText className="w-6 h-6 text-slate-400 mb-2" />
            <span className="text-sm text-slate-500">
              {profile.resume?.url
                ? 'Click to replace resume'
                : 'Click to upload resume (optional, PDF or Word)'}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload(uploadResume, 'Resume uploaded')}
            />
          </label>
        </div>
      </Card>

      <Card>
        <SectionHeading icon={ImageIcon} title="Profile Image" tag={<OptionalTag />} />
        <div className="mt-4 flex items-center gap-4">
          {profile.profileImage?.url && (
            <img
              src={profile.profileImage.url}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border border-slate-200"
            />
          )}
          <label className="text-sm text-primary font-medium cursor-pointer">
            {profile.profileImage?.url ? 'Change photo' : 'Upload photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload(uploadProfileImage, 'Image uploaded')}
            />
          </label>
        </div>
      </Card>

      <Card>
        <SectionHeading icon={ImageIcon} title="Certificates" tag={<OptionalTag />} />
        <p className="text-xs text-slate-500 mt-1 mb-3">
          Add certifications to boost credibility with colleges — not required to apply.
        </p>
        <ul className="space-y-1 mb-3">
          {(profile.certificates || []).map((c) => (
            <li
              key={c._id}
              className="text-sm flex items-center justify-between bg-slate-50 rounded-md px-3 py-2"
            >
              <a href={c.url} target="_blank" rel="noreferrer" className="text-primary">
                {c.title}
              </a>
              <button
                onClick={() => handleDeleteAsset(deleteCertificate)(c._id)}
                className="text-danger text-xs"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Certificate title"
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-56"
            id="cert-title"
          />
          <label className="text-sm text-primary font-medium cursor-pointer">
            Choose file
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const title = document.getElementById('cert-title').value || 'Certificate';
                handleFileUpload(uploadCertificate, 'Certificate uploaded', title)(e);
              }}
            />
          </label>
        </div>
      </Card>

      <Card>
        <SectionHeading icon={VideoIcon} title="Sample Videos" tag={<OptionalTag />} />
        <p className="text-xs text-slate-500 mt-1 mb-3">
          Show colleges a clip of you presenting — not required to apply, but strongly recommended.
        </p>
        <ul className="space-y-1 mb-3">
          {(profile.videos || []).map((v) => (
            <li
              key={v._id}
              className="text-sm flex items-center justify-between bg-slate-50 rounded-md px-3 py-2"
            >
              <a href={v.url} target="_blank" rel="noreferrer" className="text-primary">
                {v.title}
              </a>
              <button
                onClick={() => handleDeleteAsset(deleteVideo)(v._id)}
                className="text-danger text-xs"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Video title"
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-56"
            id="video-title"
          />
          <label className="text-sm text-primary font-medium cursor-pointer">
            Choose file
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const title = document.getElementById('video-title').value || 'Video';
                handleFileUpload(uploadVideo, 'Video uploaded', title)(e);
              }}
            />
          </label>
        </div>
      </Card>

      <Card>
        <SectionHeading icon={Presentation} title="Presentation Slides" tag={<OptionalTag />} />
        <p className="text-xs text-slate-500 mt-1 mb-3">
          Share a past deck so colleges know your presentation style — not required to apply.
        </p>
        <ul className="space-y-1 mb-3">
          {(profile.presentationSlides || []).map((s) => (
            <li
              key={s._id}
              className="text-sm flex items-center justify-between bg-slate-50 rounded-md px-3 py-2"
            >
              <a href={s.url} target="_blank" rel="noreferrer" className="text-primary">
                {s.title}
              </a>
              <button
                onClick={() => handleDeleteAsset(deleteSlide)(s._id)}
                className="text-danger text-xs"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Slide deck title"
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-56"
            id="slide-title"
          />
          <label className="text-sm text-primary font-medium cursor-pointer">
            Choose file
            <input
              type="file"
              accept=".ppt,.pptx,.pdf"
              className="hidden"
              onChange={(e) => {
                const title = document.getElementById('slide-title').value || 'Slide Deck';
                handleFileUpload(uploadSlide, 'Slides uploaded', title)(e);
              }}
            />
          </label>
        </div>
      </Card>

      <Card>
        <SectionHeading icon={CalendarDays} title="Availability" tag={<OptionalTag />} />
        <p className="text-xs text-slate-500 mt-1 mb-3">
          Let colleges know which dates you're free (YYYY-MM-DD, comma-separated).
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {(profile.availability || []).map((d, i) => (
            <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {new Date(d).toLocaleDateString()}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <TextInput
            placeholder="2026-08-10, 2026-08-11"
            value={availabilityInput}
            onChange={(e) => setAvailabilityInput(e.target.value)}
          />
          <button
            onClick={handleSaveAvailability}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 whitespace-nowrap"
          >
            Update
          </button>
        </div>
      </Card>
    </div>
  );
};

export default PresenterProfilePage;