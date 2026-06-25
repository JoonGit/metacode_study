"use client";

import React, { useState } from 'react';
import { backendApi } from '../../../shared/api/client';
import Spinner from '../../../shared/ui/Spinner';

export default function StoreSettings() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSavePin = async () => {
    if (!pin) {
      alert("PIN 번호를 입력해주세요.");
      return;
    }
    if (pin !== confirmPin) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const storeId = localStorage.getItem('logged_store_id') || '1';
      await backendApi.put(`/stores/${storeId}/pin`, { pin });
      setMessage('관리자 비밀번호가 성공적으로 변경되었습니다.');
      setPin('');
      setConfirmPin('');
    } catch (err) {
      console.error("Failed to update PIN", err);
      alert("비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">매장 설정</h1>
        <p className="text-slate-500 font-medium">매장 정보 및 보안 설정을 관리합니다.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">관리자 비밀번호(PIN) 변경</h2>
        
        <div className="flex flex-col gap-4 max-w-sm">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">새 비밀번호 (PIN)</label>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg font-bold tracking-[0.3em]"
              placeholder="****"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">비밀번호 확인</label>
            <input 
              type="password" 
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg font-bold tracking-[0.3em]"
              placeholder="****"
            />
          </div>

          {message && (
            <div className="text-emerald-600 font-bold text-sm bg-emerald-50 p-3 rounded-lg">
              {message}
            </div>
          )}

          <button 
            onClick={handleSavePin}
            disabled={loading}
            className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center"
          >
            {loading ? <Spinner size={20} color="#fff" /> : '비밀번호 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
