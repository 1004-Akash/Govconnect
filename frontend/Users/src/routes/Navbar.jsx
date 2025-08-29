import React, { useState } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { cn } from '../utils/helpers';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/chatbot', label: 'Chatbot' },
    { path: '/news', label: 'News' },
    { path: '/form', label: 'Eligibility' },
    { path: '/civicpulse', label: 'CivicPulse' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 backdrop-blur border-b bg-white/70 dark:bg-slate-950/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + App Name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">GovConnect</span>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" className="nav-link">Home</NavLink>
            <NavLink to="/about" className="nav-link">About</NavLink>
            <NavLink to="/chatbot" className="nav-link">Chatbot</NavLink>
            <NavLink to="/news" className="nav-link">News</NavLink>
            <NavLink to="/form" className="nav-link">Eligibility</NavLink>
            <NavLink to="/civicpulse" className="nav-link">CivicPulse</NavLink>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <select className="hidden sm:block text-sm bg-transparent border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="en">EN</option>
              <option value="hi">हिंदी</option>
              <option value="ta">தமிழ்</option>
            </select>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Report Issue CTA */}
            <button className="btn-primary">
              Report Issue
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-950/95 backdrop-blur">
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'block text-base font-medium transition-colors',
                    isActive(item.path)
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <button className="btn-primary w-full">
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}