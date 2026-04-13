import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type FamilyContextType = {
  familyId: string | null;
  familyName: string | null;
  userId: string | null;
  userName: string | null;
  joinFamily: (familyId: string, familyName: string, userId: string, userName: string) => Promise<void>;
  leaveFamily: () => Promise<void>;
  isLoading: boolean;
};

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const storedFamilyId = await AsyncStorage.getItem('family_id');
        const storedFamilyName = await AsyncStorage.getItem('family_name');
        const storedUserId = await AsyncStorage.getItem('user_id');
        const storedUserName = await AsyncStorage.getItem('user_name');
        
        if (storedFamilyId && storedUserId) {
          setFamilyId(storedFamilyId);
          setFamilyName(storedFamilyName);
          setUserId(storedUserId);
          setUserName(storedUserName);
        }
      } catch (e) {
        console.error("Failed to load family data from async storage", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const joinFamily = async (fId: string, fName: string, uId: string, uName: string) => {
    try {
      await AsyncStorage.multiSet([
        ['family_id', fId],
        ['family_name', fName],
        ['user_id', uId],
        ['user_name', uName]
      ]);
      setFamilyId(fId);
      setFamilyName(fName);
      setUserId(uId);
      setUserName(uName);
    } catch (e) {
      console.error("Failed to save family data", e);
    }
  };

  const leaveFamily = async () => {
    try {
      await AsyncStorage.multiRemove(['family_id', 'family_name', 'user_id', 'user_name']);
      setFamilyId(null);
      setFamilyName(null);
      setUserId(null);
      setUserName(null);
    } catch (e) {
      console.error("Failed to clear family data", e);
    }
  };

  return (
    <FamilyContext.Provider value={{ familyId, familyName, userId, userName, joinFamily, leaveFamily, isLoading }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
