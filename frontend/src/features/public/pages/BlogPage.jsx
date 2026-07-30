import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, FileText, Eye, Calendar } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { listBlogPostsPublic } from '../api/blogApi';

const categories = [
  { value: '', label: 'All' },
  { value: 'guide', label: 'Guides' },
  { value: 'tips', label: 'Tips' },
  { value: 'news', label: 'News' },
  { value: 'faq', label: 'FAQ' },
  { value: 'announcement', label: 'Announcements' },
];

const BlogPage = () => {
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 9 };
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;
      const { data } = await listBlogPostsPublic(params);
      setPosts(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    if (searchParams.get('keyword')) setKeyword(searchParams.get('keyword'));
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(1);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Resources & Blog</h1>
          <p className="text-slate-500 mt-1">Guides, tips, and news for presenters and colleges.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Card className="mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search articles..."
                className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </form>
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === c.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="text-center py-16">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No articles found.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post._id} to={`/blog/${post.slug}`} className="block group">
                  <Card className="h-full flex flex-col hover:shadow-md transition-shadow overflow-hidden p-0">
                    {post.coverImage?.url ? (
                      <img src={post.coverImage.url} alt="" className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <Badge variant="primary">{post.category}</Badge>
                      <h3 className="text-base font-semibold text-slate-900 mt-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 flex-1">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-3 mt-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {post.viewCount}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => fetchPosts(p)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
