import { Target, Heart, Users2 } from 'lucide-react';

const AboutPage = () => (
  <div className="bg-slate-50 min-h-screen">
    <div className="bg-gradient-to-b from-primary/10 to-transparent">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
          About Presentation Platform
        </h1>
      </div>
    </div>

    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <p className="text-slate-600 leading-relaxed mb-5">
          Presentation Platform connects colleges looking for engaging speakers with presenters who
          want to share their expertise. Whether it's a guest lecture, a career-guidance talk, or a
          hands-on workshop, our platform makes it simple to discover the right person and book them
          securely — end to end.
        </p>
        <p className="text-slate-600 leading-relaxed">
          From posting a requirement to completing payment and sharing reviews, everything happens
          in one place — no scattered emails, no manual invoicing, no guesswork.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Our Mission</h3>
          <p className="text-xs text-slate-500">
            Make finding and booking great presenters effortless.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 text-secondary" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Our Values</h3>
          <p className="text-xs text-slate-500">
            Transparency, fair pay, and trust between both sides.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-3">
            <Users2 className="w-6 h-6 text-success" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Our Community</h3>
          <p className="text-xs text-slate-500">
            Colleges and presenters building better events together.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default AboutPage;
