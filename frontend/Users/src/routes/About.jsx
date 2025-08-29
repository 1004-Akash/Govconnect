import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';

export default function About() {
  const sections = [
    {
      title: "Mission",
      content: "Make policy access, civic reporting, and feedback transparent and inclusive (SDG-16)."
    },
    {
      title: "How it Works",
      content: "Anonymous reports → clustering → prioritization → admin workflow. RAG chatbot for policy Q&A."
    },
    {
      title: "Privacy & Safety",
      content: "PII scrubbing, rate limits, moderation pipeline, transparent metrics."
    },
    {
      title: "Impact Metrics",
      content: "Resolution time, top categories, weekly sentiment. Show small cards with stats."
    },
    {
      title: "Contact",
      content: "Simple mailto/link; small team avatars if available."
    }
  ];

  const impactStats = [
    { label: 'Avg Resolution Time', value: '2.3 days', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Issues Resolved', value: '1,247', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Active Users', value: '5.2K', color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Satisfaction Rate', value: '94%', color: 'text-purple-600 dark:text-purple-400' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mb-4">
              About GovConnect
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              We're building the future of civic engagement, one connection at a time.
            </p>
          </div>

          {/* Main Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {sections.map((section, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
                  {section.title}
                </h2>
                <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Impact Metrics */}
          <div className="mt-12 mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 text-center">
              Our Impact
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {impactStats.map((stat, index) => (
                <Card key={index} className="p-4 text-center">
                  <div className={`text-2xl md:text-3xl font-bold ${stat.color} mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Callout */}
          <Card className="p-6 mt-8 text-center">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Ready to make a difference?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Join thousands of citizens who are actively shaping their communities through GovConnect.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/form"
                className="btn-primary"
              >
                Report an Issue
              </Link>
              <Link
                to="/chatbot"
                className="rounded-full border border-slate-300 dark:border-slate-600 px-5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Try Chatbot
              </Link>
            </div>
          </Card>

          {/* Team Section */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">
              Meet the Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                  A
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Anjali</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Product Lead</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                  R
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Rahul</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Tech Lead</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                  P
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Priya</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Design Lead</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}