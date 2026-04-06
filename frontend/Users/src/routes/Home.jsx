import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/Card';

export default function Home() {
  const quickModules = [
    { 
      title: 'PolicyPal', 
      description: 'AI-powered policy search and analysis',
      path: '/policypal',
      icon: '📋',
      color: 'bg-blue-500/10 text-blue-500'
    },
    { 
      title: 'CivicPulse', 
      description: 'Real-time civic sentiment tracking',
      path: '/civicpulse',
      icon: '📊',
      color: 'bg-emerald-500/10 text-emerald-500'
    },
    { 
      title: 'GovMatch', 
      description: 'Find matching government schemes',
      path: '/form',
      icon: '🎯',
      color: 'bg-amber-500/10 text-amber-500'
    },
    { 
      title: 'News & Sentiment', 
      description: 'Latest updates and public opinion',
      path: '/news',
      icon: '📰',
      color: 'bg-purple-500/10 text-purple-500'
    }
  ];

  const faqItems = [
    { q: 'Is my data private?', a: 'We use industry-standard encryption and do not share your identity with third parties without consent.' },
    { q: 'How are issues prioritized?', a: 'Priority is calculated using a combination of severity tags, hotspot probability, and community validation count.' },
    { q: 'Which languages are supported?', a: 'We currently support English, Hindi, and Tamil, with more regional languages coming soon.' }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-background hero-mesh">
      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 max-w-7xl mx-auto overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-sm font-medium animate-pulse">
             <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            GovConnect Live in Tamil Nadu
          </div>
          
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-balance text-slate-900 dark:text-white leading-[1.1]">
            Empowering <span className="text-emerald-600 dark:text-emerald-400">Civic Engagement</span> Through AI
          </h1>
          
          <p className="mt-6 text-muted-foreground md:text-xl max-w-3xl mx-auto leading-relaxed">
            Connect with government services, report local issues with AI-assisted mapping, and stay informed about policies that affect your community.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/form" className="btn-primary transform transition-all hover:-translate-y-1">
              Check Eligibility
            </Link>
            <Link to="/chatbot" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm font-medium hover:bg-white dark:hover:bg-slate-900 transition-all active:scale-95">
              Launch GovBot AI
            </Link>
          </div>
        </motion.div>
        
        {/* Abstract shapes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full"></div>
        </div>
      </section>

      {/* Quick Modules */}
      <section className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Smart Solutions</h2>
            <p className="text-muted-foreground">Select a tool to start interacting with your government</p>
          </div>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {quickModules.map((module) => (
            <motion.div key={module.path} variants={item}>
              <Link to={module.path}>
                <div className="glass-card p-8 group h-full border border-slate-200/50 dark:border-slate-800/50">
                  <div className={`w-14 h-14 ${module.color} rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    {module.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {module.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Live Glance */}
      <section className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="glass-card overflow-hidden border-none shadow-2xl">
          <div className="grid md:grid-cols-5 h-full">
            <div className="md:col-span-3 p-10 space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Live Community Overview</h2>
                <p className="text-muted-foreground">Real-time tracking of civic issues and sentiment in your area</p>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">1.2k</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Reports</div>
                </div>
                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50">
                  <div className="text-2xl font-bold text-blue-500">84%</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Stability</div>
                </div>
                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50">
                  <div className="text-2xl font-bold text-amber-500">22m</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Response</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-lg">Top Regional Concerns</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Infrastructure', val: 78, color: 'bg-emerald-500' },
                    { label: 'Public Health', val: 45, color: 'bg-blue-500' },
                    { label: 'Security', val: 32, color: 'bg-amber-500' }
                  ].map((issue) => (
                    <div key={issue.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{issue.label}</span>
                        <span className="font-bold">{issue.val}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${issue.val}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full ${issue.color}`}
                        ></motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 relative min-h-[400px] bg-slate-900">
               <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/80.2707,13.0827,10,0/600x600?access_token=pk.eyJ1IjoiYWtleTEwMDMiLCJhIjoiY20xcGZ2NzFvMDJuZTJtcTJ2djRxNmdhOSJ9.c-X8l1t-8l1t-8l1t-8l1a')] bg-cover bg-center opacity-70 grayscale"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent"></div>
               
               <div className="absolute inset-0 flex items-center justify-center">
                  <Link to="/civicpulse" className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-white/20 transition-all">
                    Expand Issue Map
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Strip */}
      <section className="px-6 pb-32 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">Common Questions</h2>
        <div className="grid gap-4">
          {faqItems.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 rounded-3xl bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all"
            >
              <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-sm font-black">0{index+1}</span>
                {item.q}
              </h3>
              <p className="text-muted-foreground ml-11 leading-relaxed">
                {item.a}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}