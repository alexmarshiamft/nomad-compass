import React, { createContext, useContext, useState, ReactNode } from "react";

interface UserProfile {
  annualIncomeUSD: number;
  employerCountry: string;
  employerState?: string;
  workSchedule?: string;
  teamTimezone?: string;
}

interface UserContextType {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>({
    annualIncomeUSD: 50000,
    employerCountry: "US",
    employerState: "CA",
  });

  return (
    <UserContext.Provider value={{ profile, setProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
