"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HealthBanner from '../../shared/ui/HealthBanner';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [storeName, setStoreName] = useState('매장');
  const [storeDesc, setStoreDesc] = useState('Store');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const sId = localStorage.getItem('logged_store_id') || '1';
      setStoreDesc(`Store #${sId}`);
      
      const savedName = localStorage.getItem('logged_store_name');
      if (savedName && savedName !== '가맹점') {
        setStoreName(savedName);
      }

      // import backendApi to fetch
      import('../../shared/api/client').then(({ backendApi }) => {
        backendApi.get(`/stores/${sId}`)
          .then((res: any) => {
            if (res.data && res.data.storeName) {
              setStoreName(res.data.storeName);
              localStorage.setItem('logged_store_name', res.data.storeName);
            }
          })
          .catch((err: any) => console.error("Failed to fetch store info", err));
      });
    }
  }, []);

  // 로그인 페이지일 경우 레이아웃 없이 자식만 렌더링
  if (pathname.includes('/store/login')) {
    return <>{children}</>;
  }

  const router = import('next/navigation').then(mod => mod.useRouter);
  const routerInstance = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('store_logged_in');
      localStorage.removeItem('logged_store_id');
      if (routerInstance) {
        routerInstance.push('/store/login');
      }
    }
  };

  const menuItems = [
    { name: '대시보드', path: '/store', icon: '📊' },
    { name: '실시간 주문', path: '/store/orders', icon: '🛎️' },
    { name: '카테고리 관리', path: '/store/categories', icon: '🏷️' },
    { name: '메뉴 관리', path: '/store/menus', icon: '🍔' },
    { name: '가맹점 직원 관리', path: '/store/staff', icon: '👥' },
    { name: '매장 설정', path: '/store/settings', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Mobile Header / Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <div className="font-bold text-xl text-slate-800 tracking-tight">Store POS</div>
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
          <div className="text-xs font-semibold text-slate-400 mt-1 tracking-wider uppercase">Store Management</div>
        </div>
        
        {/* Mobile Sidebar Header */}
        <div className="p-4 border-b border-slate-200 md:hidden flex justify-between items-center">
          <div className="font-bold text-lg text-slate-800">Menu</div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 mt-6 px-4 flex flex-col gap-2 overflow-y-auto">
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
              ST
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">{storeName}</div>
              <div className="text-xs text-slate-500 truncate">{storeDesc}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full mt-4 py-2 px-4 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 pt-16 md:pt-0 overflow-y-auto relative">
        {/* <HealthBanner /> */}
        <div className="w-[90%] mx-auto py-4 sm:py-6 md:py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
