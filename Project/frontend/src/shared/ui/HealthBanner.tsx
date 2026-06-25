// [Task Verification] Phase 5: Frontend - AI & Modals
'use client';

import React, { useEffect, useState } from 'react';

export default function HealthBanner() {
  const [isHealthy, setIsHealthy] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/health', { 
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setIsHealthy(true);
        } else {
          setIsHealthy(false);
        }
      } catch (error) {
        setIsHealthy(false);
      }
    };

    // Initial check
    checkHealth();

    // Poll every 30 seconds
    const intervalId = setInterval(checkHealth, 30000);

    return () => clearInterval(intervalId);
  }, []);

  if (isHealthy) {
    return null;
  }

  return (
    <div className="w-full bg-rose-500 text-white p-3 text-center font-bold text-sm shadow-md animate-pulse">
      ⚠️ 서버 점검 중입니다. 서비스 이용이 원활하지 않을 수 있습니다.
    </div>
  );
}
