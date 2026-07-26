import { Link } from 'react-router-dom';
import { CheckCircle2, Percent, ArrowRight, GraduationCap, Building2 } from 'lucide-react';

const PricingPage = () => (
  <div className="bg-slate-50 min-h-screen">
    <div className="bg-gradient-to-b from-primary/10 to-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
          Simple, transparent pricing
        </h1>
        <p className="text-slate-500 mt-3">
          No subscriptions. No hidden fees. Pay only when a booking is confirmed.
        </p>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Presenters</h3>
          <p className="text-sm text-slate-500 mb-6">Free to join and apply</p>
          <p className="text-3xl font-bold text-slate-900 mb-6">
            ₹0 <span className="text-base font-normal text-slate-400">/ month</span>
          </p>
          <ul className="space-y-3">
            {[
              'Create your profile for free',
              'Apply to unlimited opportunities',
              'Chat with colleges before booking',
              'Receive your full agreed fee — no deductions',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border-2 border-primary shadow-md p-8 relative">
          <span className="absolute -top-3 left-8 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
            Pay per booking
          </span>
          <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
            <Building2 className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Colleges</h3>
          <p className="text-sm text-slate-500 mb-6">Post requirements for free</p>
          <p className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Percent className="w-6 h-6 text-primary" /> 10%{' '}
            <span className="text-base font-normal text-slate-400">commission per booking</span>
          </p>
          <ul className="space-y-3 mt-6">
            {[
              'Post unlimited requirements for free',
              'Search and shortlist presenters at no cost',
              'Only pay a small platform commission when you book',
              'Secure payments held until presentation is complete',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center mt-12">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Create Free Account <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </div>
);

export default PricingPage;
