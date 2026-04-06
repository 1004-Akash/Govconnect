import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { cn } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/chatbot', label: 'GovBot AI' },
    { path: '/news', label: 'News' },
    { path: '/form', label: 'Eligibility' },
    { path: '/civicpulse', label: 'CivicPulse' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={cn(
      "sticky top-0 z-50 transition-all duration-500",
      scrolled 
        ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 py-2 shadow-lg shadow-black/5" 
        : "bg-transparent py-5"
    )}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-emerald-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">GovConnect</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">AI Powered</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 p-1.5 rounded-full bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur border border-slate-200/50 dark:border-slate-800/50">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'px-5 py-2 text-sm font-semibold rounded-full transition-all relative',
                  isActive(item.path)
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {isActive(item.path) && (
                  <motion.div 
                    layoutId="nav-active"
                    className="absolute inset-0 bg-emerald-600 rounded-full -z-10 shadow-lg shadow-emerald-500/20"
                  />
                )}
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <ThemeToggle />
            </div>

            <Link 
              to="/form"
              className="hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:scale-105 active:scale-95 transition-all"
            >
              Get Started
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-900 transition-colors"
            >
              <div className="w-5 flex flex-col items-end gap-1.5">
                <span className={cn("h-0.5 bg-slate-900 dark:bg-white rounded-full transition-all duration-300", isMenuOpen ? "w-5 -rotate-45 translate-y-2" : "w-5")}></span>
                <span className={cn("h-0.5 bg-slate-900 dark:bg-white rounded-full transition-all duration-300", isMenuOpen ? "opacity-0" : "w-3")}></span>
                <span className={cn("h-0.5 bg-slate-900 dark:bg-white rounded-full transition-all duration-300", isMenuOpen ? "w-5 rotate-45 -translate-y-0" : "w-4")}></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 md:hidden overflow-hidden"
          >
            <div className="p-6 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'block text-2xl font-black py-2 transition-all',
                    isActive(item.path)
                      ? 'text-emerald-600 dark:text-emerald-400 translate-x-2'
                      : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <Link to="/form" onClick={() => setIsMenuOpen(false)} className="btn-primary w-full shadow-xl">
                  Report Incident
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}