"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { backendApi } from '../../../shared/api/client';

export default function StoreLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('1234');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await backendApi.post('/auth/login', { loginId, password });
      if (res.status === 200 && res.data) {
        const data = res.data;
        if (data.userType === 'OWNER' || data.userType === 'STAFF') {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('store_logged_in', 'true');
          localStorage.setItem('logged_store_id', data.storeId.toString());
          localStorage.setItem('logged_store_name', data.name || 'Store');
          router.push('/store');
        } else {
          alert('가맹점 권한이 없습니다.');
        }
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        alert('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else {
        alert('서버와 통신할 수 없습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '400px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', color: '#0f172a', marginBottom: '10px' }}>
          SmartOrder <span style={{ color: '#38bdf8' }}>Store</span>
        </h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '30px' }}>점주님 환영합니다. 로그인해주세요.</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: '#334155' }}>아이디</label>
            <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: '#334155' }}>비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '10px', padding: '14px', backgroundColor: '#0ea5e9', color: 'white', 
              border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' 
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
