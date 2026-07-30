import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, Eye, User } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ShareButton from '@/components/common/ShareButton';
import { getBlogPostBySlug } from '../api/blogApi';

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await getBlogPostBySlug(slug);
        setPost(data.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error('Failed to load article');
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Article not found</h1>
        <p className="text-slate-500 mb-6">This article doesn't exist or has been unpublished.</p>
        <Link to="/blog" className="text-primary font-medium">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {post.coverImage?.url && (
          <img
            src={post.coverImage.url}
            alt=""
            className="w-full h-64 object-cover rounded-xl mb-6"
          />
        )}

        <Card>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <Badge variant="primary">{post.category}</Badge>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" /> {post.author?.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {new Date(post.publishedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> {post.viewCount} views
                </span>
              </div>
            </div>
            <ShareButton title={post.title} />
          </div>

          <div className="mt-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-100">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="neutral">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BlogDetailPage;
