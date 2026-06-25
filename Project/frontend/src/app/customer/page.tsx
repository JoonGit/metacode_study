"use client";

import React, { useState, useEffect } from 'react';
import { backendApi } from '../../shared/api/client';
import Spinner from '../../shared/ui/Spinner';

const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2'/%3E%3Cpath d='M7 2v20'/%3E%3Cpath d='M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'/%3E%3C/svg%3E";

export default function CustomerKiosk() {
  const [categories, setCategories] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI Chat states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user'|'ai', text: string}>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // Admin mode states
  const [storeId, setStoreId] = useState<number | null>(null);
  const [adminModalState, setAdminModalState] = useState<'CLOSED' | 'PIN' | 'STORE_ID'>('CLOSED');
  const [pinInput, setPinInput] = useState('');
  const [storeIdInput, setStoreIdInput] = useState('');
  const [clickCount, setClickCount] = useState(0);

  const userId = 1; // dummy user for now

  // Checkout states
  const [checkoutStep, setCheckoutStep] = useState<'NONE' | 'PHONE' | 'PAYMENT'>('NONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);


  useEffect(() => {
    const savedStoreId = localStorage.getItem('KIOSK_STORE_ID');
    if (savedStoreId) {
      setStoreId(Number(savedStoreId));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (storeId !== null) {
      fetchData();
    }
  }, [storeId]);

  useEffect(() => {
    if (clickCount > 0) {
      const timer = setTimeout(() => setClickCount(0), 1000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 >= 5) {
      setAdminModalState('STORE_ID');
      setStoreIdInput(storeId?.toString() || '');
      setClickCount(0);
    }
  };

  const handleStoreIdSubmit = () => {
    const newStoreId = Number(storeIdInput);
    if (newStoreId > 0) {
      setAdminModalState('PIN');
      setPinInput('');
    } else {
      alert('올바른 Store ID를 입력해주세요.');
    }
  };

  const handlePinSubmit = async () => {
    if (!pinInput) return;
    try {
      const newStoreId = Number(storeIdInput);
      const res = await backendApi.post(`/stores/${newStoreId}/verify-pin`, { pin: pinInput });
      if (res.data === true) {
        localStorage.setItem('KIOSK_STORE_ID', newStoreId.toString());
        setStoreId(newStoreId);
        setAdminModalState('CLOSED');
      } else {
        alert('비밀번호가 틀렸습니다.');
        setPinInput('');
      }
    } catch (err) {
      console.error('Verify PIN failed', err);
      alert('비밀번호 확인 중 오류가 발생했습니다.');
    }
  };

  const fetchData = async () => {
    if (storeId === null) return;
    try {
      setLoading(true);
      const [catRes, menuRes] = await Promise.all([
        backendApi.get(`/categories/store/${storeId}`),
        backendApi.get(`/stores/${storeId}/menus`)
      ]);
      const fetchedCategories = (catRes.data?.content || catRes.data || []).filter((c: any) => c.name !== '추천 메뉴').map((c: any) => ({
        ...c,
        categoryId: Number(c.categoryId)
      }));
      const fetchedMenus = (menuRes.data?.content || menuRes.data || []).map((m: any) => ({
        ...m,
        categoryId: m.categoryId ? Number(m.categoryId) : 1,
        imageUrl: m.metadata && JSON.parse(m.metadata).imageUrl ? JSON.parse(m.metadata).imageUrl : DEFAULT_IMAGE
      }));
      
      const allCategory = { categoryId: -1, name: '전체메뉴', displayOrder: -1 };
      setCategories([allCategory, ...fetchedCategories]);
      setMenus(fetchedMenus);
      setActiveCategory(allCategory.categoryId);
    } catch (err) {
      console.error('Failed to fetch kiosk data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (categoryId: number) => {
    if (activeCategory === categoryId) return;
    setActiveCategory(categoryId);
    setLoading(true);
    try {
      const url = categoryId === -1 
        ? `/stores/${storeId}/menus`
        : `/stores/${storeId}/menus?categoryId=${categoryId}`;
      const menuRes = await backendApi.get(url);
      const fetchedMenus = (menuRes.data?.content || menuRes.data || []).map((m: any) => ({
        ...m,
        categoryId: m.categoryId ? Number(m.categoryId) : 1,
        imageUrl: m.metadata && JSON.parse(m.metadata).imageUrl ? JSON.parse(m.metadata).imageUrl : DEFAULT_IMAGE
      }));
      setMenus(fetchedMenus);
    } catch (err) {
      console.error('Failed to fetch menus by category', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (menu: any) => {
    if (menu.status === 'SOLD_OUT') return;
    setCart(prev => {
      const existing = prev.find(item => item.menuId === menu.menuId);
      if (existing) {
        return prev.map(item => item.menuId === menu.menuId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...menu, quantity: 1, cartItemId: Date.now() }];
    });
  };

  const updateQuantity = (cartItemId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (cartItemId: number) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const handleCheckoutInit = () => {
    if (cart.length === 0) return;
    setPhoneNumber('010');
    setCheckoutStep('PHONE');
  };

  const handleNumpadClick = (val: string) => {
    if (val === 'CLEAR') {
      setPhoneNumber('010');
    } else if (val === 'BACK') {
      if (phoneNumber.length > 3) {
        setPhoneNumber(prev => prev.slice(0, -1));
      }
    } else {
      if (phoneNumber.length < 11) {
        setPhoneNumber(prev => prev + val);
      }
    }
  };

  const formatPhoneNumber = (num: string) => {
    if (num.length <= 3) return num;
    if (num.length <= 7) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7, 11)}`;
  };

  const handleCheckoutSubmit = async () => {
    setIsCheckoutLoading(true);
    try {
      const payload = {
        storeId,
        userId,
        items: cart.map(item => ({
          menuId: item.menuId,
          quantity: item.quantity,
          unitPrice: item.price,
          selectedOptions: ""
        }))
      };

      const res = await backendApi.post('/orders', payload);
      
      setCompletedOrder(res.data);
      setCart([]);
      setCheckoutStep('NONE');
      
      // Auto-close modal after 5 seconds
      setTimeout(() => {
        setCompletedOrder(null);
      }, 5000);

    } catch (err) {
      console.error('Checkout failed', err);
      alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      setCheckoutStep('NONE');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading || storeId === null) return;
    const userText = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setChatLoading(true);
    try {
      const res = await fetch('http://localhost:8000/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId, session_id: sessionId, message: userText })
      });
      const data = await res.json();
      const aiText = data.message || 'AI 응답을 받지 못했습니다.';
      setChatHistory(prev => [...prev, { role: 'ai', text: aiText }]);

      // If AI returned cart items, add them to the cart
      if (data.cart_items && data.cart_items.length > 0) {
        data.cart_items.forEach((aiItem: any) => {
          const matched = menus.find((m: any) => m.name === aiItem.name);
          if (matched) {
            addToCart(matched);
          } else if (aiItem.name) {
            // Add as a placeholder cart item
            setCart(prev => [
              ...prev,
              { 
                menuId: aiItem.menu_id || Date.now(), 
                name: aiItem.name, 
                price: aiItem.price || 0,
                quantity: aiItem.quantity || 1,
                cartItemId: Date.now() + Math.random()
              }
            ]);
          }
        });
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'AI 서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const filteredMenus = menus;
    
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-100 overflow-hidden font-sans relative">
      
      {/* AI Chat Panel (slide-up from bottom) */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-[60] transition-all duration-500 ease-out transform
        ${isChatOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'}
      `} style={{ maxHeight: '60vh' }}>
        <div className="bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 flex flex-col" style={{ height: '60vh' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" /></svg>
              </div>
              <span className="font-bold text-slate-900 text-sm">AI 주문 도우미</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {chatHistory.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-8">
                <p className="font-medium">주문하실 메뉴를 말씀해주세요.</p>
                <p className="text-xs mt-1">예: "아메리카노 두 잔 주세요", "추천 메뉴 알려줘"</p>
              </div>
            )}
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-800 rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={sendChatMessage}
              disabled={chatLoading || !chatInput.trim()}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Step 1: Phone Number Modal */}
      {checkoutStep === 'PHONE' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={(e) => { if (e.target === e.currentTarget) setCheckoutStep('NONE'); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">포인트 적립 (선택)</h2>
              <button onClick={() => setCheckoutStep('NONE')} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-slate-500 mb-6">휴대폰 번호를 입력하시면 결제 금액의 5%가 적립됩니다.</p>
            
            <div className="w-full text-center text-3xl font-bold p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 tracking-wider">
              {formatPhoneNumber(phoneNumber)}
              <span className="animate-pulse ml-1 text-blue-500">|</span>
            </div>
            
            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {['1','2','3','4','5','6','7','8','9'].map(num => (
                <button 
                  key={num} 
                  onClick={() => handleNumpadClick(num)}
                  className="py-4 text-2xl font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  {num}
                </button>
              ))}
              <button 
                onClick={() => handleNumpadClick('CLEAR')}
                className="py-4 text-lg font-bold bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 active:bg-slate-300 text-slate-600 transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={() => handleNumpadClick('0')}
                className="py-4 text-2xl font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                0
              </button>
              <button 
                onClick={() => handleNumpadClick('BACK')}
                className="py-4 flex justify-center items-center text-xl font-bold bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 active:bg-slate-300 text-slate-600 transition-colors"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCheckoutStep('PAYMENT')} className="py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors">적립 안함</button>
              <button 
                onClick={() => setCheckoutStep('PAYMENT')} 
                className={`py-4 font-bold rounded-xl transition-colors ${phoneNumber.length === 11 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-300 text-white cursor-not-allowed'}`}
                disabled={phoneNumber.length !== 11}
              >
                적립하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Step 2: Payment Modal */}
      {checkoutStep === 'PAYMENT' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={(e) => { if (e.target === e.currentTarget) setCheckoutStep('PHONE'); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setCheckoutStep('PHONE')} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">결제 수단 선택</h2>
              <button onClick={() => setCheckoutStep('NONE')} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex justify-between items-center">
              <span className="font-medium text-blue-800">결제할 금액</span>
              <span className="text-2xl font-black text-blue-700">{totalAmount.toLocaleString()}원</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => setPaymentMethod('CARD')}
                className={`py-6 flex flex-col items-center gap-3 rounded-xl border-2 transition-all ${paymentMethod === 'CARD' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <span className="font-bold">신용카드</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('PAY')}
                className={`py-6 flex flex-col items-center gap-3 rounded-xl border-2 transition-all ${paymentMethod === 'PAY' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                <span className="font-bold">간편결제 (페이)</span>
              </button>
            </div>
            
            <button 
              onClick={handleCheckoutSubmit}
              disabled={isCheckoutLoading}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              {isCheckoutLoading ? <Spinner size={24} color="#ffffff" /> : '결제 진행하기'}
            </button>
          </div>
        </div>
      )}

      {/* Checkout Success Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={(e) => { if (e.target === e.currentTarget) setCompletedOrder(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">결제 완료</h2>
            <p className="text-slate-500 mb-6">주문이 성공적으로 접수되었습니다.</p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 w-full mb-8">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">주문 번호</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 break-all">#{completedOrder.orderId}</p>
            </div>
            
            <button 
              onClick={() => setCompletedOrder(null)}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              처음으로 돌아가기
            </button>
            <p className="text-xs text-slate-400 mt-4">5초 후 자동으로 닫힙니다.</p>
          </div>
        </div>
      )}

      {/* Main Kiosk Area */}
      <div className="flex-1 flex flex-col h-[60vh] lg:h-full relative z-10 shadow-lg lg:shadow-none bg-white">
        
        {/* Header */}
        <header className="flex-none h-20 px-6 sm:px-8 bg-white border-b border-slate-200 flex items-center justify-between z-20 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsChatOpen(prev => !prev)}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all shadow-md shrink-0 outline-none
                ${isChatOpen ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" /></svg>
            </button>
            <div 
              onClick={handleLogoClick}
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight cursor-default select-none"
            >
              SmartOrder
            </div>
          </div>
          
          <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-2 ml-8">
            {categories.map(cat => (
              <button 
                key={cat.categoryId}
                onClick={() => handleCategoryClick(cat.categoryId)}
                className={`
                  whitespace-nowrap px-6 py-3 rounded-full text-sm sm:text-base font-bold transition-all duration-200 border-2 outline-none shrink-0
                  ${activeCategory === cat.categoryId 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </header>

        {/* Menu Grid */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 custom-scrollbar">
          {storeId === null ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="font-bold text-lg text-slate-500">기기 초기 설정이 필요합니다.</p>
              <p className="text-sm">관리자 모드에 진입하여 Store ID를 설정해주세요.</p>
            </div>
          ) : loading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size={50} color="#2563eb" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-24 lg:pb-0">
              {filteredMenus.map(menu => (
                <div 
                  key={menu.menuId}
                  onClick={() => addToCart(menu)}
                  className={`
                    group bg-white rounded-2xl border ${menu.status === 'SOLD_OUT' ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'} 
                    p-4 flex flex-col cursor-pointer transition-all duration-200 relative overflow-hidden aspect-[4/5]
                  `}
                >
                  {/* Image */}
                  <div className={`flex-1 w-full rounded-xl flex items-center justify-center mb-4 transition-colors overflow-hidden p-2 ${menu.status === 'SOLD_OUT' ? 'bg-slate-100' : 'bg-slate-50'}`}>
                    <img 
                      src={menu.imageUrl} 
                      alt={menu.name}
                      onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE; }}
                      className={`w-full h-full object-cover transition-transform duration-500 ${menu.status === 'SOLD_OUT' ? 'grayscale opacity-70' : 'group-hover:scale-105'}`} 
                    />
                  </div>
                  
                  <div className="mt-auto text-center">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 truncate px-2">{menu.name}</h3>
                    <p className="text-blue-600 font-extrabold text-lg">{menu.price.toLocaleString()}원</p>
                  </div>

                  {menu.status === 'SOLD_OUT' && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <span className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">품절</span>
                    </div>
                  )}
                </div>
              ))}
              {filteredMenus.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400 font-medium text-lg">
                  등록된 메뉴가 없습니다.
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Cart Area (Right Sidebar on Desktop, Bottom Sheet on Mobile) */}
      <div className={`
        lg:w-[400px] flex flex-col bg-white border-l border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] lg:shadow-none z-20 h-[40vh] lg:h-full shrink-0
      `}>
        <div className="p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">주문 내역</h2>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{cart.length}개</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50 lg:bg-white flex flex-col gap-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              <p className="font-medium">장바구니가 비어있습니다.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartItemId} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-slate-900 truncate pr-4">{item.name}</div>
                  <button onClick={() => removeFromCart(item.cartItemId)} className="text-slate-400 hover:text-rose-500 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-blue-600 font-extrabold">{(item.price * item.quantity).toLocaleString()}원</div>
                  <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.cartItemId, -1)} className="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center font-bold shadow-sm">-</button>
                    <span className="w-6 text-center font-bold text-slate-900">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartItemId, 1)} className="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center font-bold shadow-sm">+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 sm:p-6 bg-white border-t border-slate-200 shrink-0">
          <div className="flex justify-between items-end mb-4">
            <span className="text-slate-500 font-medium">총 결제금액</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{totalAmount.toLocaleString()}원</span>
          </div>
          <button 
            className={`w-full py-5 flex justify-center items-center gap-2 rounded-xl text-xl font-bold shadow-sm transition-all focus:ring-4 focus:ring-blue-500/30 outline-none ${
              cart.length > 0 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            onClick={handleCheckoutInit}
            disabled={cart.length === 0}
          >
            결제하기
          </button>
        </div>
      </div>
      
      {/* Admin Modal */}
      {adminModalState !== 'CLOSED' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md" onClick={(e) => { if (e.target === e.currentTarget) setAdminModalState('CLOSED'); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">관리자 설정</h2>
              <button onClick={() => setAdminModalState('CLOSED')} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {adminModalState === 'STORE_ID' && (
              <div className="flex flex-col gap-4">
                <p className="text-slate-500 font-medium">관리할 기기의 Store ID를 입력하세요.</p>
                <input 
                  type="number" 
                  value={storeIdInput} 
                  onChange={(e) => setStoreIdInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleStoreIdSubmit()}
                  className="w-full p-4 text-center text-xl font-bold rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                  placeholder="예: 1"
                  autoFocus
                />
                <button 
                  onClick={handleStoreIdSubmit}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors mt-2"
                >
                  다음
                </button>
              </div>
            )}

            {adminModalState === 'PIN' && (
              <div className="flex flex-col gap-4">
                <p className="text-slate-500 font-medium">Store #{storeIdInput}의 관리자 PIN을 입력하세요.</p>
                <input 
                  type="password" 
                  value={pinInput} 
                  onChange={(e) => setPinInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                  className="w-full p-4 text-center text-2xl font-bold tracking-[0.5em] rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                  placeholder="****"
                  autoFocus
                />
                <button 
                  onClick={handlePinSubmit}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors mt-2"
                >
                  검증 및 재시작
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
