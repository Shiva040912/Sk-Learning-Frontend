import { NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiSettings,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

import logo from "../assets/sk-logo.png";
import { getCurrentUser, hasPageAccess } from "../utils/permissions";

const PAGE_ICONS = {
  dashboard: <FiGrid />,
  students: <FiUsers />,
  payments: <FiCreditCard />,
  invoices: <FiFileText />,
  notifications: <FiBell />,
  users: <FiUser />,
  settings: <FiSettings />,
};

const ALL_NAV_ITEMS = [
  { to: "/dashboard", page: "dashboard", label: "Dashboard" },
  { to: "/students", page: "students", label: "Students" },
  { to: "/payments", page: "payments", label: "Payments" },
  { to: "/invoices", page: "invoices", label: "Invoices" },
  { to: "/notifications", page: "notifications", label: "Notifications" },
  { to: "/users", page: "users", label: "Users" },
  { to: "/settings", page: "settings", label: "Settings" },
];

const Sidebar = ({
  isOpen,
  onClose,
  isExpanded,
  onToggleExpand,
  mobileNavLayout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Every item is shown only if the logged-in user's own saved permissions
  // (or the admin bypass) allow that specific page — no item is hardcoded
  // to a role, and no item's visibility depends on any other item.
  const navItems = ALL_NAV_ITEMS.filter((item) =>
    hasPageAccess(user, item.page)
  ).map((item) => ({
    ...item,
    icon: PAGE_ICONS[item.page],
  }));

  const handleNavClick = (event, destination) => {
    if (
      window.innerWidth <= 900 &&
      mobileNavLayout === "drawer"
    ) {
      onClose();
    }

    if (location.pathname === destination) {
      event.preventDefault();
      navigate(destination, {
        replace: true,
        state: { sidebarReset: Date.now() },
      });
    }
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`sidebar mobile-sidebar-${mobileNavLayout} ${
          isExpanded ? "expanded" : ""
        } ${
          isOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-top">
          <button
            type="button"
            className="sidebar-toggle-btn sidebar-top-toggle"
            onClick={onToggleExpand}
            aria-label={
              isExpanded
                ? "Collapse sidebar"
                : "Expand sidebar"
            }
          >
            {isExpanded ? (
              <FiChevronLeft />
            ) : (
              <FiChevronRight />
            )}

            {isExpanded && (
              <span>Collapse</span>
            )}
          </button>

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-menu-title">
            MAIN MENU
          </span>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={
                !isExpanded
                  ? item.label
                  : undefined
              }
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
              onClick={(event) => handleNavClick(event, item.to)}
            >
              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span className="sidebar-link-label">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom-brand">
          <img
            src={logo}
            alt="The SK Learnings"
            className="sidebar-bottom-logo"
          />

          <strong className="sidebar-bottom-brand-text">
            THE <span>SK</span> LEARNINGS
          </strong>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
