'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  Mail, MapPin, Clock, Send, ArrowRight,
  Globe, ExternalLink, ChevronRight,
} from 'lucide-react';

const SUBJECTS = [
  'General Inquiry',
  'Board Member Interested',
  'Schedule a Demo',
  'Technical Support',
  'Partnership',
  'Other',
];

const CONTACT_INFO = [
  { icon: Mail, label: 'Email', value: 'support@suvren.co', href: 'mailto:support@suvren.co' },
  { icon: MapPin, label: 'Location', value: 'Raleigh, NC', href: null },
  { icon: Clock, label: 'Response Time', value: 'Within 24 hours', href: null },
];

const QUICK_LINKS = [
  { label: 'Start a free trial', href: '/signup' },
  { label: 'See our pricing', href: '/pricing' },
  { label: 'Read our security docs', href: '/security' },
  { label: 'Explore the demo', href: '/demo' },
];

export default function ContactPageClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const mailtoSubject = encodeURIComponent(`[SuvrenHOA] ${subject}`);
    const mailtoBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`
    );
    window.location.href = `mailto:support@suvren.co?subject=${mailtoSubject}&body=${mailtoBody}`;

    setSubmitted(true);
  }

  const inputClasses =
    'w-full rounded-lg px-4 py-3 text-[rgba(245,240,232,0.85)] placeholder:text-[rgba(245,240,232,0.3)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[rgba(176,155,113,0.6)]';
  const inputStyle = {
    backgroundColor: '#151518',
    border: '1px solid rgba(245,240,232,0.06)',
  };

  return (
    <div className="page-enter min-h-screen">
      {/* ── Hero ── */}
      <section className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 gradient-text"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Get in touch.
          </h1>
          <p className="text-lg text-[rgba(245,240,232,0.45)] max-w-2xl mx-auto leading-relaxed">
            We&rsquo;d love to hear from you. Whether you&rsquo;re exploring SuvrenHOA for your
            community or just have questions, we&rsquo;re here.
          </p>
        </div>
      </section>

      {/* ── Two-column: Form + Info ── */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-10">
            {/* ── Left: Contact Form ── */}
            <div className="md:col-span-3 page-enter-delay-1">
              <div
                className="rounded-2xl p-8"
                style={{
                  backgroundColor: '#151518',
                  border: '1px solid rgba(245,240,232,0.06)',
                }}
              >
                {submitted ? (
                  <div className="text-center py-12">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{ backgroundColor: 'rgba(42,93,79,0.2)' }}
                    >
                      <Send className="w-7 h-7 text-[#2A5D4F]" />
                    </div>
                    <h3
                      className="text-2xl font-semibold text-[rgba(245,240,232,0.9)] mb-3"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      Message sent!
                    </h3>
                    <p className="text-[rgba(245,240,232,0.45)] mb-6">
                      Your email client should have opened with the message. We&rsquo;ll get back to
                      you within 24 hours.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setName('');
                        setEmail('');
                        setSubject('General Inquiry');
                        setMessage('');
                      }}
                      className="text-[#B09B71] hover:text-[#c4b48e] transition-colors text-sm font-medium"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h2
                      className="text-xl font-semibold text-[rgba(245,240,232,0.9)] mb-2"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      Send us a message
                    </h2>

                    {/* Name */}
                    <div>
                      <label className="block text-sm text-[rgba(245,240,232,0.45)] mb-1.5">
                        Name <span className="text-[#B09B71]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className={inputClasses}
                        style={inputStyle}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm text-[rgba(245,240,232,0.45)] mb-1.5">
                        Email <span className="text-[#B09B71]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={inputClasses}
                        style={inputStyle}
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm text-[rgba(245,240,232,0.45)] mb-1.5">
                        Subject
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className={`${inputClasses} appearance-none cursor-pointer`}
                        style={inputStyle}
                      >
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm text-[rgba(245,240,232,0.45)] mb-1.5">
                        Message <span className="text-[#B09B71]">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us how we can help..."
                        className={`${inputClasses} resize-none`}
                        style={inputStyle}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-semibold text-white transition-all duration-200 hover:brightness-110"
                      style={{
                        background: 'linear-gradient(135deg, #B09B71 0%, #8a7a58 100%)',
                      }}
                    >
                      Send Message
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* ── Right: Contact Info ── */}
            <div className="md:col-span-2 space-y-5 page-enter-delay-2">
              {CONTACT_INFO.map((item) => {
                const Icon = item.icon;
                const inner = (
                  <div
                    className="rounded-xl p-5 transition-colors duration-200 hover:border-[rgba(245,240,232,0.1)]"
                    style={{
                      backgroundColor: '#151518',
                      border: '1px solid rgba(245,240,232,0.06)',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(176,155,113,0.1)' }}
                      >
                        <Icon className="w-5 h-5 text-[#B09B71]" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[rgba(245,240,232,0.35)] mb-1">
                          {item.label}
                        </p>
                        <p className="text-[rgba(245,240,232,0.85)] font-medium">{item.value}</p>
                      </div>
                    </div>
                  </div>
                );

                return item.href ? (
                  <a key={item.label} href={item.href} className="block">
                    {inner}
                  </a>
                ) : (
                  <div key={item.label}>{inner}</div>
                );
              })}

              {/* Social Links */}
              <div
                className="rounded-xl p-5"
                style={{
                  backgroundColor: '#151518',
                  border: '1px solid rgba(245,240,232,0.06)',
                }}
              >
                <p className="text-xs uppercase tracking-wider text-[rgba(245,240,232,0.35)] mb-3">
                  Follow Us
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://twitter.com/SuvrenHOA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 hover:bg-[rgba(176,155,113,0.15)]"
                    style={{ backgroundColor: 'rgba(176,155,113,0.1)' }}
                  >
                    <ExternalLink className="w-5 h-5 text-[#B09B71]" />
                  </a>
                  <a
                    href="https://linkedin.com/company/suvren"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 hover:bg-[rgba(176,155,113,0.15)]"
                    style={{ backgroundColor: 'rgba(176,155,113,0.1)' }}
                  >
                    <Globe className="w-5 h-5 text-[#B09B71]" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="pb-32 page-enter-delay-3">
        <div className="max-w-4xl mx-auto px-6">
          <div
            className="rounded-2xl p-8"
            style={{
              backgroundColor: '#151518',
              border: '1px solid rgba(245,240,232,0.06)',
            }}
          >
            <h2
              className="text-xl font-semibold text-[rgba(245,240,232,0.9)] mb-6"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Looking for something specific?
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between rounded-lg px-5 py-3.5 transition-all duration-200 hover:bg-[rgba(176,155,113,0.06)]"
                  style={{ border: '1px solid rgba(245,240,232,0.06)' }}
                >
                  <span className="text-[rgba(245,240,232,0.7)] group-hover:text-[rgba(245,240,232,0.9)] transition-colors">
                    {link.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#B09B71] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
