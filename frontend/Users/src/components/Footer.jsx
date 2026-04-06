import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-background border-t border-slate-200/50 dark:border-slate-800/50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 text-sm">
          <div className="space-y-6 md:col-span-1">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xl font-black text-slate-900 dark:text-white leading-none">GovConnect</span>
             </div>
             <p className="text-muted-foreground leading-relaxed">
               An AI-powered infrastructure for modern civic engagement and automated governance solutions.
             </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Platform</h4>
            <div className="flex flex-col gap-2">
              <Link to="/news" className="text-muted-foreground hover:text-emerald-600 transition-colors">Latest News</Link>
              <Link to="/civicpulse" className="text-muted-foreground hover:text-emerald-600 transition-colors">CivicPulse Dashboard</Link>
              <Link to="/chatbot" className="text-muted-foreground hover:text-emerald-600 transition-colors">GovBot AI</Link>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Legal</h4>
            <div className="flex flex-col gap-2">
              <Link to="/privacy" className="text-muted-foreground hover:text-emerald-600 transition-colors">Privacy Charter</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-emerald-600 transition-colors">Terms of Service</Link>
              <Link to="/accessibility" className="text-muted-foreground hover:text-emerald-600 transition-colors">Accessibility</Link>
            </div>
          </div>

           <div className="space-y-4">
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Innovation</h4>
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
               <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Status</p>
               <p className="font-bold text-slate-900 dark:text-white">v2.4 "Starlight" Beta</p>
               <div className="mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">AI Processing Online</span>
               </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200/30 dark:border-slate-800/30 flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-muted-foreground text-xs font-medium">
             © {new Date().getFullYear()} GovConnect. An Next-Gen Civic Infrastructure project.
           </p>
           <div className="flex items-center gap-6">
              {['Twitter', 'GitHub', 'LinkedIn'].map(s => (
                <span key={s} className="text-muted-foreground hover:text-emerald-600 transition-colors cursor-pointer font-bold text-xs uppercase tracking-widest">{s}</span>
              ))}
           </div>
        </div>
      </div>
    </footer>
  );
}
