import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye, Image as ImageIcon, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import FilterTabs from '@/components/ui/FilterTabs';
import TextInput from '@/components/ui/TextInput';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Pagination from '@/components/ui/Pagination';
import {
  listBlogPostsAdmin,
  createBlogPost,
  updateBlogPost,
  updateBlogPostStatus,
  deleteBlogPost,
  uploadBlogCoverImage,
} from '../api/blogApi';

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

const categoryLabels = {
  guide: 'Guide',
  tips: 'Tips',
  news: 'News',
  faq: 'FAQ',
  announcement: 'Announcement',
};

const emptyForm = { title: '', excerpt: '', content: '', category: 'guide', tags: '' };

const BlogManagementPage = () => {
  const [posts, setPosts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await listBlogPostsAdmin(params);
      setPosts(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (post) => {
    setEditingId(post._id);
    setForm({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      category: post.category,
      tags: (post.tags || []).join(', '),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      if (editingId) {
        await updateBlogPost(editingId, payload);
        toast.success('Post updated');
      } else {
        await createBlogPost(payload);
        toast.success('Post created as draft');
      }
      setModalOpen(false);
      await load(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const previous = posts;
    setBusyId(post._id);
    setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, status: newStatus } : p)));

    try {
      await updateBlogPostStatus(post._id, newStatus);
      toast.success(newStatus === 'published' ? 'Post published' : 'Post moved to draft');
    } catch (error) {
      setPosts(previous);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  const handleCoverUpload = async (postId, file) => {
    try {
      await uploadBlogCoverImage(postId, file);
      toast.success('Cover image uploaded');
      await load(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload cover image');
    }
  };

  const handleConfirmDelete = async () => {
    const postId = deleteTarget._id;
    const previous = posts;
    setIsDeleting(true);
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    setDeleteTarget(null);

    try {
      await deleteBlogPost(postId);
      toast.success('Post deleted');
    } catch (error) {
      setPosts(previous);
      toast.error(error.response?.data?.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <FilterTabs options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="text-center py-10">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No blog posts yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post._id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {post.coverImage?.url ? (
                    <img
                      src={post.coverImage.url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900">{post.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{post.excerpt}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant={post.status === 'published' ? 'success' : 'neutral'}>
                        {post.status}
                      </Badge>
                      <Badge variant="primary">{categoryLabels[post.category]}</Badge>
                      <span className="text-xs text-slate-400">
                        By {post.author?.name} · {post.viewCount} views
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col flex-wrap gap-3 sm:gap-2 sm:items-end shrink-0">
                  <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer whitespace-nowrap">
                    <ImageIcon className="w-4 h-4" /> Cover
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files[0] && handleCoverUpload(post._id, e.target.files[0])
                      }
                    />
                  </label>
                  <button
                    onClick={() => openEditModal(post)}
                    className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(post)}
                    disabled={busyId === post._id}
                    className="flex items-center gap-1.5 text-sm text-success font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4" />{' '}
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(post)}
                    className="flex items-center gap-1.5 text-sm text-danger whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => load(p)}
          />
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Post' : 'New Blog Post'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <TextInput
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <TextArea
            label="Excerpt (short summary, shown on listing cards)"
            rows={2}
            maxLength={300}
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          />
          <TextArea
            label="Content (supports plain paragraphs)"
            rows={10}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            required
          />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="guide">Guide</option>
            <option value="tips">Tips</option>
            <option value="news">News</option>
            <option value="faq">FAQ</option>
            <option value="announcement">Announcement</option>
          </Select>
          <TextInput
            label="Tags (comma-separated)"
            placeholder="presentations, career, guide"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          />
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

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete this blog post?"
        description="This cannot be undone. The post will be removed from the public site immediately."
        confirmLabel="Delete Post"
        isDangerous={true}
        isLoading={isDeleting}
        icon={Trash2}
      />
    </div>
  );
};

export default BlogManagementPage;
