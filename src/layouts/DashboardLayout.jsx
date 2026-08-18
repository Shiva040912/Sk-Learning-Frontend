import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/layout.css";

const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState(false);

  const [isSidebarExpanded, setIsSidebarExpanded] =
    useState(false);

  return (
    <div
      className={`dashboard-layout ${
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