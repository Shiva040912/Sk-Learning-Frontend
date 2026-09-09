// Single source of truth for the Settings page's granular permission shape —
// mirrors paymentPermissions.js/notificationPermissions.js/
// invoicePermissions.js one page over, except Settings has no Fields layer:
// each tab is one coherent admin-configuration form edited as a whole, so
// gating whole sections (view + save together) as a single action is the
// natural, non-over-engineered granularity here.
//
// Built from the actual Settings.jsx tabs:
//  - Course & Batch tab: deliberately NOT here — it already reuses the
//    Students page's Add/Delete Course/Batch actions (Settings page access
//    is an existing bypass for those on the backend).
//  - Mobile Layout tab: deliberately NOT here — pure client-side/
//    localStorage preference, no backend call to protect.

export const SETTINGS_ACTION_DEFINITIONS = [
  { key: "profileSettings", label: "Profile Settings" },
  { key: "feeSettings", label: "Fee Settings" },
  { key: "notificationSettings", label: "Notification Settings" },
  { key: "invoiceSettings", label: "Invoice Settings" },
];

// Actions are deny-by-default: an Admin has to explicitly grant each one to
// a new user.
export const createDefaultSettingsActions = () =>
  SETTINGS_ACTION_DEFINITIONS.reduce((actions, item) => {
    actions[item.key] = false;
    return actions;
  }, {});

export const createDefaultSettingsPermissions = () => ({
  actions: createDefaultSettingsActions(),
});

const getSettingsPermissions = (user) => {
  const permissions = user?.granularPermissions?.settings;

  return {
    actions: {
      ...createDefaultSettingsActions(),
      ...(permissions?.actions || {}),
    },
  };
};

// Admins always have full access — same bypass rule as page-level access.
export const hasSettingsAction = (user, action) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  return Boolean(getSettingsPermissions(user).actions[action]);
};
