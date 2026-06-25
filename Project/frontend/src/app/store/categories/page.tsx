"use client";

import React, { useState, useEffect } from 'react';
import { backendApi } from '../../../shared/api/client';
import { LocalMenu } from '../menus/page';

interface Category {
  categoryId: number;
  name: string;
}

export default function StoreCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // Delete Reassignment Modal State
  const [deleteCandidate, setDeleteCandidate] = useState<Category | null>(null);
  const [affectedMenus, setAffectedMenus] = useState<any[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [menuReassignments, setMenuReassignments] = useState<Record<number, number>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const storeId = localStorage.getItem('logged_store_id') || '1';
      const res = await backendApi.get(`/categories/store/${storeId}`);
      const data = res.data?.content || res.data || [];
      setCategories(data.map((c: any) => ({ categoryId: Number(c.categoryId), name: c.name })));
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const storeId = localStorage.getItem('logged_store_id') || '1';
      await backendApi.post(`/categories/store/${storeId}`, { name: newCategoryName.trim() });
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('카테고리 추가에 실패했습니다.');
    }
  };

  const handleUpdateCategory = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await backendApi.put(`/categories/${id}`, { name: editName.trim() });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('카테고리 수정에 실패했습니다.');
    }
  };

  const handleDeleteRequest = async (category: Category) => {
    try {
      // Check if there are menus using this category
      const storeId = localStorage.getItem('logged_store_id') || '1';
      const res = await backendApi.get(`/stores/${storeId}/menus`);
      const allMenus = res.data?.content || res.data || [];
      const usingMenus = allMenus.filter((m: any) => Number(m.categoryId) === category.categoryId);

      if (usingMenus.length > 0) {
        setAffectedMenus(usingMenus);
        setDeleteCandidate(category);
        const availableCategories = categories.filter(c => c.categoryId !== category.categoryId);
        if (availableCategories.length > 0) {
          const initialMap: Record<number, number> = {};
          usingMenus.forEach((m: any) => initialMap[m.menuId || m.id] = availableCategories[0].categoryId);
          setMenuReassignments(initialMap);
        } else {
          setMenuReassignments({});
        }
        setIsDeleteModalOpen(true);
      } else {
        if (confirm(`'${category.name}' 카테고리를 삭제하시겠습니까?`)) {
          await backendApi.delete(`/categories/${category.categoryId}`);
          fetchCategories();
        }
      }
    } catch (err) {
      console.error(err);
      alert('메뉴 데이터를 불러오는 데 실패했습니다.');
    }
  };

  const executeDeleteAndReassign = async () => {
    if (!deleteCandidate || Object.keys(menuReassignments).length === 0) {
      alert('이동할 카테고리를 선택해주세요.');
      return;
    }
    
    setIsDeleting(true);
    try {
      // 1. Reassign affected menus
      for (const menu of affectedMenus) {
        const payload = {
          categoryId: menuReassignments[menu.menuId || menu.id],
          name: menu.name,
          price: menu.price,
          description: menu.description,
          status: menu.status, // We use existing status
          metadata: menu.metadata // We keep existing metadata
        };
        const storeId = localStorage.getItem('logged_store_id') || '1';
        await backendApi.put(`/stores/${storeId}/menus/${menu.menuId || menu.id}`, payload);
      }

      // 2. Delete the category
      await backendApi.delete(`/categories/${deleteCandidate.categoryId}`);
      
      alert('카테고리가 삭제되고 관련 메뉴들이 정상적으로 이동되었습니다.');
      setIsDeleteModalOpen(false);
      setDeleteCandidate(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('삭제 또는 이동 처리 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">카테고리 관리</h2>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">새 카테고리 추가</h3>
        <div className="flex gap-4">
          <input 
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="예: 추천 메뉴, 커피, 에이드"
            className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-medium text-slate-800"
          />
          <button 
            onClick={handleAddCategory}
            className="px-6 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-colors whitespace-nowrap"
          >
            추가하기
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm uppercase font-bold text-slate-500 tracking-wider">
                <th className="p-4 w-20 text-center">ID</th>
                <th className="p-4">카테고리명</th>
                <th className="p-4 text-center w-40">관리</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.categoryId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-center font-medium text-slate-500">{c.categoryId}</td>
                  <td className="p-4">
                    {editingId === c.categoryId ? (
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full max-w-sm p-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{c.name}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === c.categoryId ? (
                        <>
                          <button 
                            onClick={() => handleUpdateCategory(c.categoryId)}
                            className="text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors"
                          >
                            저장
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="text-sm font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => { setEditingId(c.categoryId); setEditName(c.name); }}
                            className="text-sm font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            수정
                          </button>
                          <button 
                            onClick={() => handleDeleteRequest(c)}
                            className="text-sm font-bold bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-slate-400 font-medium">등록된 카테고리가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Reassignment Modal */}
      {isDeleteModalOpen && deleteCandidate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsDeleteModalOpen(false); }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 bg-rose-50">
              <h3 className="text-xl font-bold text-rose-800">카테고리 삭제 경고</h3>
            </div>
            
            <div className="p-6">
              <p className="text-slate-700 mb-4 leading-relaxed">
                <strong className="text-slate-900">'{deleteCandidate.name}'</strong> 카테고리에 속한 메뉴가 <strong className="text-rose-600">{affectedMenus.length}개</strong> 있습니다. 카테고리를 삭제하려면 이 메뉴들을 다른 카테고리로 이동해야 합니다.
              </p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {affectedMenus.map((m: any) => (
                  <div key={m.menuId || m.id} className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                    <span className="font-bold text-slate-700">{m.name}</span>
                    {categories.length > 1 ? (
                      <select
                        value={menuReassignments[m.menuId || m.id] || ''}
                        onChange={(e) => setMenuReassignments({...menuReassignments, [m.menuId || m.id]: Number(e.target.value)})}
                        className="w-40 p-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-rose-500 font-medium"
                      >
                        {categories.filter(c => c.categoryId !== deleteCandidate.categoryId).map(c => (
                          <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ))}
              </div>

              {categories.length > 1 ? (
                <div className="mb-4 p-4 border border-blue-200 bg-blue-50 rounded-xl flex items-center justify-between gap-4">
                  <span className="font-bold text-sm text-blue-800 shrink-0">모든 메뉴 일괄 이동:</span>
                  <select 
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const newMap = { ...menuReassignments };
                      affectedMenus.forEach((m: any) => newMap[m.menuId || m.id] = val);
                      setMenuReassignments(newMap);
                    }}
                    className="flex-1 p-2 rounded-lg border border-blue-300 outline-none focus:border-blue-500 font-medium bg-white"
                  >
                    <option value="" disabled selected>카테고리 선택...</option>
                    {categories.filter(c => c.categoryId !== deleteCandidate.categoryId).map(c => (
                      <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 font-medium text-sm mb-4">
                  이동할 다른 카테고리가 없습니다. 먼저 새로운 카테고리를 생성해주세요.
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors outline-none"
              >
                취소
              </button>
              <button 
                onClick={executeDeleteAndReassign}
                disabled={isDeleting || categories.length <= 1}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 outline-none flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    처리 중...
                  </>
                ) : '이동 및 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
