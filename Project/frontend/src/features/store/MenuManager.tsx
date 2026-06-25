"use client";
import React, { useState, useEffect } from 'react';
import { backendApi } from '../../shared/api/client';
import Spinner from '../../shared/ui/Spinner';

interface Menu {
  menuId: number;
  categoryId: number;
  name: string;
  price: number;
  status: string;
  description: string;
  metadata: string;
}

export const MenuManager: React.FC<{ storeId: number }> = ({ storeId }) => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    description: '',
    status: 'ON_SALE',
    metadata: ''
  });

  useEffect(() => {
    fetchMenus();
  }, [storeId]);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await backendApi.get(`/stores/${storeId}/menus?size=100`);
      setMenus(res.data?.content || res.data || []);
    } catch (err) {
      console.error('Failed to fetch menus', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (menu?: Menu) => {
    if (menu) {
      setEditingMenu(menu);
      setFormData({
        name: menu.name,
        price: menu.price,
        description: menu.description || '',
        status: menu.status,
        metadata: menu.metadata || ''
      });
    } else {
      setEditingMenu(null);
      setFormData({
        name: '',
        price: 0,
        description: '',
        status: 'ON_SALE',
        metadata: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMenu(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMenu) {
        await backendApi.put(`/stores/${storeId}/menus/${editingMenu.menuId}`, formData);
      } else {
        await backendApi.post(`/stores/${storeId}/menus`, formData);
      }
      closeModal();
      fetchMenus();
    } catch (err) {
      console.error('Failed to save menu', err);
      alert('메뉴 저장에 실패했습니다.');
    }
  };

  const toggleStatus = async (menu: Menu) => {
    const newStatus = menu.status === 'SOLD_OUT' ? 'ON_SALE' : 'SOLD_OUT';
    const payload = {
      name: menu.name,
      price: menu.price,
      description: menu.description,
      status: newStatus,
      metadata: menu.metadata
    };
    try {
      await backendApi.put(`/stores/${storeId}/menus/${menu.menuId}`, payload);
      setMenus(menus.map(m => m.menuId === menu.menuId ? { ...m, status: newStatus } : m));
    } catch (err) {
      console.error('Failed to update status', err);
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  const deleteMenu = async (menuId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await backendApi.delete(`/stores/${storeId}/menus/${menuId}`);
      setMenus(menus.filter(m => m.menuId !== menuId));
    } catch (err) {
      console.error('Failed to delete menu', err);
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col min-w-0 mt-8 relative overflow-hidden">
      
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          메뉴 관리
        </h3>
        <button 
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-blue-500/50 outline-none flex items-center gap-2 text-sm" 
          onClick={() => openModal()}
        >
          <span className="text-lg leading-none">+</span> 신규 등록
        </button>
      </div>
      
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner size={40} color="#2563eb" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-xl border border-slate-200 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center w-16">ID</th>
                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">메뉴명</th>
                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">가격</th>
                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">상태</th>
                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">상세설명</th>
                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-right pr-6">작업</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {menus.map(menu => (
                <tr key={menu.menuId} className={`hover:bg-slate-50 transition-colors ${menu.status === 'SOLD_OUT' ? 'bg-slate-50/50 opacity-70' : ''}`}>
                  <td className="p-4 text-center text-slate-400 font-medium">#{menu.menuId}</td>
                  <td className="p-4 font-bold text-slate-900">{menu.name}</td>
                  <td className="p-4 text-slate-700 font-bold">{menu.price.toLocaleString()}원</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md inline-block ${
                      menu.status === 'ON_SALE' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {menu.status === 'ON_SALE' ? '판매중' : '품절'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 truncate max-w-[200px]">{menu.description || '-'}</td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <button 
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors focus:outline-none focus:ring-2 ${
                          menu.status === 'SOLD_OUT' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 focus:ring-emerald-500/50' 
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500/50'
                        }`}
                        onClick={() => toggleStatus(menu)}
                      >
                        {menu.status === 'SOLD_OUT' ? '판매 재개' : '품절 처리'}
                      </button>
                      <button 
                        className="px-3 py-1.5 bg-white text-blue-600 border border-slate-300 hover:border-blue-300 hover:bg-blue-50 rounded-md text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                        onClick={() => openModal(menu)}
                      >
                        수정
                      </button>
                      <button 
                        className="px-3 py-1.5 bg-white text-rose-600 border border-slate-300 hover:border-rose-300 hover:bg-rose-50 rounded-md text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/50" 
                        onClick={() => deleteMenu(menu.menuId)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {menus.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-slate-500 font-medium">등록된 메뉴가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Menu Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h4 className="text-lg font-bold text-slate-900">{editingMenu ? '메뉴 수정' : '신규 메뉴 등록'}</h4>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">메뉴명</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm"
                  placeholder="예: 아메리카노"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">가격</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">상태</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm bg-white"
                >
                  <option value="ON_SALE">판매중</option>
                  <option value="SOLD_OUT">품절</option>
                  <option value="HIDDEN">숨김</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">상세설명</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm h-20 resize-none"
                  placeholder="메뉴에 대한 설명을 입력하세요"
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500/50 text-sm transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 border border-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
