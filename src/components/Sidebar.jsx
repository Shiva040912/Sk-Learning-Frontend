import { NavLink } from "react-router-dom";

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

const Sidebar = ({
  isOpen,
  onClose,
  isExpanded,
  onToggleExpand,
  mobileNavLayout,
}) => {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isAdministrator =
    user.role === "admin";

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <FiGrid />,
    },
    {
      to: "/students",
      label: "Students",
      icon: <FiUsers />,
    },
    {
      to: "/payments",
      label: "Payments",
      icon: <FiCreditCard />,
    },
    {
      to: "/invoices",
      label: "Invoices",
      icon: <FiFileText />,
    },
    {
      to: "/notifications",
      label: "Notifications",
      icon: <FiBell />,
    },
    ...(isAdministrator
      ? [
          {
            to: "/users",
            label: "Users",
            icon: <FiUser />,
          },
        ]
      : []),
    {
      to: "/settings",
      label: "Settings",
      icon: <FiSettings />,
    },
  ];

  const handleNavClick = () => {
    if (
      window.innerWidth <= 900 &&
      mobileNavLayout === "drawer"
    ) {
      onClose();
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
              onClick={handleNavClick}
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