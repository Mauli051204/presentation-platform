import { createBrowserRouter } from 'react-router-dom';
import {
  LayoutDashboard,
  UserRound,
  Search,
  ClipboardList,
  CalendarCheck2,
  MessageCircle,
  Bell,
  Building2,
  FileText,
  Users,
  ShieldCheck,
  Wallet,
  Star,
  Percent,
  
} from 'lucide-react';

import BlogPage from "@/features/public/pages/BlogPage";
import BlogDetailPage from "@/features/public/pages/BlogDetailPage";
import BlogManagementPage from "@/features/admin/pages/BlogManagementPage";

import ProtectedRoute from '@/components/common/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import PublicLayout from '@/layouts/PublicLayout';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';

import HomePage from '@/features/public/pages/HomePage';
import FindPresentersPage from '@/features/public/pages/FindPresentersPage';
import FindOpportunitiesPage from '@/features/public/pages/FindOpportunitiesPage';
import CollegesPage from '@/features/public/pages/CollegesPage';
import HowItWorksPage from '@/features/public/pages/HowItWorksPage';
import PricingPage from '@/features/public/pages/PricingPage';
import AboutPage from '@/features/public/pages/AboutPage';
import ContactPage from '@/features/public/pages/ContactPage';

import PresenterDashboardHome from '@/features/presenter/pages/PresenterDashboardHome';
import PresenterProfilePage from '@/features/presenter/pages/PresenterProfilePage';
import BrowseOpportunitiesPage from '@/features/presenter/pages/BrowseOpportunitiesPage';
import MyApplicationsPage from '@/features/presenter/pages/MyApplicationsPage';
import PresenterBookingsPage from '@/features/presenter/pages/BookingsPage';
import PresenterMessagesPage from '@/features/presenter/pages/MessagesPage';
import PresenterNotificationsPage from '@/features/presenter/pages/NotificationsPage';

import CollegeDashboardHome from '@/features/college/pages/CollegeDashboardHome';
import CollegeProfilePage from '@/features/college/pages/CollegeProfilePage';
import RequirementsPage from '@/features/college/pages/RequirementsPage';
import RequirementApplicationsPage from '@/features/college/pages/RequirementApplicationsPage';
import CollegeBookingsPage from '@/features/college/pages/BookingsPage';
import CollegeMessagesPage from '@/features/college/pages/MessagesPage';
import CollegeNotificationsPage from '@/features/college/pages/NotificationsPage';

import AdminDashboardHome from '@/features/admin/pages/AdminDashboardHome';
import UsersPage from '@/features/admin/pages/UsersPage';
import CollegeVerificationPage from '@/features/admin/pages/CollegeVerificationPage';
import RequirementsModerationPage from '@/features/admin/pages/RequirementsModerationPage';
import PaymentsPage from '@/features/admin/pages/PaymentsPage';
import ReviewsModerationPage from '@/features/admin/pages/ReviewsModerationPage';
import AdminNotificationsPage from '@/features/admin/pages/NotificationsPage';
import CommissionSettingsPage from '@/features/admin/pages/CommissionSettingsPage';

import PresenterDetailPage from "@/features/public/pages/PresenterDetailPage";
import CollegeDetailPage from "@/features/public/pages/CollegeDetailPage";
import OpportunityDetailPage from "@/features/public/pages/OpportunityDetailPage";

const presenterNavItems = [
  { path: '/presenter/dashboard', label: 'Dashboard', exact: true, icon: LayoutDashboard },
  { path: '/presenter/profile', label: 'My Profile', icon: UserRound },
  { path: '/presenter/opportunities', label: 'Browse Opportunities', icon: Search },
  { path: '/presenter/applications', label: 'My Applications', icon: ClipboardList },
  { path: '/presenter/bookings', label: 'Bookings', icon: CalendarCheck2 },
  { path: '/presenter/messages', label: 'Messages', icon: MessageCircle },
];

const collegeNavItems = [
  { path: '/college/dashboard', label: 'Dashboard', exact: true, icon: LayoutDashboard },
  { path: '/college/profile', label: 'College Profile', icon: Building2 },
  { path: '/college/requirements', label: 'My Requirements', icon: FileText },
  { path: '/college/bookings', label: 'Bookings', icon: CalendarCheck2 },
  { path: '/college/messages', label: 'Messages', icon: MessageCircle },
];

const adminNavItems = [
  { path: '/admin/dashboard', label: 'Dashboard', exact: true, icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/colleges', label: 'College Verification', icon: ShieldCheck },
  { path: '/admin/requirements', label: 'Requirements', icon: FileText },
  { path: '/admin/payments', label: 'Payments & Revenue', icon: Wallet },
  { path: '/admin/reviews', label: 'Reviews', icon: Star },
  { path: '/admin/settings', label: 'Commission Settings', icon: Percent },
  { path: '/admin/blog', label: 'Blog', icon: FileText },
];

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/find-presenters', element: <FindPresentersPage /> },
      { path: '/find-opportunities', element: <FindOpportunitiesPage /> },
      { path: '/colleges', element: <CollegesPage /> },
      { path: '/how-it-works', element: <HowItWorksPage /> },
      { path: '/pricing', element: <PricingPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/presenters/:id', element: <PresenterDetailPage /> },
      { path: '/colleges/:id', element: <CollegeDetailPage /> },
      { path: '/opportunities/:id', element: <OpportunityDetailPage /> },
      { path: '/blog', element: <BlogPage /> },
      { path: '/blog/:slug', element: <BlogDetailPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute allowedRoles={['presenter']} />,
    children: [
      {
        element: (
          <DashboardLayout
            navItems={presenterNavItems}
            title="Presenter"
            notificationsPath="/presenter/notifications"
          />
        ),
        children: [
          { path: '/presenter/dashboard', element: <PresenterDashboardHome /> },
          { path: '/presenter/profile', element: <PresenterProfilePage /> },
          { path: '/presenter/opportunities', element: <BrowseOpportunitiesPage /> },
          { path: '/presenter/applications', element: <MyApplicationsPage /> },
          { path: '/presenter/bookings', element: <PresenterBookingsPage /> },
          { path: '/presenter/messages', element: <PresenterMessagesPage /> },
          { path: '/presenter/notifications', element: <PresenterNotificationsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['college']} />,
    children: [
      {
        element: (
          <DashboardLayout
            navItems={collegeNavItems}
            title="College"
            notificationsPath="/college/notifications"
          />
        ),
        children: [
          { path: '/college/dashboard', element: <CollegeDashboardHome /> },
          { path: '/college/profile', element: <CollegeProfilePage /> },
          { path: '/college/requirements', element: <RequirementsPage /> },
          {
            path: '/college/requirements/:requirementId/applications',
            element: <RequirementApplicationsPage />,
          },
          { path: '/college/bookings', element: <CollegeBookingsPage /> },
          { path: '/college/messages', element: <CollegeMessagesPage /> },
          { path: '/college/notifications', element: <CollegeNotificationsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: (
          <DashboardLayout
            navItems={adminNavItems}
            title="Admin"
            notificationsPath="/admin/notifications"
          />
        ),
        children: [
          { path: '/admin/dashboard', element: <AdminDashboardHome /> },
          { path: '/admin/users', element: <UsersPage /> },
          { path: '/admin/colleges', element: <CollegeVerificationPage /> },
          { path: '/admin/requirements', element: <RequirementsModerationPage /> },
          { path: '/admin/payments', element: <PaymentsPage /> },
          { path: '/admin/reviews', element: <ReviewsModerationPage /> },
          { path: '/admin/notifications', element: <AdminNotificationsPage /> },
          { path: '/admin/settings', element: <CommissionSettingsPage /> },
          { path: '/admin/blog', element: <BlogManagementPage /> },
        ],
      },
    ],
  },
]);

export default router;
