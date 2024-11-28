// src/contexts/RefreshContext.tsx

import React, { createContext, useState } from 'react';

interface RefreshContextProps {
  refreshData: number;
  triggerRefresh: () => void;
}

export const RefreshContext = createContext<RefreshContextProps>({
  refreshData: 0,
  triggerRefresh: () => {},
});

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshData, setRefreshData] = useState<number>(0);

  const triggerRefresh = () => {
    setRefreshData((prev) => prev + 1);
  };

  return (
    <RefreshContext.Provider value={{ refreshData, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};