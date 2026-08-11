import { useLocation } from "react-router-dom";
import {
  FiMenu,
  FiUser,
  FiLogOut,
} from "react-icons/fi";

const Topbar = ({ onMenuClick }) => {
  const location = useLocation();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    window.location.href = "/";
  };

  const getPageDetails = () => {
    if (location.pathname.startsWith("/students")) {
      return {
        title: "Students",
        subtitle: "Manage student records and academic details",
      };
    }

    if (location.pathname.startsWith("/payments")) {
      return {
        title: "Payments",
        subtitle: "Manage fee payments and payment records",
      };
    }

    if (location.pathname.startsWith("/profile")) {
      return {
        title: "Users",
        subtitle: "Manage administrator and user information",
      };
    }

    return {
      title: "Dashboard",
      subtitle: "The SK Learnings Management Portal",
    };
  };

  const page = getPageDetails();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-btn"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <FiMenu />
        </button>

        <div className="topbar-page-info">
          <div className="topbar-title-row">
            <span className="topbar-accent" />

            <h2>{page.title}</h2>
          </div>

          <p>{page.subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="topbar-logout"
          onClick={handleLogout}
        >
          <FiLogOut />
          <span>Logout</span>
        </button>

        <div className="topbar-user">
          <div className="topbar-user-avatar">
            <FiUser />
          </div>

          <div className="topbar-user-info">
            <strong>{user.name || "Admin"}</strong>
            <span>{user.role || "Administrator"}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;