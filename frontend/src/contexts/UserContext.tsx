// src/contexts/UserContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextProps {
  userId: number | null;
  setUserId: (id: number | null) => void;
}

export const UserContext = createContext<UserContextProps>({
  userId: null,
  setUserId: () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<number | null>(null);

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for easy access
export const useUser = () => useContext(UserContext);
