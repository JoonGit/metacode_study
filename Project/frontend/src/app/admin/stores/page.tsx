"use client";

import React, { useEffect, useState } from 'react';
import { backendApi } from '../../../shared/api/client';
import { StoreStatus } from '../../../shared/constants/enums';
import Spinner from '../../../shared/ui/Spinner';

export default function AdminStores() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('ALL');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    businessNumber: '',
    storeName: '',
    ownerName: '',
    status: StoreStatus.PENDING,
    loginId: '',
    loginPw: ''
  });
  const [initialFormData, setInitialFormData] = useState<any>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await backendApi.get('/admin/stores');
      setStores(res.data?.content || res.data || []);
    } catch (err) {
      console.error('Failed to fetch stores', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingStore(null);
    const initData = {
      businessNumber: '',
      storeName: '',
      ownerName: '',
      status: StoreStatus.PENDING,
      loginId: '',
      loginPw: ''
    };
    setFormData(initData);
    setInitialFormData(initData);
    setIsModalOpen(true);
  };

  const openEditModal = (store: any) => {
    setEditingStore(store);
    const initData = {
      businessNumber: store.businessNumber || '',
      storeName: store.storeName || '',
      ownerName: store.ownerName || '',
      status: store.status || StoreStatus.PENDING,
      loginId: store.loginId || '',
      loginPw: '' // 비밀번호는 보통 빈값으로 시작
    };
    setFormData(initData);
    setInitialFormData(initData);
    setIsModalOpen(true);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (JSON.stringify(formData) !== JSON.stringify(initialFormData)) {
        if (!window.confirm('작성 중인 내용이 지워집니다. 닫으시겠습니까?')) {
          return;
        }
      }
      setIsModalOpen(false);
    }
  };

  const handleSaveStore = async () => {
    try {
      if (editingStore) {
        await backendApi.put(`/admin/stores/${editingStore.storeId}`, formData);
        alert('가맹점이 수정되었습니다.');
      } else {
        await backendApi.post('/admin/stores', formData);
        alert('신규 가맹점이 등록되었습니다.');
      }
      setIsModalOpen(false);
      fetchStores();
    } catch (err) {
      console.error(err);
      alert('저장 실패');
    }
  };

  const handleStatusChange = async (storeId: number, newStatus: string) => {
    try {
      await backendApi.put(`/admin/stores/${storeId}/status?status=${newStatus}`);
      setStores(stores.map(s => s.storeId === storeId ? { ...s, status: newStatus } : s));
    } catch (err) {
      console.error('Failed to update store status', err);
      alert('상태 업데이트 실패');
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesQuery = !searchQuery || 
      (store.storeName && store.storeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (store.ownerName && store.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (store.businessNumber && store.businessNumber.includes(searchQuery));
    
    const matchesStatus = searchStatus === 'ALL' || store.status === searchStatus;
    
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">가맹점 관리</h2>
        <button 
          onClick={openAddModal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          신규 가맹점 등록
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 whitespace-nowrap">검색:</span>
          <input 
            type="text" 
            placeholder="가맹점명, 대표자명, 사업자번호 검색" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 p-2 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 whitespace-nowrap">상태 필터:</span>
          <select 
            value={searchStatus} 
            onChange={(e) => setSearchStatus(e.target.value)}
            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">전체 보기</option>
            <option value={StoreStatus.PENDING}>승인 대기</option>
            <option value={StoreStatus.ACTIVE}>정상 영업</option>
            <option value={StoreStatus.INACTIVE}>휴업</option>
            <option value={StoreStatus.SUSPENDED}>정지</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Spinner size={40} color="#2563eb" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">사업자번호</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">가맹점명</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">대표자명</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">상태</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">가입일</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStores.map(store => (
                  <tr key={store.storeId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500 font-medium">#{store.storeId}</td>
                    <td className="p-4 text-slate-600 font-mono">{store.businessNumber || '-'}</td>
                    <td className="p-4 font-bold text-slate-900">{store.storeName}</td>
                    <td className="p-4 text-slate-600">{store.ownerName || '-'}</td>
                    <td className="p-4 text-center">
                      <select 
                        value={store.status} 
                        onChange={(e) => handleStatusChange(store.storeId, e.target.value)}
                        className={`p-1.5 text-xs font-bold rounded-md border outline-none ${
                          store.status === StoreStatus.ACTIVE ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500' :
                          store.status === StoreStatus.INACTIVE ? 'bg-slate-50 border-slate-200 text-slate-600 focus:ring-slate-500' :
                          store.status === StoreStatus.SUSPENDED ? 'bg-rose-50 border-rose-200 text-rose-700 focus:ring-rose-500' :
                          'bg-blue-50 border-blue-200 text-blue-700 focus:ring-blue-500'
                        }`}
                      >
                        <option value={StoreStatus.PENDING}>승인 대기</option>
                        <option value={StoreStatus.ACTIVE}>정상 영업</option>
                        <option value={StoreStatus.INACTIVE}>휴업</option>
                        <option value={StoreStatus.SUSPENDED}>정지</option>
                      </select>
                    </td>
                    <td className="p-4 text-slate-500">{new Date(store.createdAt || Date.now()).toLocaleDateString()}</td>
                    <td className="p-4 flex justify-center items-center gap-2">
                      <button 
                        onClick={() => openEditModal(store)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-md transition-colors text-xs"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStores.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center p-10 text-slate-500 font-medium">조회된 가맹점이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Store Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">{editingStore ? '가맹점 수정' : '신규 가맹점 등록'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1 font-bold text-slate-700 text-sm">사업자 등록번호</label>
                  <input 
                    type="text" 
                    value={formData.businessNumber} 
                    onChange={e => setFormData({...formData, businessNumber: e.target.value})}
                    placeholder="000-00-00000"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700 text-sm">가맹점명</label>
                  <input 
                    type="text" 
                    value={formData.storeName} 
                    onChange={e => setFormData({...formData, storeName: e.target.value})}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700 text-sm">대표자명</label>
                  <input 
                    type="text" 
                    value={formData.ownerName} 
                    onChange={e => setFormData({...formData, ownerName: e.target.value})}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700 text-sm">가맹점 상태</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as StoreStatus})}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value={StoreStatus.PENDING}>가입대기</option>
                    <option value={StoreStatus.ACTIVE}>활성</option>
                    <option value={StoreStatus.SUSPENDED}>정지</option>
                    <option value={StoreStatus.INACTIVE}>폐업</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-200 mt-2">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    점주 계정 설정
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 font-bold text-slate-700 text-sm">점주 로그인 아이디 {editingStore && <span className="text-slate-400 font-normal text-xs">(변경 시에만 입력)</span>}</label>
                      <input 
                        type="text" 
                        value={formData.loginId} 
                        onChange={e => setFormData({...formData, loginId: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="기본값: store_임의숫자"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-700 text-sm">{editingStore ? '점주 로그인 비밀번호 (변경 시에만 입력)' : '임시 비밀번호'}</label>
                      <input 
                        type="password" 
                        value={formData.loginPw} 
                        onChange={e => setFormData({...formData, loginPw: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="기본값: 1234"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleSaveStore}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
