"use client";

import React, { useState, useEffect } from 'react';
import { backendApi } from '../../../shared/api/client';
import { OrderStatus } from '../../../shared/constants/enums';

export default function StoreOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchStatus, setSearchStatus] = useState<string>('ALL');
  const [searchDate, setSearchDate] = useState<string>('');
  const [searchTime, setSearchTime] = useState<string>('');
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = orders;
    if (searchStatus !== 'ALL') {
      result = result.filter(o => o.status === searchStatus);
    }
    if (searchDate) {
      result = result.filter(o => {
        const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
        return orderDate === searchDate;
      });
    }
    if (searchTime) {
      result = result.filter(o => {
        const orderTime = new Date(o.createdAt).toTimeString().split(' ')[0].substring(0, 5); // HH:mm
        return orderTime === searchTime;
      });
    }
    setFilteredOrders(result);
  }, [orders, searchStatus, searchDate, searchTime]);

  const fetchOrders = () => {
    const storeId = localStorage.getItem('logged_store_id') || '1';
    backendApi.get(`/orders/store/${storeId}`).then(res => setOrders(res.data)).catch(console.error);
  };

  const handleUpdateStatus = (id: number, newStatus: OrderStatus) => {
    backendApi.put(`/orders/${id}/status?status=${newStatus}`)
      .then(() => {
        setOrders(prev => prev.map(o => o.orderId === id ? { ...o, status: newStatus as any } : o));
        if (selectedOrder && selectedOrder.orderId === id) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      })
      .catch(console.error);
  };

  const openDetailsModal = async (orderId: number) => {
    try {
      const res = await backendApi.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (err) {
      console.error(err);
      alert('주문 상세 정보를 불러오는데 실패했습니다.');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">실시간 주문 현황</h2>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <span className="font-bold text-slate-700">상태 필터:</span>
        <select 
          value={searchStatus} 
          onChange={(e) => setSearchStatus(e.target.value)}
          className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">전체 보기</option>
          <option value={OrderStatus.PENDING}>접수 대기</option>
          <option value={OrderStatus.PREPARING}>제조 중</option>
          <option value={OrderStatus.COMPLETED}>완료</option>
          <option value={OrderStatus.CANCELED}>취소/환불</option>
        </select>

        <span className="font-bold text-slate-700 ml-4">주문 날짜:</span>
        <input 
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <span className="font-bold text-slate-700 ml-4">주문 시간:</span>
        <input 
          type="time"
          value={searchTime}
          onChange={(e) => setSearchTime(e.target.value)}
          className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        {(searchDate || searchTime) && (
          <button 
            onClick={() => { setSearchDate(''); setSearchTime(''); }}
            className="text-sm text-slate-500 hover:text-slate-700 underline ml-2"
          >
            초기화
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">주문번호</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">주문시간</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">총 결제금액</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">상태</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">상세보기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOrders.map(order => (
                <tr key={order.orderId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-blue-600">#{order.orderId}</td>
                  <td className="p-4 text-slate-600">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="p-4 text-right font-extrabold text-slate-900">{order.totalAmount.toLocaleString()}원</td>
                  <td className="p-4 text-center">
                    <select 
                      value={order.status} 
                      onChange={(e) => handleUpdateStatus(order.orderId, e.target.value as OrderStatus)}
                      className={`p-1.5 text-sm font-bold rounded-lg border outline-none ${
                        order.status === OrderStatus.PENDING ? 'bg-orange-50 border-orange-200 text-orange-700 focus:ring-orange-500' :
                        order.status === OrderStatus.PREPARING ? 'bg-blue-50 border-blue-200 text-blue-700 focus:ring-blue-500' :
                        order.status === OrderStatus.COMPLETED ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500' :
                        'bg-slate-100 border-slate-300 text-slate-600 focus:ring-slate-500'
                      }`}
                    >
                      <option value={OrderStatus.PENDING}>접수 대기</option>
                      <option value={OrderStatus.PREPARING}>제조 중</option>
                      <option value={OrderStatus.COMPLETED}>완료</option>
                      <option value={OrderStatus.CANCELED}>취소</option>
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => openDetailsModal(order.orderId)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-md transition-colors"
                    >
                      상세 보기
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-10 text-slate-500 font-medium">실시간 주문 내역이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">주문 상세 #{selectedOrder.orderId}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-6 flex justify-between items-center border-b border-dashed border-slate-200 pb-4">
                <span className="text-slate-500 font-medium">주문 시간</span>
                <span className="font-bold text-slate-800">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              
              <h4 className="font-bold text-slate-900 mb-4">주문 메뉴</h4>
              <div className="space-y-3">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-800">메뉴 ID: {item.menuId}</div>
                        <div className="text-sm text-slate-500">수량: {item.quantity}개</div>
                      </div>
                      <div className="font-bold text-slate-900">{item.unitPrice ? item.unitPrice.toLocaleString() : 0}원</div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-sm italic p-3 bg-slate-50 rounded-lg">주문 항목 정보가 없습니다. (Mock 데이터)</div>
                )}
              </div>
              
              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700 text-lg">총 결제 금액</span>
                <span className="text-2xl font-black text-blue-600">{selectedOrder.totalAmount?.toLocaleString()}원</span>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => handleUpdateStatus(selectedOrder.orderId, OrderStatus.PREPARING)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                제조 시작 (주문 접수)
              </button>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
