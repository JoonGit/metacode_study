// [Task Verification] Phase 5: Frontend - Infrastructure & UI
import { create } from 'zustand';

interface KioskState {
  storeId: number | null;
  kioskId: string | null;
  language: 'ko' | 'en';
  setStoreId: (id: number) => void;
  setKioskId: (id: string) => void;
  setLanguage: (lang: 'ko' | 'en') => void;
}

export const useKioskStore = create<KioskState>((set) => ({
  storeId: null,
  kioskId: null,
  language: 'ko', // default
  setStoreId: (id) => set({ storeId: id }),
  setKioskId: (id) => set({ kioskId: id }),
  setLanguage: (lang) => set({ language: lang }),
}));
