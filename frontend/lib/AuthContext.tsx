"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Role = "ADMIN" | "RESEARCHER" | "INSPECTOR" | "VIEWER";

export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  title: string;
  department: string;
  avatarUrl?: string;
}

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  user: MockUser;
  updateUser: (updated: Partial<MockUser>) => void;
}

const defaultUser: MockUser = {
  id: "USR-0042",
  firstName: "Principal",
  lastName: "Investigator",
  email: "director@helixsign.bio",
  role: "ADMIN",
  title: "Principal Bio-Forensics Lead",
  department: "Synthetic Biology & Provenance Lab",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("ADMIN");
  const [user, setUser] = useState<MockUser>(defaultUser);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("template_user_role") as Role;
      if (savedRole && ["ADMIN", "RESEARCHER", "INSPECTOR", "VIEWER"].includes(savedRole)) {
        setRoleState(savedRole);
        setUser((prev) => ({ ...prev, role: savedRole }));
      }
      const savedUser = localStorage.getItem("template_user_profile");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (
            parsed &&
            (parsed.email?.includes("rvu") ||
              parsed.email?.includes("echosense") ||
              parsed.firstName?.toLowerCase().includes("operations") ||
              parsed.lastName?.toLowerCase().includes("lead") ||
              parsed.firstName === "Karthik" ||
              parsed.lastName === "K P")
          ) {
            localStorage.removeItem("template_user_profile");
            setUser(defaultUser);
          } else {
            setUser(parsed);
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem("template_user_role", newRole);
    }
    setUser((prev) => {
      const next = { ...prev, role: newRole };
      if (typeof window !== "undefined") {
        localStorage.setItem("template_user_profile", JSON.stringify(next));
      }
      return next;
    });
  };

  const updateUser = (updated: Partial<MockUser>) => {
    setUser((prev) => {
      const next = { ...prev, ...updated };
      if (typeof window !== "undefined") {
        localStorage.setItem("template_user_profile", JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ role, setRole, user, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

