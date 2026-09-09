// Single source of truth for what pages exist and who can see them.
// Every place that gates a page (Sidebar, ProtectedRoute, the Users form)
// reads from this list/function instead of branching on `role` directly.
export const PAGE_DEFINITIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "students", label: "Students" },
  { key: "payments", label: "Payments" },
  { key: "invoices", label: "Invoices" },
  { key: "notifications", label: "Notifications" },
  { key: "users", label: "Users" },
  { key: "settings", label: "Settings" },
];

export const PAGE_KEYS = PAGE_DEFINITIONS.map((page) => page.key);

export const createEmptyPagePermissions = () =>
  PAGE_KEYS.reduce((permissions, key) => {
    permissions[key] = false;
    return permissions;
  }, {});

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

// Admins always have full access — every other user's access comes only
// from their own saved pagePermissions, never from their role name.
export const hasPageAccess = (user, pageKey) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  return Boolean(user.pagePermissions?.[pageKey]);
};

export const getAccessiblePages = (user) =>
  PAGE_DEFINITIONS.filter((page) => hasPageAccess(user, page.key));
