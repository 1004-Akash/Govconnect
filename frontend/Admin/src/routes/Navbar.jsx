import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function Navbar() {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/map', label: 'Geo Intelligence', icon: '📍' },
    { path: '/sentiment', label: 'Sentiment AI', icon: '🧠' },
    { path: '/chatbot', label: 'GovBot Debug', icon: '🤖' }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#070a0e]/80 backdrop-blur-3xl border-b border-white/5 py-3 px-8 shadow-2xl shadow-black/50">
      <div className="mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
             ⚡
          </div>
          <div className="flex flex-col">
             <span className="text-xl font-black text-white leading-none">CivicPulse</span>
             <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1.5 leading-none">Administrator Core</span>
          </div>
        </Link>

        {/* Global Search / Breadcrumbs placeholder */}
        <div className="hidden lg:flex flex-1 mx-20">
           <div className="w-full max-w-sm px-6 py-2 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-sm flex items-center gap-3">
              🔍 <span>Search systems, reports, or clusters...</span>
           </div>
        </div>

        {/* Desktop Nav */}
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-2 py-2 rounded-2xl bg-white/5 border border-white/5 mx-6">
              {navItems.map((item) => (
                <NavLink 
                  key={item.path}
                  to={item.path}
                   className={({ isActive }) => `
                    px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-3 transition-all relative
                    ${isActive ? 'text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div 
                          layoutId="admin-nav"
                          className="absolute inset-0 bg-blue-600 rounded-xl -z-10"
                        />
                      )}
                      <span>{item.icon}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
           </div>
           
           <div className="w-10 h-10 rounded-full border-2 border-emerald-500/50 p-0.5 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-[url('https://api.dicebear.com/7.x/avataaars/svg?seed=Admin')] bg-cover"></div>
           </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;