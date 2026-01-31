import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RegistrationContextType {
  isRegistered: boolean;
  setIsRegistered: (value: boolean) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider = ({ children }: { children: ReactNode }) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  return (
    <RegistrationContext.Provider value={{ isRegistered, setIsRegistered, userEmail, setUserEmail }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};
