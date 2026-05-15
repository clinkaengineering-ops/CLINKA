import { useEffect, useState } from "react";
import { AppShell, type PageKey } from "./components/AppShell";
import { I18nProvider } from "./i18n";
import Landing from "./pages/Landing";
import EngineerMarketplace from "./pages/EngineerMarketplace";
import ProjectMarketplace from "./pages/ProjectMarketplace";
import EngineerProfile from "./pages/EngineerProfile";
import ClientDashboard from "./pages/ClientDashboard";
import EngineerDashboard from "./pages/EngineerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Escrow from "./pages/Escrow";
import Messaging from "./pages/Messaging";
import Auth from "./pages/Auth";
import Verification from "./pages/Verification";
import Settings from "./pages/Settings";

export default function App() {
  const [page, setPage] = useState<PageKey>("landing");
  const [dark, setDark] = useState(true);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [page]);

  return (
    <I18nProvider>
    <AppShell page={page} setPage={setPage} dark={dark} setDark={setDark}>
      {page === "landing" && <Landing setPage={setPage} />}
      {page === "engineers" && <EngineerMarketplace setPage={setPage} />}
      {page === "projects" && <ProjectMarketplace />}
      {page === "profile" && <EngineerProfile />}
      {page === "client" && <ClientDashboard />}
      {page === "engineerDash" && <EngineerDashboard />}
      {page === "admin" && <AdminDashboard />}
      {page === "escrow" && <Escrow />}
      {page === "messages" && <Messaging />}
      {page === "auth" && <Auth setPage={setPage} />}
      {page === "verification" && <Verification />}
      {page === "settings" && <Settings />}
    </AppShell>
    </I18nProvider>
  );
}
