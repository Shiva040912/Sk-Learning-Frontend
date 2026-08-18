import { NavLink } from "react-router-dom";

import {
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiFileText,
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
}) => {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isAdministrator =
    user.role === "admin";

  const navItems = [
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
    if (window.innerWidth <= 900) {
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
        className={`sidebar ${
          isExpanded ? "expanded" : ""
        } ${
          isOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-top">
          <div className="sidebar-logo-wrap">
            <img
              src={logo}
              alt="The SK Learnings"
              className="sidebar-logo"
            />
          </div>

          <div className="sidebar-brand-text">
            <strong>
              THE <span>SK</span> LEARNINGS
            </strong>

            <small>
              Management Portal
            </small>
          </div>

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

        <div className="sidebar-toggle-area">
          <button
            type="button"
            className="sidebar-toggle-btn"
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
        </div>
      </aside>
    </>
  );
};

export default Sidebar;