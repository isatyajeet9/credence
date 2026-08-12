import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      {children}
      <Footer />
    </>
  );
}
