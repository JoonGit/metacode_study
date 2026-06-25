// [Task Verification] Phase 5: Frontend - Admin UI
"use client";
import React, { useEffect, useState } from 'react';
import { backendApi } from '../../shared/api/client';
import styles from './StoreDashboard.module.css';

interface StoreInfo {
  store_id: number;
  store_name: string;
  status: string;
  kiosk_status?: string;
}

export const StoreDashboard: React.FC = () => {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await backendApi.get('/stores', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStores(res.data?.content || res.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch stores.');
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      <h2>Store & Kiosk Dashboard</h2>
      {error && <p className={styles.error}>{error}</p>}
      {loading ? (
        <p>Loading stores...</p>
      ) : (
        <table className={styles.storeTable}>
          <thead>
            <tr>
              <th>Store ID</th>
              <th>Store Name</th>
              <th>Status</th>
              <th>Kiosk Health</th>
            </tr>
          </thead>
          <tbody>
            {stores.map(store => (
              <tr key={store.store_id}>
                <td>{store.store_id}</td>
                <td>{store.store_name}</td>
                <td>{store.status}</td>
                <td>
                  <span className={store.kiosk_status === 'OFFLINE' ? styles.offline : styles.online}>
                    {store.kiosk_status || 'ONLINE'}
                  </span>
                </td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr>
                <td colSpan={4}>No stores found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};
