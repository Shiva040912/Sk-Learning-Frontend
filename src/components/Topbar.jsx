import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useLocation } from "react-router-dom";

import {
  FiChevronDown,
  FiLogOut,
  FiMenu,
  FiUser,
} from "react-icons/fi";

import logo from "../assets/sk-logo.png";

const Topbar = ({ onMenuClick }) => {
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const profileRef = useRef(null);

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  useEffect(() => {
    const handleProfileUpdated = (event) => {
      setUser(event.detail || JSON.parse(localStorage.getItem("user") || "{}"));
    };

    window.addEventListener("profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("profile-updated", handleProfileUpdated);
  }, []);

  const formatRole = (role) => {
    if (role === "admin") {
      return "Administrator";
    }

    if (
      role === "Trainer" ||
      role === "trainer"
    ) {
      return "Trainer";
    }

    return "User";
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    window.location.href = "/";
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const getPageDetails = () => {
    if (
      location.pathname.startsWith("/students")
    ) {
      return {
        title: "Students",
        subtitle:
          "Manage student records and academic details",
      };
    }

    if (
      location.pathname.startsWith("/payments")
    ) {
      return {
        title: "Payments",
        subtitle:
          "Manage fee payments and records",
      };
    }

    if (
      location.pathname.startsWith("/invoices")
    ) {
      return {
        title: "Invoices",
        subtitle:
          "View invoices and payment receipts",
      };
    }

    if (
      location.pathname.startsWith("/notifications")
    ) {
      return {
        title: "Notification",
        subtitle:
          "View all fee notifications",
      };
    }

    if (
      location.pathname.startsWith("/users")
    ) {
      return {
        title: "Users",
        subtitle:
          "Manage administrator and trainer accounts",
      };
    }

    if (
      location.pathname.startsWith("/settings")
    ) {
      return {
        title: "Settings",
        subtitle:
          "Manage application settings",
      };
    }

    return {
      title: "Dashboard",
      subtitle:
        "The SK Learnings Management Portal",
    };
  };

  const page = getPageDetails();

  return (
    <header className="topbar">
      <div className="topbar-brand-area">
        <button
          type="button"
          className="menu-btn"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <FiMenu />
        </button>

        <div className="topbar-logo-wrap">
          <img
            src={logo}
            alt="The SK Learnings"
            className="topbar-logo"
          />
        </div>

        <div className="topbar-company">
          <h1>
            THE <span>SK</span> LEARNINGS
          </h1>

          <p>
            PRIVATE EDUCATIONAL SERVICES
          </p>

          <small>
            MEDICAL / ENGINEERING / FOUNDATIONS / JUNIOR IAS
          </small>
        </div>
      </div>

      <div className="topbar-divider" />

      <div className="topbar-page-info">
        <div className="topbar-title-row">
          <span className="topbar-accent" />

          <h2>{page.title}</h2>
        </div>

        <p>{page.subtitle}</p>
      </div>

      <div className="topbar-right">
        <div
          className="topbar-profile-wrapper"
          ref={profileRef}
        >
          <button
            type="button"
            className="topbar-user"
            onClick={() =>
              setIsProfileOpen(
                (current) => !current
              )
            }
          >
            <div className="topbar-user-avatar">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name || "Profile"} />
              ) : (
                <FiUser />
              )}
            </div>

            <div className="topbar-user-info">
              <strong>
                {user.name || "Administrator"}
              </strong>

              <span>
                {formatRole(user.role)}
              </span>
            </div>

            <FiChevronDown
              className={`profile-chevron ${
                isProfileOpen ? "open" : ""
              }`}
            />
          </button>

          {isProfileOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-info">
                <div className="profile-dropdown-avatar">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name || "Profile"} />
                  ) : (
                    <FiUser />
                  )}
                </div>

                <div>
                  <strong>
                    {user.name || "Administrator"}
                  </strong>

                  <span>
                    {formatRole(user.role)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="profile-logout"
                onClick={handleLogout}
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
