"use client";
import React, { useState, useEffect } from 'react';
import { backendApi } from '../../shared/api/client';
import Spinner from '../../shared/ui/Spinner';

interface Order {
  orderId: number;
  totalAmount: number;
  status: 'PENDING' | 'PREPARING' | 'COMPLETED' | 'CANCELLED';
}

export const OrderHistory: React.FC<{ storeId: number }> = ({ storeId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await backendApi.get(`/orders/store/${storeId}`);
      setOrders(res.data?.content || res.data || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [storeId]);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await backendApi.put(`/orders/${orderId}/status?status=${status}`);
      setOrders(orders.map(o => o.orderId === orderId ? { ...o, status: status as any } : o));
    } catch (err) {
      console.error('Failed to update status', err);
      alert('상태 업데이트 실패');
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'border-t-rose-500';
      case 'PREPARING': return 'border-t-amber-500';
      case 'COMPLETED': return 'border-t-emerald-500';
      default: return 'border-t-slate-300';
    }
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-rose-100 text-rose-700';
      case 'PREPARING': return 'bg-amber-100 text-amber-700';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const Column = ({ title, statusFilter }: { title: string, statusFilter: string }) => {
    const columnOrders = orders.filter(o => o.status === statusFilter);
    return (
      <div className={`flex flex-col bg-slate-50 rounded-xl border border-slate-200 border-t-4 ${getBorderColor(statusFilter)} h-full min-h-[500px] overflow-hidden shadow-sm`}>
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <span className="font-bold text-slate-800">{title}</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getBadgeColor(statusFilter)}`}>{columnOrders.length}</span>
        </div>
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
          {columnOrders.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
              주문 내역이 없습니다
            </div>
          )}
          {columnOrders.map(order => (
            <div key={order.orderId} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-lg text-slate-900">#{order.orderId}</span>
                <span className="font-bold text-emerald-600">{order.totalAmount.toLocaleString()}원</span>
              </div>
              <div className="flex gap-2">
                {statusFilter === 'PENDING' && (
                  <>
                    <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-bold transition-colors shadow-sm focus:ring-2 focus:ring-blue-500/50 outline-none" onClick={() => updateStatus(order.orderId, 'PREPARING')}>조리시작</button>
                    <button className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-md text-sm font-bold transition-colors" onClick={() => updateStatus(order.orderId, 'CANCELLED')}>거절</button>
                  </>
                )}
                {statusFilter === 'PREPARING' && (
                  <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-bold transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500/50 outline-none" onClick={() => updateStatus(order.orderId, 'COMPLETED')}>제공 완료</button>
                )}
                {statusFilter === 'COMPLETED' && (
                  <span className="w-full text-center py-1.5 text-emerald-600 font-bold text-sm bg-emerald-50 rounded-md border border-emerald-100">완료 처리됨 ✓</span>
                )}
                {statusFilter === 'CANCELLED' && (
                  <span className="w-full text-center py-1.5 text-slate-500 font-bold text-sm bg-slate-100 rounded-md border border-slate-200">취소됨 ✕</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 mt-8 w-full relative z-10">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          칸반 보드
        </h3>
        <button 
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors border border-slate-300 shadow-sm flex items-center gap-2 text-sm"
          onClick={fetchOrders}
        >
          새로고침 🔄
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner size={40} color="#2563eb" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          <Column title="대기 중 (접수 대기)" statusFilter="PENDING" />
          <Column title="준비 중 (조리 중)" statusFilter="PREPARING" />
          <Column title="완료" statusFilter="COMPLETED" />
        </div>
      )}
    </div>
  );
};
