import { Link } from 'react-router-dom';
import {
  Building2,
  Users2,
  MessageCircle,
  CalendarCheck2,
  CreditCard,
  Star,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

const steps = [
  {
    icon: Building2,
    title: 'College posts requirement',
    desc: 'A college creates a presentation requirement with topic, budget, skills needed, and event date.',
  },
  {
    icon: Users2,
    title: 'Presenters find & apply',
    desc: 'Presenters search opportunities that match their skills and submit an application with a cover note.',
  },
  {
    icon: MessageCircle,
    title: 'College reviews applications',
    desc: 'The college reviews applicants, checks profiles and resumes, and chats directly to clarify details.',
  },
  {
    icon: CalendarCheck2,
    title: 'Shortlist & book',
    desc: 'Once satisfied, the college shortlists a presenter and books the session with an agreed fee.',
  },
  {
    icon: CreditCard,
    title: 'Secure payment',
    desc: 'Payment is processed via Razorpay, held securely until the presentation is confirmed complete.',
  },
  {
    icon: Star,
    title: 'Presentation & reviews',
    desc: 'The presentation happens (online or offline), the college marks it complete, and both sides leave a review.',
  },
];

const HowItWorksPage = () => (
  <div className="bg-slate-50 min-h-screen">
    <div className="bg-gradient-to-b from-primary/10 to-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-10 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-white shadow-sm border border-slate-200 px-3 py-1 rounded-full mb-4">
          <TrendingUp className="w-3.5 h-3.5" /> Simple, transparent process
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">How It Works</h1>
        <p className="text-slate-500 mt-3">
          A simple six-step journey from posting a requirement to sharing a review.
        </p>
      </div>
    </div>

    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
      <div className="space-y-5">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col items-center shrink-0">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                {i < steps.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-2" />}
              </div>
              <div className="pb-1">
                <span className="text-xs font-semibold text-primary">STEP {i + 1}</span>
                <h3 className="text-base font-semibold text-slate-900 mt-1">{step.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-10">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </div>
);

export default HowItWorksPage;
