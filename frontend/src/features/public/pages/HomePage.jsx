import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Users2,
  Building2,
  MessageCircle,
  CreditCard,
  Video,
  Star,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

const steps = [
  {
    icon: Building2,
    title: 'College Posts Requirement',
    desc: 'Colleges post presentation requirements with details on skills, budget, and date.',
  },
  {
    icon: Users2,
    title: 'Presenters Find & Apply',
    desc: 'Presenters search suitable opportunities and apply with a cover note.',
  },
  {
    icon: MessageCircle,
    title: 'College Reviews Applications',
    desc: 'Colleges review, shortlist, and chat directly with presenters.',
  },
  {
    icon: CheckCircle2,
    title: 'Confirm & Book',
    desc: 'College confirms the presenter and books the session.',
  },
  {
    icon: CreditCard,
    title: 'Secure Payment',
    desc: 'Payment is processed securely via the platform.',
  },
  {
    icon: Star,
    title: 'Presentation & Reviews',
    desc: 'The presentation happens and both sides share reviews.',
  },
];

const roleCards = [
  {
    icon: Users2,
    title: 'Presenters',
    tint: 'bg-primary/10 text-primary',
    ring: 'hover:border-primary/40',
    points: [
      'Build a rich profile with resume, videos & slides',
      'Browse and apply to opportunities',
      'Get paid securely after each session',
    ],
    cta: { label: 'Join as a Presenter', to: '/register' },
  },
  {
    icon: Building2,
    title: 'Colleges',
    tint: 'bg-secondary/10 text-secondary',
    ring: 'hover:border-secondary/40',
    points: [
      'Post presentation requirements in minutes',
      'Review, shortlist & chat with presenters',
      'Book and pay securely via Razorpay',
    ],
    cta: { label: 'Join as a College', to: '/register' },
  },
];

const trustStats = [
  { icon: Users2, label: 'Presenters', value: '500+' },
  { icon: Building2, label: 'Colleges', value: '150+' },
  { icon: CheckCircle2, label: 'Sessions Booked', value: '1.2k+' },
  { icon: ShieldCheck, label: 'Secure Payments', value: '100%' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/find-opportunities${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`);
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-white">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-14 sm:pt-24 pb-14 sm:pb-20 text-center">
          <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 shadow-sm rounded-full px-3.5 py-1.5 text-xs font-medium text-primary mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Trusted by colleges & presenters nationwide
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
            Find the Right Presenter for Your Next Event
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-2xl mx-auto">
            Connecting colleges and presenters for memorable presentation opportunities — search,
            shortlist, book, and pay, all in one place.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 max-w-xl mx-auto flex items-center gap-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow border border-slate-200 p-1.5"
          >
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search topics, skills, or keywords..."
              className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none min-w-0"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
            >
              Search
            </button>
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
            <Link
              to="/find-presenters"
              className="flex items-center gap-1 text-primary font-medium hover:underline"
            >
              <Users2 className="w-3.5 h-3.5" /> Browse Presenters
            </Link>
            <span className="text-slate-300">·</span>
            <Link
              to="/colleges"
              className="flex items-center gap-1 text-primary font-medium hover:underline"
            >
              <Building2 className="w-3.5 h-3.5" /> Browse Colleges
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {trustStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm py-4 px-2"
                >
                  <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Built for both sides</h2>
          <p className="text-slate-500 mt-2">Whichever side you're on, we've got you covered.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 hover:shadow-lg transition-all ${card.ring}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.tint}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{card.title}</h3>
                <ul className="space-y-2.5 mb-6">
                  {card.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
                <Link
                  to={card.cta.to}
                  className="inline-flex items-center gap-2 text-primary font-medium text-sm group"
                >
                  {card.cta.label}{' '}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
              <TrendingUp className="w-3.5 h-3.5" /> Simple Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How It Works</h2>
            <p className="text-slate-500 mt-2">
              From posting a requirement to sharing a review — six simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 tracking-wide">
                      STEP {i + 1}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Ready to get started?
        </h2>
        <p className="text-slate-500 mb-8">
          Join as a presenter or a college — it only takes a couple of minutes.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-700 rounded-lg px-6 py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Learn How It Works
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
