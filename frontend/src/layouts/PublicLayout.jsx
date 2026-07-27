import { Outlet } from 'react-router-dom';
import PublicNavbar from '@/features/public/components/PublicNavbar';
import PublicFooter from '@/features/public/components/PublicFooter';
import PublicBottomNav from '@/features/public/components/PublicBottomNav';
import ScrollToTop from '@/components/common/ScrollToTop';

const PublicLayout = () => (
  <div className="min-h-screen flex flex-col bg-white">
    <ScrollToTop />
    <PublicNavbar />
    <main className="flex-1 pb-16 lg:pb-0">
      <Outlet />
    </main>
    <PublicFooter />
    <PublicBottomNav />
  </div>
);

export default PublicLayout;
