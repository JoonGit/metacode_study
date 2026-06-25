"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { backendApi } from '../../../shared/api/client';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../../shared/util/cropImage';

const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2'/%3E%3Cpath d='M7 2v20'/%3E%3Cpath d='M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'/%3E%3C/svg%3E";

export interface LocalMenu {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  isSoldOut: boolean;
  aiKeywords: string[];
  nutrition?: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  } | null;
}

export default function StoreMenus() {
  const [activeTab, setActiveTab] = useState<'LIST' | 'REGISTER'>('LIST');
  const [menus, setMenus] = useState<LocalMenu[]>([]);
  const [categories, setCategories] = useState<{categoryId: number, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // List Filters
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states (used for both Edit Modal and Register Tab)
  const [formData, setFormData] = useState<LocalMenu>({
    id: 0,
    categoryId: 1,
    name: '',
    price: 0,
    imageUrl: DEFAULT_IMAGE,
    description: '',
    isSoldOut: false,
    aiKeywords: [],
    nutrition: null,
  });
  const [initialFormData, setInitialFormData] = useState<LocalMenu | null>(null);
  const [keywordInput, setKeywordInput] = useState('');

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    message: string;
    type?: 'SUCCESS' | 'WARNING' | 'DANGER' | 'CONFIRM';
    onConfirm?: () => void;
  }>({ isOpen: false, message: '', type: 'SUCCESS' });

  // Cropper States
  const [showCropper, setShowCropper] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setCropSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
      setShowCropper(true);
      e.target.value = '';
    }
  };

  const handleUploadCroppedImage = async () => {
    try {
      if (!cropSrc || !croppedAreaPixels) return;
      setIsUploading(true);
      const croppedImage = await getCroppedImg(cropSrc, croppedAreaPixels);
      if (croppedImage) {
        const uploadData = new FormData();
        uploadData.append('file', croppedImage, 'menu.jpg');
        const res = await backendApi.post('/uploads', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
        setShowCropper(false);
        setCropSrc(null);
      }
    } catch (e) {
      console.error(e);
      setCustomAlert({isOpen: true, message: '이미지 편집 및 업로드 중 오류가 발생했습니다.', type: 'DANGER'});
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setIsLoading(true);
      const storeId = localStorage.getItem('logged_store_id') || '1';
      const [catRes, menuRes] = await Promise.all([
        backendApi.get(`/categories/store/${storeId}`),
        backendApi.get(`/stores/${storeId}/menus`)
      ]);
      const fetchedCategories = (catRes.data?.content || catRes.data || []).map((c: any) => ({
        categoryId: Number(c.categoryId),
        name: c.name
      }));
      setCategories(fetchedCategories);

      const fetchedMenus = (menuRes.data?.content || menuRes.data || []).map((m: any) => ({
        id: m.menuId,
        categoryId: m.categoryId ? Number(m.categoryId) : 1,
        name: m.name,
        price: m.price,
        imageUrl: m.metadata && JSON.parse(m.metadata).imageUrl ? JSON.parse(m.metadata).imageUrl : DEFAULT_IMAGE,
        description: m.description,
        isSoldOut: m.status === 'SOLD_OUT',
        aiKeywords: m.metadata && JSON.parse(m.metadata).aiKeywords ? JSON.parse(m.metadata).aiKeywords : [],
        nutrition: m.nutrition ? JSON.parse(m.nutrition) : null
      }));
      setMenus(fetchedMenus);
    } catch (err) {
      console.error('Failed to fetch store data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMenu = async (isNew: boolean) => {
    if (!formData.name.trim()) {
      setCustomAlert({isOpen: true, message: '메뉴명을 입력해주세요.', type: 'WARNING'});
      return;
    }
    if (formData.price <= 0) {
      setCustomAlert({isOpen: true, message: '메뉴 가격은 0원보다 커야 합니다.', type: 'WARNING'});
      return;
    }

    try {
      const payload = {
        categoryId: formData.categoryId,
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        status: formData.isSoldOut ? 'SOLD_OUT' : 'ON_SALE',
        metadata: JSON.stringify({ aiKeywords: formData.aiKeywords, imageUrl: formData.imageUrl }),
        nutrition: formData.nutrition ? JSON.stringify(formData.nutrition) : null
      };
      
      const storeId = localStorage.getItem('logged_store_id') || '1';
      if (isNew) {
        await backendApi.post(`/stores/${storeId}/menus`, payload);
        setCustomAlert({isOpen: true, message: '메뉴가 등록되었습니다.', type: 'SUCCESS'});
        setFormData({
          id: 0, categoryId: 1, name: '', price: 0, 
          imageUrl: DEFAULT_IMAGE, 
          description: '', isSoldOut: false, aiKeywords: [], nutrition: null
        });
        setActiveTab('LIST');
        fetchMenus();
      } else {
        await backendApi.put(`/stores/${storeId}/menus/${formData.id}`, payload);
        setCustomAlert({isOpen: true, message: '메뉴가 수정되었습니다.', type: 'SUCCESS'});
        setIsEditModalOpen(false);
        fetchMenus();
      }
    } catch (err) {
      console.error(err);
      setCustomAlert({isOpen: true, message: '저장에 실패했습니다.', type: 'DANGER'});
    }
  };

  const handleDeleteMenu = () => {
    setCustomAlert({
      isOpen: true,
      message: '정말로 이 메뉴를 삭제하시겠습니까?',
      type: 'CONFIRM',
      onConfirm: async () => {
        try {
          const storeId = localStorage.getItem('logged_store_id') || '1';
          await backendApi.delete(`/stores/${storeId}/menus/${formData.id}`);
          setCustomAlert({isOpen: true, message: '메뉴가 삭제되었습니다.', type: 'SUCCESS'});
          setIsEditModalOpen(false);
          fetchMenus();
        } catch (err) {
          console.error(err);
          setCustomAlert({isOpen: true, message: '삭제에 실패했습니다.', type: 'DANGER'});
        }
      }
    });
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = keywordInput.trim();
      if (!val) return;
      
      const currentKeywords = formData.aiKeywords || [];
      if (!currentKeywords.includes(val)) {
        setFormData({...formData, aiKeywords: [...currentKeywords, val]});
      }
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    const currentKeywords = formData.aiKeywords || [];
    setFormData({...formData, aiKeywords: currentKeywords.filter(k => k !== keywordToRemove)});
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (JSON.stringify(formData) !== JSON.stringify(initialFormData)) {
        if (!window.confirm('작성 중인 내용이 지워집니다. 닫으시겠습니까?')) {
          return;
        }
      }
      setIsEditModalOpen(false);
    }
  };

  const filteredMenus = menus.filter(m => {
    if (categoryFilter !== 'ALL' && m.categoryId !== categoryFilter) return false;
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderForm = (isNew: boolean) => (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <label className="block mb-2 font-bold text-slate-700 text-sm">메뉴명</label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-medium text-slate-800" 
          />
        </div>
        <div className="flex-1">
          <label className="block mb-2 font-bold text-slate-700 text-sm">가격 (원)</label>
          <input 
            type="number" 
            value={formData.price} 
            onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} 
            className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-medium text-slate-800" 
          />
        </div>
      </div>

      <div>
        <label className="block mb-2 font-bold text-slate-700 text-sm">카테고리</label>
        <select 
          value={formData.categoryId}
          onChange={(e) => setFormData({...formData, categoryId: Number(e.target.value)})}
          className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-medium text-slate-800 bg-white"
        >
          {categories.map(c => (
            <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-2 font-bold text-slate-700 text-sm">메뉴 이미지 (1:1 비율)</label>
        <div className="flex gap-4">
          <img 
            src={formData.imageUrl} 
            alt="미리보기" 
            onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE; }}
            className="w-24 h-24 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100 p-2"
          />
          <div className="flex-1 flex flex-col justify-center">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange} 
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 text-sm transition-all text-slate-600" 
            />
            <p className="text-xs text-slate-500 mt-2">파일을 선택하면 1:1 비율로 자를 수 있습니다.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <label className="font-bold text-slate-700 text-sm">판매 상태</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium hover:text-emerald-600 transition-colors">
            <input 
              type="radio" 
              name={`status-${isNew ? 'new' : 'edit'}`} 
              checked={!formData.isSoldOut} 
              onChange={() => setFormData({...formData, isSoldOut: false})} 
              className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-slate-300"
            /> 판매중
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium hover:text-rose-600 transition-colors">
            <input 
              type="radio" 
              name={`status-${isNew ? 'new' : 'edit'}`} 
              checked={formData.isSoldOut} 
              onChange={() => setFormData({...formData, isSoldOut: true})} 
              className="w-4 h-4 text-rose-500 focus:ring-rose-500 border-slate-300"
            /> 품절
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <label className="flex items-center gap-3 font-bold text-slate-700 text-sm cursor-pointer hover:text-emerald-600 transition-colors">
          <input 
            type="checkbox" 
            checked={!!formData.nutrition} 
            onChange={(e) => {
              if (e.target.checked) {
                setFormData({...formData, nutrition: { kcal: 0, protein: 0, fat: 0, carbs: 0 }});
              } else {
                setFormData({...formData, nutrition: null});
              }
            }} 
            className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-slate-300 rounded"
          /> 
          영양성분 추가하기
        </label>

        {formData.nutrition && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="block mb-1 text-xs font-bold text-slate-500">에너지 (kcal)</label>
              <input type="number" value={formData.nutrition.kcal} onChange={(e) => setFormData({...formData, nutrition: { ...formData.nutrition!, kcal: Number(e.target.value) }})} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-500 font-medium text-slate-800" />
            </div>
            <div>
              <label className="block mb-1 text-xs font-bold text-slate-500">단백질 (g)</label>
              <input type="number" value={formData.nutrition.protein} onChange={(e) => setFormData({...formData, nutrition: { ...formData.nutrition!, protein: Number(e.target.value) }})} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-500 font-medium text-slate-800" />
            </div>
            <div>
              <label className="block mb-1 text-xs font-bold text-slate-500">지방 (g)</label>
              <input type="number" value={formData.nutrition.fat} onChange={(e) => setFormData({...formData, nutrition: { ...formData.nutrition!, fat: Number(e.target.value) }})} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-500 font-medium text-slate-800" />
            </div>
            <div>
              <label className="block mb-1 text-xs font-bold text-slate-500">탄수화물 (g)</label>
              <input type="number" value={formData.nutrition.carbs} onChange={(e) => setFormData({...formData, nutrition: { ...formData.nutrition!, carbs: Number(e.target.value) }})} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-500 font-medium text-slate-800" />
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-3">
          <label className="flex items-center gap-2 font-bold text-slate-700 text-sm mb-1">
            <span className="text-xl">✨</span> AI 추천 키워드 (해시태그)
          </label>
          <p className="text-xs text-slate-500 font-medium">입력 후 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md">Enter</kbd>를 누르세요.</p>
        </div>
        <input 
          type="text" 
          placeholder="예: 여름추천" 
          value={keywordInput}
          onChange={e => setKeywordInput(e.target.value)}
          onKeyDown={handleKeywordKeyDown}
          className="w-full p-3 rounded-xl border border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all font-medium text-slate-800 bg-violet-50/30 placeholder-slate-400" 
        />
        <div className="flex flex-wrap gap-2 mt-4">
          {(formData.aiKeywords || []).map(keyword => (
            <span 
              key={keyword} 
              onClick={() => handleRemoveKeyword(keyword)}
              className="bg-violet-100 hover:bg-rose-100 hover:text-rose-700 text-violet-700 px-3 py-1.5 rounded-full text-sm font-bold cursor-pointer transition-colors flex items-center gap-1 group"
            >
              #{keyword} 
              <svg className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-6 border-t-2 border-slate-50">
        {!isNew && (
          <button 
            type="button" 
            onClick={handleDeleteMenu} 
            className="px-6 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded-xl transition-colors focus:ring-2 focus:ring-rose-300 outline-none"
          >
            삭제
          </button>
        )}
        <button 
          type="button" 
          onClick={() => handleSaveMenu(isNew)} 
          className="px-8 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-colors focus:ring-4 focus:ring-emerald-200 outline-none"
        >
          {isNew ? '등록하기' : '수정하기'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-6 w-full font-sans h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">메뉴 관리</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('LIST')}
          className={`py-4 px-8 font-bold text-lg border-b-4 transition-colors ${activeTab === 'LIST' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          메뉴 목록
        </button>
        <button
          onClick={() => {
            setActiveTab('REGISTER');
            setFormData({
              id: 0, categoryId: 1, name: '', price: 0, 
              imageUrl: DEFAULT_IMAGE, 
              description: '', isSoldOut: false, aiKeywords: [], nutrition: null
            });
            setKeywordInput('');
          }}
          className={`py-4 px-8 font-bold text-lg border-b-4 transition-colors ${activeTab === 'REGISTER' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          메뉴 등록
        </button>
      </div>

      {activeTab === 'LIST' && (
        <div className="flex flex-col gap-6 flex-1 overflow-hidden">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 flex-1">
              <span className="font-bold text-slate-700 whitespace-nowrap">카테고리:</span>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="p-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full sm:w-auto min-w-[150px]"
              >
                <option value="ALL">전체 보기</option>
                {categories.map(c => (
                  <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 flex-1">
              <span className="font-bold text-slate-700 whitespace-nowrap">검색:</span>
              <input 
                type="text" 
                placeholder="메뉴명 검색" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
              </div>
            ) : filteredMenus.length === 0 ? (
              <div className="text-center p-10 text-slate-500 font-medium">해당 조건의 메뉴가 없습니다.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMenus.map(menu => (
                  <div 
                    key={menu.id}
                    onClick={() => {
                      setFormData(menu);
                      setInitialFormData(menu);
                      setKeywordInput('');
                      setIsEditModalOpen(true);
                    }}
                    className="flex items-center p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all bg-white group"
                  >
                    <img 
                      src={menu.imageUrl} 
                      alt="" 
                      className="w-20 h-20 rounded-xl object-cover bg-slate-100 mr-4 shadow-sm group-hover:scale-105 transition-transform" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-lg text-slate-800 truncate mb-1">{menu.name}</div>
                      <div className="text-emerald-600 font-extrabold">{menu.price.toLocaleString()}원</div>
                    </div>
                    <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ml-2 shrink-0 ${menu.isSoldOut ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                      {menu.isSoldOut ? '품절' : '판매중'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'REGISTER' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
          <h3 className="text-xl font-bold text-slate-800 mb-8 pb-4 border-b border-slate-100">새 메뉴 등록</h3>
          {renderForm(true)}
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-slate-900">메뉴 수정</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {renderForm(false)}
            </div>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {showCropper && cropSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowCropper(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[500px]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-slate-900">이미지 편집</h3>
              <button onClick={() => setShowCropper(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 relative w-full bg-slate-100">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-4 border-t border-slate-200 bg-white">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full mb-4"
              />
              <button 
                onClick={handleUploadCroppedImage}
                disabled={isUploading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isUploading ? '업로드 중...' : '적용하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {customAlert.isOpen && (() => {
        const getAlertStyles = () => {
          switch (customAlert.type) {
            case 'WARNING':
              return {
                title: '경고',
                iconBg: 'bg-amber-100',
                iconColor: 'text-amber-600',
                btnBg: 'bg-amber-600 hover:bg-amber-700',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )
              };
            case 'DANGER':
              return {
                title: '위험',
                iconBg: 'bg-rose-100',
                iconColor: 'text-rose-600',
                btnBg: 'bg-rose-600 hover:bg-rose-700',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )
              };
            case 'CONFIRM':
              return {
                title: '확인',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                btnBg: 'bg-blue-600 hover:bg-blue-700',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              };
            case 'SUCCESS':
            default:
              return {
                title: '완료',
                iconBg: 'bg-emerald-100',
                iconColor: 'text-emerald-600',
                btnBg: 'bg-slate-900 hover:bg-slate-800',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )
              };
          }
        };

        const alertStyles = getAlertStyles();
        const isConfirm = customAlert.type === 'CONFIRM';

        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={(e) => { if (e.target === e.currentTarget) setCustomAlert({isOpen: false, message: '', type: 'SUCCESS'}); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-8 animate-in fade-in zoom-in duration-300">
              <div className={`w-16 h-16 ${alertStyles.iconBg} ${alertStyles.iconColor} rounded-full flex items-center justify-center mb-6`}>
                {alertStyles.icon}
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{alertStyles.title}</h2>
              <p className="text-slate-600 mb-8 font-medium">{customAlert.message}</p>
              
              {isConfirm ? (
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setCustomAlert({isOpen: false, message: '', type: 'SUCCESS'})}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                  >
                    취소
                  </button>
                  <button 
                    onClick={() => {
                      setCustomAlert({isOpen: false, message: '', type: 'SUCCESS'});
                      customAlert.onConfirm?.();
                    }}
                    className={`flex-1 py-4 ${alertStyles.btnBg} text-white font-bold rounded-xl transition-colors shadow-sm`}
                  >
                    확인
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setCustomAlert({isOpen: false, message: '', type: 'SUCCESS'})}
                  className={`w-full py-4 ${alertStyles.btnBg} text-white font-bold rounded-xl transition-colors shadow-sm`}
                >
                  확인
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
