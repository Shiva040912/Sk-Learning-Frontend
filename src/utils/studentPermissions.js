// Single source of truth for the Students page's granular permission shape —
// mirrors permissions.js's page-level pattern one level deeper. Every place
// that reads/edits these (the Users form, the Students page) goes through
// the helpers here instead of reaching into `user.granularPermissions`
// directly, so the rules only ever live in one place.
//
// There is deliberately ONE field permission list (not separate
// columns/details lists) — a field is configured once and that single flag
// controls it everywhere it's displayed (table column and profile popup
// alike). S.No and the row Actions buttons are table controls, not student
// data, and are never part of this list.

export const STUDENT_ACTION_DEFINITIONS = [
  { key: "view", label: "View Student" },
  { key: "add", label: "Add Student" },
  { key: "edit", label: "Edit Student" },
  { key: "delete", label: "Delete Student" },
  // Not independently toggleable — always mirrors "add". See
  // deriveStudentActions below and the Users.jsx checkbox that renders it
  // locked/disabled.
  { key: "bulkUpload", label: "Bulk Upload" },
];

export const COURSE_SETUP_ACTION_DEFINITIONS = [
  { key: "addCourse", label: "Add Course" },
  { key: "deleteCourse", label: "Delete Course" },
];

export const BATCH_SETUP_ACTION_DEFINITIONS = [
  { key: "addBatch", label: "Add Batch" },
  { key: "deleteBatch", label: "Delete Batch" },
];

export const STUDENT_FIELD_DEFINITIONS = [
  { key: "studentName", label: "Student Name" },
  { key: "rollNo", label: "Roll No" },
  { key: "parentName", label: "Parent Name" },
  { key: "dateOfBirth", label: "Date of Birth" },
  { key: "gender", label: "Gender" },
  { key: "phone", label: "Phone" },
  { key: "alternatePhone", label: "Alternate Phone" },
  { key: "email", label: "Email" },
  { key: "course", label: "Course" },
  { key: "idproof", label: "Aadhaar Number" },
  { key: "batch", label: "Batch" },
  { key: "schoolName", label: "School Name" },
  { key: "address", label: "Address" },
];

// Actions are deny-by-default: an Admin has to explicitly grant each one to
// a new user.
export const createDefaultStudentActions = () =>
  [...STUDENT_ACTION_DEFINITIONS, ...COURSE_SETUP_ACTION_DEFINITIONS, ...BATCH_SETUP_ACTION_DEFINITIONS].reduce(
    (actions, item) => {
      actions[item.key] = false;
      return actions;
    },
    {}
  );

// Fields are visible-by-default: turning Students page access on shows the
// full table/popup exactly as before, until an Admin deliberately hides a
// field.
export const createDefaultStudentFields = () =>
  STUDENT_FIELD_DEFINITIONS.reduce((fields, item) => {
    fields[item.key] = true;
    return fields;
  }, {});

export const createDefaultStudentPermissions = () => ({
  actions: createDefaultStudentActions(),
  fields: createDefaultStudentFields(),
});

// Bulk Upload is never independent — it is always exactly what Add Student
// is. Call this whenever "add" changes, or before sending permissions to
// the backend (which re-derives it anyway, but keeping the client state in
// sync avoids a flash of the wrong checked state).
export const deriveStudentActions = (actions) => ({
  ...actions,
  bulkUpload: Boolean(actions?.add),
});

const getStudentPermissions = (user) => {
  const permissions = user?.granularPermissions?.students;

  return {
    actions: deriveStudentActions({
      ...createDefaultStudentActions(),
      ...(permissions?.actions || {}),
    }),
    fields: {
      ...createDefaultStudentFields(),
      ...(permissions?.fields || {}),
    },
  };
};

// Admins always have full access — same bypass rule as page-level access.
export const hasStudentAction = (user, action) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  return Boolean(getStudentPermissions(user).actions[action]);
};

export const hasStudentField = (user, field) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  return Boolean(getStudentPermissions(user).fields[field]);
};

export const getVisibleStudentFields = (user) => {
  if (!user) return new Set();

  if (user.role === "admin") {
    return new Set(STUDENT_FIELD_DEFINITIONS.map((field) => field.key));
  }

  const fields = getStudentPermissions(user).fields;

  return new Set(
    STUDENT_FIELD_DEFINITIONS.filter((field) => fields[field.key]).map(
      (field) => field.key
    )
  );
};

// The Actions column only earns its place if at least one row-level action
// (View/Edit/Delete) is actually available to this user.
export const hasAnyRowAction = (user) =>
  hasStudentAction(user, "view") ||
  hasStudentAction(user, "edit") ||
  hasStudentAction(user, "delete");
