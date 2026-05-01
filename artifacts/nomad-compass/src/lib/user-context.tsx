import React, { createContext, useContext, useState, ReactNode } from "react";

interface UserProfile {
  annualIncomeUSD: number;
  employerCountry: string;
  employerState?: string;
  employerCity: string;
  workSchedule?: string;
  teamTimezone?: string;
  priorities: string[];
  customNote?: string;
  stayInUSA?: boolean;
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
    employerCity: "Los Angeles, CA",
    workSchedule: "9am-7pm",
    teamTimezone: "PST",
    priorities: [],
    customNote: "",
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
