"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { UserOut } from "@/lib/api";

interface AuthContextType {
  user: UserOut | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("credence_token");
    const storedUser = localStorage.getItem("credence_user");
    
    if (!token || !storedUser) {
      setUser(null);
      setLoading(false);
      if (pathname !== "/login" && pathname !== "/signup") {
        router.push("/login");
      }
      return;
    }
    
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      setUser(null);
      if (pathname !== "/login" && pathname !== "/signup") {
        router.push("/login");
      }
    }
    setLoading(false);
  }, [pathname, router]);

  function logout() {
    localStorage.removeItem("credence_token");
    localStorage.removeItem("credence_user");
    setUser(null);
    router.push("/login");
  }

  // Render children immediately to avoid hiding the global layout (navbar/sidebar).
  // Individual protected pages must check the `loading` state to prevent flicker
  // or unauthorized flashes of content before redirecting.

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
