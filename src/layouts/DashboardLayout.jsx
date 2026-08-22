import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/layout.css";

const DashboardLayout = () => {
  const [mobileNavLayout, setMobileNavLayout] = useState(
    () => {
      const savedLayout = localStorage.getItem("mobileNavLayout");
      if (savedLayout === "rail") {
        localStorage.setItem("mobileNavLayout", "drawer");
        return "drawer";
      }
      return savedLayout || "drawer";
    }
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState(false);

  const [isSidebarExpanded, setIsSidebarExpanded] =
    useState(false);

  useEffect(() => {
    const handleLayoutChange = (event) => {
      setMobileNavLayout(event.detail || "drawer");
      setIsMobileSidebarOpen(false);
    };

    window.addEventListener("mobile-nav-layout-change", handleLayoutChange);
    return () => window.removeEventListener("mobile-nav-layout-change", handleLayoutChange);
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
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
