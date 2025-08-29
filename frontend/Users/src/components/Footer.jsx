import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const footerLinks = [
    { path: '/privacy', label: 'Privacy' },
    { path: '/terms', label: 'Terms' },
    { path: '/contact', label: 'Contact' }
  ];

  return (
    <footer className="border-t text-xs text-slate-500 py-6 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            {footerLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-slate-600 dark:text-slate-400">
              © GovConnect – Built for civic engagement
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
