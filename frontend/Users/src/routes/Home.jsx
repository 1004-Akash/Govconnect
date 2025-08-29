import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';

export default function Home() {
  const quickModules = [
    { 
      title: 'PolicyPal', 
      description: 'AI-powered policy search and analysis',
      path: '/policypal',
      icon: '📋'
    },
    { 
      title: 'CivicPulse', 
      description: 'Real-time civic sentiment tracking',
      path: '/civicpulse',
      icon: '📊'
    },
    { 
      title: 'GovMatch', 
      description: 'Find matching government schemes',
      path: '/form',
      icon: '🎯'
    },
    { 
      title: 'News & Sentiment', 
      description: 'Latest updates and public opinion',
      path: '/news',
      icon: '📰'
    }
  ];

  const faqItems = [
    'Is my data private?',
    'How are issues prioritized?',
    'Which languages are supported?'
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700 text-white p-8 md:p-12 shadow-xl mx-4 mt-6 md:mx-8">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-balance">
            Empowering Civic Engagement Through Technology
          </h1>
          <p className="mt-3 text-white/90 md:text-lg max-w-2xl">
            Connect with government services, report issues, and stay informed about policies that affect your community.
          </p>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/form"
              className="btn-primary bg-white text-emerald-700 hover:bg-white/90"
            >
              Report an Issue
            </Link>
            <Link
              to="/chatbot"
              className="rounded-full border border-white/40 px-5 py-2 hover:bg-white/10 transition-colors"
            >
              Open Chatbot
            </Link>
          </div>
        </div>
        
        {/* Background decoration */}
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 10% 0%, rgba(255,255,255,.2), transparent)'
          }}
        />
      </section>

      {/* Quick Modules */}
      <section className="mx-4 mt-8 md:mx-8">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-6">
          Explore
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickModules.map((module) => (
            <Link key={module.path} to={module.path}>
              <Card className="p-4 text-center hover:shadow-xl transition-all duration-300 group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {module.icon}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  {module.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {module.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Glance */}
      <section className="mx-4 mt-8 md:mx-8">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-6">
          Live Overview
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Mini Map Card */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Issue Map
            </h3>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-48 flex items-center justify-center">
              <div className="text-center text-slate-500 dark:text-slate-400">
                <div className="text-2xl mb-2">🗺️</div>
                <p>Interactive map view</p>
                <p className="text-sm">Coming soon</p>
              </div>
            </div>
          </Card>

          {/* Sentiment & Issues Card */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Community Sentiment
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-24 flex items-center justify-center">
                <div className="text-center text-slate-500 dark:text-slate-400">
                  <div className="text-xl mb-1">📈</div>
                  <p className="text-sm">Sentiment sparkline</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900 dark:text-white">Top Issues</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Infrastructure</span>
                    <span className="text-emerald-600 dark:text-emerald-400">24%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Healthcare</span>
                    <span className="text-amber-500">18%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Education</span>
                    <span className="text-blue-500">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ Strip */}
      <section className="mx-4 mt-10 md:mx-8">
        <Card className="p-6">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqItems.map((question, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-slate-700 dark:text-slate-300">
                  {question}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}