import { Link } from "react-router-dom";
import { FiLock } from "react-icons/fi";

import { getAccessiblePages, getCurrentUser } from "../utils/permissions";
import "../styles/unauthorized.css";

const Unauthorized = () => {
  const user = getCurrentUser();
  const fallbackPage = getAccessiblePages(user)[0];

  return (
    <div className="unauthorized-state">
      <div className="unauthorized-icon">
        <FiLock />
      </div>

      <strong>Access Restricted</strong>

      <span>
        You don&apos;t have permission to view this page. Contact an
        administrator if you need access.
      </span>

      {fallbackPage && (
        <Link to={`/${fallbackPage.key}`} className="unauthorized-link">
          Go to {fallbackPage.label}
        </Link>
      )}
    </div>
  );
};

export default Unauthorized;
