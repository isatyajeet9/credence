import AppNavbar from "@/components/AppNavbar";
import { AuthProvider } from "@/components/AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppNavbar />
      {children}
    </AuthProvider>
  );
}
