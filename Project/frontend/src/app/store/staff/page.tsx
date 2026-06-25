"use client";

import React, { useState, useEffect } from 'react';
import { backendApi } from '../../../shared/api/client';
import { UserStatus, UserType } from '../../../shared/constants/enums';
import Spinner from '../../../shared/ui/Spinner';

export default function StoreStaff() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);

  // Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('ALL');
  const [searchRole, setSearchRole] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    userType: UserType.STAFF,
    status: UserStatus.ACTIVE,
  });
  const [initialFormData, setInitialFormData] = useState<any>(null);

  useEffect(() => {
    const sId = localStorage.getItem('logged_store_id');
    setStoreId(sId);
    if (sId) {
      fetchUsers(sId);
    }
  }, []);

  const fetchUsers = async (sId: string) => {
    setLoading(true);
    try {
      const res = await backendApi.get(`/stores/${sId}/staff`);
      setUsers(res.data?.content || res.data || []);
    } catch (err) {
      console.error('Failed to fetch staff', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    const initData = {
      loginId: '',
      password: '',
      userType: UserType.STAFF,
      status: UserStatus.ACTIVE,
    };
    setFormData(initData);
    setInitialFormData(initData);
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    const initData = {
      loginId: user.loginId || '',
      password: '', // Leave blank for edit unless changing
      userType: UserType.STAFF,
      status: user.status || UserStatus.ACTIVE,
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

  const handleSaveUser = async () => {
    try {
      const payload = {
        ...formData,
        name: formData.loginId
      };
      if (!storeId) return;
      if (editingUser) {
        await backendApi.put(`/admin/staff/${editingUser.userId}`, payload); // 삭제 권한 등은 admin에서 처리하거나 API 추가 필요 (일단 백엔드 추가 없이 생성만 추가함)
        alert('계정 정보가 수정되었습니다.');
      } else {
        if (!formData.password) {
          alert('신규 계정 생성 시 비밀번호는 필수입니다.');
          return;
        }
        await backendApi.post(`/stores/${storeId}/staff`, payload);
        alert('신규 계정이 생성되었습니다.');
      }
      setIsModalOpen(false);
      fetchUsers(storeId);
    } catch (err) {
      console.error(err);
      alert('저장 실패');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('정말로 이 계정을 삭제하시겠습니까?')) {
      try {
        await backendApi.delete(`/admin/staff/${userId}`);
        alert('계정이 삭제되었습니다.');
        if (storeId) fetchUsers(storeId);
      } catch (err) {
        console.error(err);
        alert('삭제 실패');
      }
    }
  };

  const handleUpdateRole = async (userId: number, newRole: string) => {
    try {
      await backendApi.put(`/admin/staff/${userId}/role?role=${newRole}`);
      setUsers(users.map(u => u.userId === userId ? { ...u, userType: newRole } : u));
    } catch (err) {
      console.error('Failed to update role', err);
      alert('권한 변경 실패');
    }
  };

  const handleUpdateStatus = async (userId: number, newStatus: string) => {
    try {
      await backendApi.put(`/admin/staff/${userId}/status?status=${newStatus}`);
      setUsers(users.map(u => u.userId === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error('Failed to update status', err);
      alert('상태 변경 실패');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesQuery = !searchQuery || 
      (user.loginId && user.loginId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = searchStatus === 'ALL' || user.status === searchStatus;
    const matchesRole = searchRole === 'ALL' || user.userType === searchRole;

    return matchesQuery && matchesStatus && matchesRole;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">가맹점 직원 계정 관리</h2>
        <button 
          onClick={openAddModal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          새 직원 생성
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 whitespace-nowrap">검색:</span>
          <input 
            type="text" 
            placeholder="사용자명(로그인 아이디) 검색" 
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
            <option value={UserStatus.ACTIVE}>활성</option>
            <option value={UserStatus.LOCKED}>잠금</option>
            <option value={UserStatus.WITHDRAWN}>탈퇴</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 whitespace-nowrap">권한 필터:</span>
          <select 
            value={searchRole} 
            onChange={(e) => setSearchRole(e.target.value)}
            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">전체 보기</option>
            <option value={UserType.STAFF}>가맹점직원</option>
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
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">사용자 로그인 아이디</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">권한(Role)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">상태</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">가입일</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.map(user => (
                  <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500 font-medium">#{user.userId}</td>
                    <td className="p-4 font-bold text-slate-900">{user.loginId}</td>
                    <td className="p-4 text-center">
                      <select 
                        value={user.userType} 
                        onChange={(e) => handleUpdateRole(user.userId, e.target.value)}
                        className={`p-1.5 text-xs font-bold rounded-md border outline-none ${
                          user.userType === UserType.ADMIN ? 'bg-purple-50 border-purple-200 text-purple-700 focus:ring-purple-500' :
                          user.userType === UserType.OWNER ? 'bg-blue-50 border-blue-200 text-blue-700 focus:ring-blue-500' :
                          'bg-slate-50 border-slate-200 text-slate-600 focus:ring-slate-500'
                        }`}
                      >
                        <option value={UserType.STAFF}>가맹점직원</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <select 
                        value={user.status} 
                        onChange={(e) => handleUpdateStatus(user.userId, e.target.value)}
                        className={`p-1.5 text-xs font-bold rounded-md border outline-none ${
                          user.status === UserStatus.ACTIVE ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500' :
                          user.status === UserStatus.LOCKED ? 'bg-amber-50 border-amber-200 text-amber-700 focus:ring-amber-500' :
                          'bg-rose-50 border-rose-200 text-rose-700 focus:ring-rose-500'
                        }`}
                      >
                        <option value={UserStatus.ACTIVE}>활성</option>
                        <option value={UserStatus.LOCKED}>잠금</option>
                        <option value={UserStatus.WITHDRAWN}>탈퇴</option>
                      </select>
                    </td>
                    <td className="p-4 text-slate-500">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</td>
                    <td className="p-4 flex justify-center items-center gap-2">
                      <button 
                        onClick={() => openEditModal(user)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-md transition-colors text-xs"
                      >
                        수정
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.userId)}
                        className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold rounded-md transition-colors text-xs"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-10 text-slate-500 font-medium">조회된 계정이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={handleBackdropClick}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">{editingUser ? '직원 계정 수정' : '신규 직원 계정 생성'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1 font-bold text-slate-700 text-sm">사용자 로그인 아이디</label>
                  <input 
                    type="text" 
                    value={formData.loginId} 
                    onChange={e => setFormData({...formData, loginId: e.target.value})}
                    placeholder="admin"
                    disabled={!!editingUser}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700 text-sm">
                    비밀번호 {editingUser && <span className="text-slate-400 font-normal text-xs">(변경할 경우에만 입력)</span>}
                  </label>
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder={editingUser ? "변경 시 입력" : "비밀번호 입력"}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700 text-sm">권한(Role)</label>
                  <select 
                    value={UserType.STAFF} 
                    disabled
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-500 outline-none"
                  >
                    <option value={UserType.STAFF}>가맹점직원</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700 text-sm">상태</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as UserStatus})}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value={UserStatus.ACTIVE}>활성</option>
                    <option value={UserStatus.LOCKED}>잠금</option>
                    <option value={UserStatus.WITHDRAWN}>탈퇴</option>
                  </select>
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
                onClick={handleSaveUser}
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
