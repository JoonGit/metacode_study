"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 로그인 페이지일 경우 레이아웃 없이 자식만 렌더링
  if (pathname.includes('/admin/login')) {
    return <>{children}</>;
  }

  const router = import('next/navigation').then(mod => mod.useRouter);
  const routerInstance = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('admin_logged_in');
      if (routerInstance) {
        routerInstance.push('/admin/login');
      }
    }
  };

  const menuItems = [
    { name: '통합 대시보드', path: '/admin', icon: '📊' },
    { name: '가맹점 관리', path: '/admin/stores', icon: '🏪' },
    { name: '관리자 계정 관리', path: '/admin/staff', icon: '👥' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Mobile Header / Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <div className="font-bold text-xl text-slate-800 tracking-tight">SmartOrder Admin</div>
        <button 
          className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen 
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 top-0 left-0 h-full w-64 bg-white border-r border-slate-200 shadow-sm transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 hidden md:block">
          <div className="text-2xl font-black text-slate-900 tracking-tight">SmartOrder</div>
          <div className="text-xs font-semibold text-slate-400 mt-1 tracking-wider uppercase">System Admin</div>
        </div>
        
        {/* Mobile Sidebar Header */}
        <div className="p-4 border-b border-slate-200 md:hidden flex justify-between items-center">
          <div className="font-bold text-lg text-slate-800">Menu</div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 mt-6 px-4 flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">최고관리자</div>
              <div className="text-xs text-slate-500 truncate">admin@smartorder.com</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full mt-4 py-2 px-4 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 pt-16 md:pt-0 overflow-y-auto">
        <div className="w-[90%] mx-auto py-4 sm:py-6 md:py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
