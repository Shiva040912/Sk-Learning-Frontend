// Single source of truth for the Notifications page's granular permission
// shape — mirrors paymentPermissions.js one page over. Every place that
// reads/edits these (the Users form, the Notifications page) goes through
// the helpers here instead of reaching into `user.granularPermissions`
// directly.
//
// There is deliberately ONE Fields list (not separate columns/details
// lists) — a field is configured once and that single flag controls it
// everywhere it's displayed (table column, row subtext and the preferences
// menu alike). "Send to All" and "Send Individual/Selected" are sub-actions
// of "Send Notification", never independent top-level features — see
// hasNotificationAction.

export const NOTIFICATION_ACTION_DEFINITIONS = [
  { key: "search", label: "Search" },
  { key: "filter", label: "Filter" },
  { key: "refresh", label: "Refresh" },
  { key: "sendNotification", label: "Send Notification" },
  { key: "sendReminder", label: "Send Reminder" },
  { key: "notificationPreferences", label: "Notification Preferences" },
];

// Rendered nested under "Send Notification" in the Users form, but stored
// as flat top-level action keys like every other action.
export const SEND_NOTIFICATION_SUB_ACTION_DEFINITIONS = [
  { key: "sendToAll", label: "Send to All" },
  { key: "sendIndividualSelected", label: "Send Individual / Selected" },
];

export const NOTIFICATION_FIELD_DEFINITIONS = [
  { key: "studentName", label: "Student Name" },
  { key: "rollNo", label: "Roll No" },
  { key: "course", label: "Course" },
  { key: "batch", label: "Batch" },
  { key: "pendingAmount", label: "Pending Amount" },
  { key: "paidAmount", label: "Paid Amount" },
  { key: "feeEndingDate", label: "Due Date" },
  { key: "alertType", label: "Alert Type / Status" },
  { key: "reminderCount", label: "Reminder Count" },
  { key: "lastReminderSentAt", label: "Last Reminder Sent At" },
  { key: "nextReminderDate", label: "Next Reminder Date" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "muteAll", label: "Mute All Messages" },
  { key: "muteReminder", label: "Mute Reminder Messages" },
];

const ALL_NOTIFICATION_ACTION_KEYS = [
  ...NOTIFICATION_ACTION_DEFINITIONS,
  ...SEND_NOTIFICATION_SUB_ACTION_DEFINITIONS,
].map((item) => item.key);

// Actions are deny-by-default: an Admin has to explicitly grant each one to
// a new user.
export const createDefaultNotificationActions = () =>
  ALL_NOTIFICATION_ACTION_KEYS.reduce((actions, key) => {
    actions[key] = false;
    return actions;
  }, {});

// Fields are visible-by-default: turning Notifications page access on shows
// the full table/menu exactly as before, until an Admin deliberately hides
// a field.
export const createDefaultNotificationFields = () =>
  NOTIFICATION_FIELD_DEFINITIONS.reduce((fields, item) => {
    fields[item.key] = true;
    return fields;
  }, {});

export const createDefaultNotificationPermissions = () => ({
  actions: createDefaultNotificationActions(),
  fields: createDefaultNotificationFields(),
});

const getNotificationPermissions = (user) => {
  const permissions = user?.granularPermissions?.notifications;

  return {
    actions: {
      ...createDefaultNotificationActions(),
      ...(permissions?.actions || {}),
    },
    fields: {
      ...createDefaultNotificationFields(),
      ...(permissions?.fields || {}),
    },
  };
};

// Admins always have full access — same bypass rule as page-level access.
// "sendToAll"/"sendIndividualSelected" are sub-actions of
// "sendNotification" — never independently effective, so a stored
// `sendToAll: true` next to `sendNotification: false` can never grant
// access on its own.
export const hasNotificationAction = (user, action) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  const actions = getNotificationPermissions(user).actions;

  if (action === "sendToAll" || action === "sendIndividualSelected") {
    return Boolean(actions.sendNotification) && Boolean(actions[action]);
  }

  return Boolean(actions[action]);
};

export const hasNotificationField = (user, field) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  return Boolean(getNotificationPermissions(user).fields[field]);
};

export const getVisibleNotificationFields = (user) => {
  if (!user) return new Set();

  if (user.role === "admin") {
    return new Set(NOTIFICATION_FIELD_DEFINITIONS.map((field) => field.key));
  }

  const fields = getNotificationPermissions(user).fields;

  return new Set(
    NOTIFICATION_FIELD_DEFINITIONS.filter((field) => fields[field.key]).map(
      (field) => field.key
    )
  );
};
