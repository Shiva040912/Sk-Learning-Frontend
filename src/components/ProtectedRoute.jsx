import { Navigate, Outlet } from "react-router-dom";

import { getCurrentUser, hasPageAccess } from "../utils/permissions";
import Unauthorized from "./Unauthorized";

const ProtectedRoute = ({ page, children }) => {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    return <Navigate to="/" replace />;
  }

  const user = getCurrentUser();

  if (page && !hasPageAccess(user, page)) {
    return <Unauthorized />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
