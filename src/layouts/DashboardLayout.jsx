import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/layout.css";

const DashboardLayout = () => {
  const location = useLocation();
  const [mobileNavLayout, setMobileNavLayout] = useState(() => {
    const saved = localStorage.getItem("mobileNavLayout");
    return saved === "bottom" ? "bottom" : "drawer";
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    const syncLayout = (event) => {
      const next = event?.detail || localStorage.getItem("mobileNavLayout");
      setMobileNavLayout(next === "bottom" ? "bottom" : "drawer");
      setIsMobileSidebarOpen(false);
    };
    window.addEventListener("mobile-nav-layout-change", syncLayout);
    window.addEventListener("storage", syncLayout);
    return () => {
      window.removeEventListener("mobile-nav-layout-change", syncLayout);
      window.removeEventListener("storage", syncLayout);
    };
  }, []);
  return (
    <div
      className={`dashboard-layout mobile-nav-${mobileNavLayout} ${
        isSidebarExpanded
          ? "sidebar-expanded-layout"
          : ""
      }`}
    >
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() =>
          setIsMobileSidebarOpen(false)
        }
        isExpanded={isSidebarExpanded}
        onToggleExpand={() =>
          setIsSidebarExpanded(
            (current) => !current
          )
        }
        mobileNavLayout={mobileNavLayout}
      />

      <div className="dashboard-main">
        <Topbar
          onMenuClick={() =>
            setIsMobileSidebarOpen(true)
          }
        />

        <main className="dashboard-content">
          <Outlet key={location.key} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
