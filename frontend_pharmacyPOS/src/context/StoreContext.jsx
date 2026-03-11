import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [storeInfo, setStoreInfo] = useState({
    name: '',
    code: '',
    email: '',
    businessType: '',
    logo: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchStoreInfo = async () => {
    try {
      const response = await api.get('/store');
      // Ensure we have a valid store object with all required fields
      const storeData = response.data || {};
      setStoreInfo({
        name: storeData.name || '',
        code: storeData.code || '',
        email: storeData.email || '',
        businessType: storeData.businessType || '',
        logo: storeData.logo || null,
        activeBranchId: storeData.activeBranchId || null,
      });
      return storeData;
    } catch (error) {
      console.error('Error fetching store info:', error);
      // Return default store info on error
      const defaultStore = {
        name: 'My Store',
        code: 'ST001',
        email: '',
        businessType: '',
        logo: null,
        activeBranchId: null,
      };
      setStoreInfo(defaultStore);
      return defaultStore;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const updateStoreInfo = (newInfo) => {
    setStoreInfo(prev => ({
      ...prev,
      ...newInfo
    }));
  };

  return (
    <StoreContext.Provider value={{ storeInfo, loading, updateStoreInfo, refreshStoreInfo: fetchStoreInfo }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
