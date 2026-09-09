// Single source of truth for the Invoices page's granular permission shape —
// mirrors paymentPermissions.js/notificationPermissions.js one page over.
// Every place that reads/edits these (the Users form, the Invoices page)
// goes through the helpers here instead of reaching into
// `user.granularPermissions` directly.
//
// There is deliberately ONE Fields list — a field is configured once and
// that single flag controls it everywhere it's displayed (receipt-board row
// and the opened invoice document alike). Built from the actual
// Invoice.jsx/InvoiceDocument.jsx implementation: no Create/Edit/Delete-
// single/Send action exists, since invoices are generated automatically by
// the Payments flow, never authored on this page.

export const INVOICE_ACTION_DEFINITIONS = [
  { key: "search", label: "Search" },
  { key: "filter", label: "Filter" },
  { key: "viewInvoice", label: "View Invoice" },
  { key: "downloadInvoice", label: "Download Invoice" },
  { key: "printInvoice", label: "Print Invoice" },
  { key: "clearInvoices", label: "Clear Invoices" },
];

export const INVOICE_FIELD_DEFINITIONS = [
  { key: "studentName", label: "Student Name" },
  { key: "rollNo", label: "Roll No" },
  { key: "course", label: "Course" },
  { key: "batch", label: "Batch" },
  { key: "parentName", label: "Parent Name" },
  { key: "phone", label: "Phone" },
  { key: "invoiceNumber", label: "Invoice Number" },
  { key: "invoiceDate", label: "Invoice Date" },
  { key: "dueDate", label: "Due Date" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "paidAmount", label: "Paid Amount" },
  { key: "pendingAmount", label: "Pending Amount" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "paymentMethod", label: "Payment Method" },
];

// Actions are deny-by-default: an Admin has to explicitly grant each one to
// a new user.
export const createDefaultInvoiceActions = () =>
  INVOICE_ACTION_DEFINITIONS.reduce((actions, item) => {
    actions[item.key] = false;
    return actions;
  }, {});

// Fields are visible-by-default: turning Invoices page access on shows the
// full board/document exactly as before, until an Admin deliberately hides
// a field.
export const createDefaultInvoiceFields = () =>
  INVOICE_FIELD_DEFINITIONS.reduce((fields, item) => {
    fields[item.key] = true;
    return fields;
  }, {});

export const createDefaultInvoicePermissions = () => ({
  actions: createDefaultInvoiceActions(),
  fields: createDefaultInvoiceFields(),
});

const getInvoicePermissions = (user) => {
  const permissions = user?.granularPermissions?.invoices;

  return {
    actions: {
      ...createDefaultInvoiceActions(),
      ...(permissions?.actions || {}),
    },
    fields: {
      ...createDefaultInvoiceFields(),
      ...(permissions?.fields || {}),
    },
  };
};

// Admins always have full access — same bypass rule as page-level access.
export const hasInvoiceAction = (user, action) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  return Boolean(getInvoicePermissions(user).actions[action]);
};

export const hasInvoiceField = (user, field) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  return Boolean(getInvoicePermissions(user).fields[field]);
};

export const getVisibleInvoiceFields = (user) => {
  if (!user) return new Set();

  if (user.role === "admin") {
    return new Set(INVOICE_FIELD_DEFINITIONS.map((field) => field.key));
  }

  const fields = getInvoicePermissions(user).fields;

  return new Set(
    INVOICE_FIELD_DEFINITIONS.filter((field) => fields[field.key]).map(
      (field) => field.key
    )
  );
};
