import { Link } from 'react-router-dom';
import { Presentation, Mail, MapPin, Users2, Building2 } from 'lucide-react';

const PublicFooter = () => (
  <footer className="bg-slate-900 text-slate-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-14 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <div className="col-span-2 lg:col-span-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Presentation className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">Presentation Platform</span>
        </div>
        <p className="text-sm text-slate-400">
          Connecting colleges and presenters for memorable presentation opportunities.
        </p>
      </div>

      <div>
        <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-1.5">
          <Users2 className="w-3.5 h-3.5" /> For Presenters
        </h4>
        <ul className="space-y-2 text-sm">
          <li>
            <Link to="/find-opportunities" className="hover:text-white transition-colors">
              Find Opportunities
            </Link>
          </li>
          <li>
            <Link to="/register" className="hover:text-white transition-colors">
              Create Profile
            </Link>
          </li>
          <li>
            <Link to="/how-it-works" className="hover:text-white transition-colors">
              How It Works
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" /> For Colleges
        </h4>
        <ul className="space-y-2 text-sm">
          <li>
            <Link to="/find-presenters" className="hover:text-white transition-colors">
              Find Presenters
            </Link>
          </li>
          <li>
            <Link to="/register" className="hover:text-white transition-colors">
              Post a Requirement
            </Link>
          </li>
          <li>
            <Link to="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="text-white text-sm font-semibold mb-3">Company</h4>
        <ul className="space-y-2 text-sm">
          <li>
            <Link to="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
          </li>
          <li>
            <Link to="/about" className="hover:text-white transition-colors">
              About Us
            </Link>
          </li>
          <li>
            <Link to="/contact" className="hover:text-white transition-colors">
              Contact Us
            </Link>
          </li>
        </ul>
        <div className="mt-4 space-y-2 text-sm text-slate-400">
          <p className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 shrink-0" /> hello@presentationplatform.com
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" /> Trichy, Tamil Nadu, India
          </p>
        </div>
      </div>
    </div>
    <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
      © {new Date().getFullYear()} Presentation Platform. All rights reserved.
    </div>
  </footer>
);

export default PublicFooter;
