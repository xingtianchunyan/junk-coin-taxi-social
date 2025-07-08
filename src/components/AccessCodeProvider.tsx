import React, { createContext, useContext, useEffect, useState } from 'react';

interface AccessCodeContextType {
  accessCode: string | null;
  setAccessCode: (code: string) => void;
  clearAccessCode: () => void;
  hasAccess: boolean;
}

const AccessCodeContext = createContext<AccessCodeContextType | undefined>(undefined);

export const useAccessCode = () => {
  const context = useContext(AccessCodeContext);
  if (context === undefined) {
    throw new Error('useAccessCode must be used within an AccessCodeProvider');
  }
  return context;
};

export const AccessCodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessCode, setAccessCodeState] = useState<string | null>(null);

  useEffect(() => {
    // 从 localStorage 恢复访问码
    const savedCode = localStorage.getItem('userAccessCode');
    if (savedCode) {
      setAccessCodeState(savedCode);
    }
  }, []);

  const setAccessCode = (code: string) => {
    setAccessCodeState(code);
    localStorage.setItem('userAccessCode', code);
  };

  const clearAccessCode = () => {
    setAccessCodeState(null);
    localStorage.clear();
  };

  const hasAccess = accessCode !== null;

  const value = {
    accessCode,
    setAccessCode,
    clearAccessCode,
    hasAccess,
  };

  return <AccessCodeContext.Provider value={value}>{children}</AccessCodeContext.Provider>;
};