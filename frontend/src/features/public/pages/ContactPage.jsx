import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, MapPin, Send } from 'lucide-react';
import Card from '@/components/ui/Card';
import TextInput from '@/components/ui/TextInput';
import TextArea from '@/components/ui/TextArea';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all fields');
      return;
    }
    const subject = encodeURIComponent(`Contact from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\nFrom: ${form.name} (${form.email})`);
    window.location.href = `mailto:hello@presentationplatform.com?subject=${subject}&body=${body}`;
    toast.success('Opening your email app to send the message...');
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-gradient-to-b from-primary/10 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Contact Us</h1>
          <p className="text-slate-500 mt-3">Have a question? We'd love to hear from you.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="sm:col-span-1 flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Email</p>
                <p className="text-sm text-slate-500">hello@presentationplatform.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Location</p>
                <p className="text-sm text-slate-500">Trichy, Tamil Nadu, India</p>
              </div>
            </div>
          </Card>

          <Card className="sm:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextInput
                label="Your Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <TextInput
                label="Your Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <TextArea
                label="Message"
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
              <button
                type="submit"
                className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
