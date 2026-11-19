"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { StaffRecord, CrmModule, ModulePermission } from "@/lib/validations/staff";

interface AuthContextType {
  user: User | null;
  staff: StaffRecord | null;
  role: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  hasPermission: (module: CrmModule, action?: keyof ModulePermission) => boolean;
  refreshStaff: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  staff: null,
  role: null,
  isAdmin: false,
  isLoading: true,
  signIn: async () => ({ success: false }),
  signOut: async () => {},
  hasPermission: () => false,
  refreshStaff: async () => {},
});

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync staff profile for a given email
  const fetchStaffProfile = useCallback(async (email: string, token: string): Promise<StaffRecord | null> => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.staff) {
        return data.staff;
      }
    } catch (err) {
      console.error("Failed to load staff profile:", err);
    }
    return null;
  }, []);

  const refreshStaff = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user?.email && data.session.access_token) {
      const profile = await fetchStaffProfile(data.session.user.email, data.session.access_token);
      if (profile) setStaff(profile);
    }
  }, [fetchStaffProfile]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user && mounted) {
          setUser(session.user);
          setCookie("sb-access-token", session.access_token);
          if (session.user.email) {
            const profile = await fetchStaffProfile(session.user.email, session.access_token);
            if (mounted && profile) {
              setStaff(profile);
            }
          }
        } else {
          deleteCookie("sb-access-token");
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        setCookie("sb-access-token", session.access_token);
        if (session.user.email) {
          const profile = await fetchStaffProfile(session.user.email, session.access_token);
          if (mounted && profile) {
            setStaff(profile);
          }
        }
      } else {
        setUser(null);
        setStaff(null);
        deleteCookie("sb-access-token");
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchStaffProfile]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session?.user && data.session.access_token) {
        setUser(data.session.user);
        setCookie("sb-access-token", data.session.access_token);

        // Fetch staff profile and ensure employee is active
        const profile = await fetchStaffProfile(data.session.user.email!, data.session.access_token);
        if (!profile) {
          await supabase.auth.signOut();
          deleteCookie("sb-access-token");
          return { success: false, error: "No staff profile found for this account. Contact your administrator." };
        }

        if (profile.employmentStatus !== "Active") {
          await supabase.auth.signOut();
          deleteCookie("sb-access-token");
          return { success: false, error: "Your account is inactive. Please contact your CRM Administrator." };
        }

        setStaff(profile);
        return { success: true };
      }

      return { success: false, error: "Unable to establish active session." };
    } catch (err: any) {
      return { success: false, error: err.message || "An unexpected error occurred during login." };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      deleteCookie("sb-access-token");
      setUser(null);
      setStaff(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = staff?.role === "Super Admin" || staff?.role === "Admin";
  const role = staff?.role || null;

  const hasPermission = (module: CrmModule, action: keyof ModulePermission = "view"): boolean => {
    if (!staff) return false;
    if (isAdmin) return true; // Admins have full access to all modules

    const perms = staff.permissions || {};
    const modPerm = perms[module];
    if (!modPerm) return false;

    return !!modPerm[action];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        staff,
        role,
        isAdmin,
        isLoading,
        signIn,
        signOut,
        hasPermission,
        refreshStaff,
      }}
    >
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
