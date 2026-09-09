// Single source of truth for the Payments page's granular permission shape —
// mirrors studentPermissions.js one page over. Every place that reads/edits
// these (the Users form, the Payments page) goes through the helpers here
// instead of reaching into `user.granularPermissions` directly.
//
// There is deliberately ONE Fields list (not separate columns/details
// lists) — a field is configured once and that single flag controls it
// everywhere it's displayed (table column, details modal and history modal
// alike). UPI Settings is a separate list because it is global payment
// receiver configuration, not per-student data. Monthly Installment fields
// (selectedMonths, monthlyAmount, monthlyInstallments, paidMonths) are
// deliberately absent — that flow is dead in the live Payments UI.

export const PAYMENT_ACTION_DEFINITIONS = [
  { key: "search", label: "Search" },
  { key: "filter", label: "Filter" },
  { key: "upiSettings", label: "UPI Settings" },
  { key: "feeSetupIndividual", label: "Fee Setup — Individual" },
  { key: "feeSetupCommon", label: "Fee Setup — Common" },
  { key: "feeSetupCourseWise", label: "Fee Setup — Course Wise" },
  { key: "collectPayment", label: "Collect Payment" },
  { key: "reverseResetFeeSetup", label: "Reverse / Reset Fee Setup" },
  { key: "viewStudentPaymentDetails", label: "View Student Payment Details" },
  { key: "editFee", label: "Edit Fee" },
  { key: "addPartPayment", label: "Add Part Payment" },
  { key: "viewPaymentHistory", label: "View Payment History" },
  { key: "clearPaymentHistory", label: "Clear Payment History" },
  { key: "assignNextFee", label: "Assign Next Fee / Start New Cycle" },
];

export const PAYMENT_FIELD_DEFINITIONS = [
  { key: "studentName", label: "Student Name" },
  { key: "rollNo", label: "Roll No" },
  { key: "course", label: "Course" },
  { key: "batch", label: "Batch" },
  { key: "feeDetails", label: "Fee Details" },
  { key: "totalFee", label: "Total Fee" },
  { key: "feeType", label: "Fee Type" },
  { key: "feeStartingDate", label: "Fee Starting Date" },
  { key: "feeEndingDate", label: "Due Date" },
  { key: "feeSetupCompleted", label: "Fee Setup Completed" },
  { key: "paidAmount", label: "Paid Amount" },
  { key: "pendingAmount", label: "Pending Amount" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "paymentMethod", label: "Payment Method" },
  { key: "paymentDate", label: "Payment Date" },
];

// "Fee Details" is a master financial-information visibility switch on top
// of the individual field flags above — mirrors FEE_DETAIL_FIELD_KEYS on the
// backend (payment-permission-keys.ts). studentName/rollNo/course/batch/
// paymentStatus/paymentMethod/paymentDate are not fee/financial amounts or
// configuration, so they are deliberately excluded and stay independently
// controlled. feeSetupCompleted is ALSO deliberately excluded: it's a plain
// readiness flag (no amount/date disclosed), and Payment.jsx uses its raw
// boolean value to decide whether Collect Payment, Reverse/Reset, Edit Fee,
// Assign Next Fee and View History are even reachable for a student —
// gating it here broke every one of those for any Fee-Details-off user
// regardless of their actual action permissions.
export const FEE_DETAIL_FIELD_KEYS = [
  "totalFee",
  "feeType",
  "feeStartingDate",
  "feeEndingDate",
  "paidAmount",
  "pendingAmount",
];

export const PAYMENT_UPI_FIELD_DEFINITIONS = [
  { key: "upiId", label: "UPI ID" },
  { key: "receiverName", label: "Receiver Name" },
  { key: "paymentPhone", label: "Payment Phone" },
  { key: "upiQrImage", label: "UPI QR Image" },
];

// Actions are deny-by-default: an Admin has to explicitly grant each one to
// a new user.
export const createDefaultPaymentActions = () =>
  PAYMENT_ACTION_DEFINITIONS.reduce((actions, item) => {
    actions[item.key] = false;
    return actions;
  }, {});

// Fields (and UPI Settings fields) are visible-by-default: turning Payments
// page access on shows the full table/modals exactly as before, until an
// Admin deliberately hides a field.
export const createDefaultPaymentFields = () =>
  PAYMENT_FIELD_DEFINITIONS.reduce((fields, item) => {
    fields[item.key] = true;
    return fields;
  }, {});

export const createDefaultPaymentUpiFields = () =>
  PAYMENT_UPI_FIELD_DEFINITIONS.reduce((fields, item) => {
    fields[item.key] = true;
    return fields;
  }, {});

export const createDefaultPaymentPermissions = () => ({
  actions: createDefaultPaymentActions(),
  fields: createDefaultPaymentFields(),
  upiSettings: createDefaultPaymentUpiFields(),
});

// "Fee Details" master switch: when off, none of FEE_DETAIL_FIELD_KEYS may
// be visible regardless of their own individual flag (master AND
// individual, never OR). This is the single reusable answer to "can this
// user see fee details on Payments?" — applied once here so every consumer
// of getPaymentPermissions (hasPaymentField, getVisiblePaymentFields, and
// therefore every `visibleFields.has(...)` check across Payment.jsx)
// automatically respects it with no per-call-site changes needed.
const resolveEffectivePaymentFields = (fields) => {
  if (fields.feeDetails === true) {
    return fields;
  }

  const effective = { ...fields };

  FEE_DETAIL_FIELD_KEYS.forEach((key) => {
    effective[key] = false;
  });

  return effective;
};

const getPaymentPermissions = (user) => {
  const permissions = user?.granularPermissions?.payments;

  return {
    actions: {
      ...createDefaultPaymentActions(),
      ...(permissions?.actions || {}),
    },
    fields: resolveEffectivePaymentFields({
      ...createDefaultPaymentFields(),
      ...(permissions?.fields || {}),
    }),
    upiSettings: {
      ...createDefaultPaymentUpiFields(),
      ...(permissions?.upiSettings || {}),
    },
  };
};

// Admins always have full access — same bypass rule as page-level access.
export const hasPaymentAction = (user, action) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  return Boolean(getPaymentPermissions(user).actions[action]);
};

export const hasPaymentField = (user, field) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  return Boolean(getPaymentPermissions(user).fields[field]);
};

export const hasPaymentUpiField = (user, field) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  return Boolean(getPaymentPermissions(user).upiSettings[field]);
};

export const getVisiblePaymentFields = (user) => {
  if (!user) return new Set();

  if (user.role === "admin") {
    return new Set(PAYMENT_FIELD_DEFINITIONS.map((field) => field.key));
  }

  const fields = getPaymentPermissions(user).fields;

  return new Set(
    PAYMENT_FIELD_DEFINITIONS.filter((field) => fields[field.key]).map(
      (field) => field.key
    )
  );
};

export const getVisiblePaymentUpiFields = (user) => {
  if (!user) return new Set();

  if (user.role === "admin") {
    return new Set(PAYMENT_UPI_FIELD_DEFINITIONS.map((field) => field.key));
  }

  const upiSettings = getPaymentPermissions(user).upiSettings;

  return new Set(
    PAYMENT_UPI_FIELD_DEFINITIONS.filter(
      (field) => upiSettings[field.key]
    ).map((field) => field.key)
  );
};
