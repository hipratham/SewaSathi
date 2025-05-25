
"use client";

import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, database } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export type UserRole = "seeker" | "provider" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  isAuthenticating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // Used during explicit sign-in/sign-up
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true); // Start loading when auth state might change
      if (currentUser) {
        setUser(currentUser);
        // Fetch role from Realtime Database
        console.log("AuthContext: Attempting to access database to fetch role for UID:", currentUser.uid, database); // Diagnostic log
        const userRoleRef = ref(database, `users/${currentUser.uid}/role`);
        try {
          const snapshot = await get(userRoleRef);
          if (snapshot.exists()) {
            setRole(snapshot.val() as UserRole);
          } else {
            setRole(null); // Role not set or user data doesn't exist
            console.warn("AuthContext: User role not found in database for UID:", currentUser.uid);
          }
        } catch (error) {
          console.error("AuthContext: Error fetching user role:", error);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
      setIsAuthenticating(false); // Reset authenticating flag
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/auth')) {
      // If not loading, no user, and not on an auth page, redirect to sign-in
      // router.push('/auth/signin'); // Optional: aggressive redirect for all non-auth pages
    }
  }, [user, loading, pathname, router]);


  const value = { user, role, loading, isAuthenticating };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
