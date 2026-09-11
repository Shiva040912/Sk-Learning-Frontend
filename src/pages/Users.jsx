import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiMail,
  FiPlus,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import toast from "react-hot-toast";

import api from "../services/axios";
import LoadingLogo from "../components/LoadingLogo";
import {
  PAGE_DEFINITIONS,
  createEmptyPagePermissions,
  getCurrentUser,
} from "../utils/permissions";
import {
  STUDENT_ACTION_DEFINITIONS,
  COURSE_SETUP_ACTION_DEFINITIONS,
  BATCH_SETUP_ACTION_DEFINITIONS,
  STUDENT_FIELD_DEFINITIONS,
  createDefaultStudentPermissions,
  deriveStudentActions,
} from "../utils/studentPermissions";
import {
  PAYMENT_ACTION_DEFINITIONS,
  PAYMENT_FIELD_DEFINITIONS,
  PAYMENT_UPI_FIELD_DEFINITIONS,
  createDefaultPaymentPermissions,
} from "../utils/paymentPermissions";
import {
  NOTIFICATION_ACTION_DEFINITIONS,
  SEND_NOTIFICATION_SUB_ACTION_DEFINITIONS,
  NOTIFICATION_FIELD_DEFINITIONS,
  createDefaultNotificationPermissions,
} from "../utils/notificationPermissions";
import {
  INVOICE_ACTION_DEFINITIONS,
  INVOICE_FIELD_DEFINITIONS,
  createDefaultInvoicePermissions,
} from "../utils/invoicePermissions";
import {
  SETTINGS_ACTION_DEFINITIONS,
  createDefaultSettingsPermissions,
} from "../utils/settingsPermissions";
import "../styles/users.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "trainer",
  pagePermissions: createEmptyPagePermissions(),
  granularPermissions: {
    students: createDefaultStudentPermissions(),
    payments: createDefaultPaymentPermissions(),
    notifications: createDefaultNotificationPermissions(),
    invoices: createDefaultInvoicePermissions(),
    settings: createDefaultSettingsPermissions(),
  },
};

const ALL_STUDENT_ACTION_KEYS = [
  ...STUDENT_ACTION_DEFINITIONS,
  ...COURSE_SETUP_ACTION_DEFINITIONS,
  ...BATCH_SETUP_ACTION_DEFINITIONS,
].map((item) => item.key);

const ALL_PAYMENT_ACTION_KEYS = PAYMENT_ACTION_DEFINITIONS.map(
  (item) => item.key
);

const ALL_NOTIFICATION_ACTION_KEYS = [
  ...NOTIFICATION_ACTION_DEFINITIONS,
  ...SEND_NOTIFICATION_SUB_ACTION_DEFINITIONS,
].map((item) => item.key);

const ALL_INVOICE_ACTION_KEYS = INVOICE_ACTION_DEFINITIONS.map(
  (item) => item.key
);

const ALL_SETTINGS_ACTION_KEYS = SETTINGS_ACTION_DEFINITIONS.map(
  (item) => item.key
);

const Users = () => {
  // Frontend gating only — defense-in-depth. The backend independently
  // rejects any role/pagePermissions/granularPermissions change (and any
  // account creation) from a non-admin regardless of what this UI allows.
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      const response = await api.get("/users");

      setUsers(response.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load users"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.role?.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData(initialForm);
    setShowPassword(false);
    setShowFormModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);

    const defaultStudentPermissions = createDefaultStudentPermissions();
    const savedStudentPermissions = user.granularPermissions?.students || {};

    const defaultPaymentPermissions = createDefaultPaymentPermissions();
    const savedPaymentPermissions = user.granularPermissions?.payments || {};

    const defaultNotificationPermissions = createDefaultNotificationPermissions();
    const savedNotificationPermissions =
      user.granularPermissions?.notifications || {};

    const defaultInvoicePermissions = createDefaultInvoicePermissions();
    const savedInvoicePermissions = user.granularPermissions?.invoices || {};

    const defaultSettingsPermissions = createDefaultSettingsPermissions();
    const savedSettingsPermissions = user.granularPermissions?.settings || {};

    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "trainer",
      pagePermissions: {
        ...createEmptyPagePermissions(),
        ...(user.pagePermissions || {}),
      },
      granularPermissions: {
        students: {
          actions: deriveStudentActions({
            ...defaultStudentPermissions.actions,
            ...(savedStudentPermissions.actions || {}),
          }),
          fields: {
            ...defaultStudentPermissions.fields,
            ...(savedStudentPermissions.fields || {}),
          },
        },
        payments: {
          actions: {
            ...defaultPaymentPermissions.actions,
            ...(savedPaymentPermissions.actions || {}),
          },
          fields: {
            ...defaultPaymentPermissions.fields,
            ...(savedPaymentPermissions.fields || {}),
          },
          upiSettings: {
            ...defaultPaymentPermissions.upiSettings,
            ...(savedPaymentPermissions.upiSettings || {}),
          },
        },
        notifications: {
          actions: {
            ...defaultNotificationPermissions.actions,
            ...(savedNotificationPermissions.actions || {}),
          },
          fields: {
            ...defaultNotificationPermissions.fields,
            ...(savedNotificationPermissions.fields || {}),
          },
        },
        invoices: {
          actions: {
            ...defaultInvoicePermissions.actions,
            ...(savedInvoicePermissions.actions || {}),
          },
          fields: {
            ...defaultInvoicePermissions.fields,
            ...(savedInvoicePermissions.fields || {}),
          },
        },
        settings: {
          actions: {
            ...defaultSettingsPermissions.actions,
            ...(savedSettingsPermissions.actions || {}),
          },
        },
      },
    });

    setShowPassword(false);
    setShowFormModal(true);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingUser(null);
    setFormData(initialForm);
    setShowPassword(false);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedUser(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePermissionToggle = (pageKey) => {
    setFormData((current) => ({
      ...current,
      pagePermissions: {
        ...current.pagePermissions,
        [pageKey]: !current.pagePermissions[pageKey],
      },
    }));
  };

  const handleStudentActionToggle = (actionKey) => {
    setFormData((current) => {
      const nextActions = deriveStudentActions({
        ...current.granularPermissions.students.actions,
        [actionKey]: !current.granularPermissions.students.actions[actionKey],
      });

      return {
        ...current,
        granularPermissions: {
          students: {
            ...current.granularPermissions.students,
            actions: nextActions,
          },
        },
      };
    });
  };

  const handleStudentFieldToggle = (fieldKey) => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        students: {
          ...current.granularPermissions.students,
          fields: {
            ...current.granularPermissions.students.fields,
            [fieldKey]: !current.granularPermissions.students.fields[
              fieldKey
            ],
          },
        },
      },
    }));
  };

  const selectAllStudentActions = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        students: {
          ...current.granularPermissions.students,
          actions: deriveStudentActions(
            ALL_STUDENT_ACTION_KEYS.reduce((actions, key) => {
              actions[key] = true;
              return actions;
            }, {})
          ),
        },
      },
    }));
  };

  const clearAllStudentActions = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        students: {
          ...current.granularPermissions.students,
          actions: deriveStudentActions(
            ALL_STUDENT_ACTION_KEYS.reduce((actions, key) => {
              actions[key] = false;
              return actions;
            }, {})
          ),
        },
      },
    }));
  };

  const selectAllStudentFields = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        students: {
          ...current.granularPermissions.students,
          fields: STUDENT_FIELD_DEFINITIONS.reduce((fields, item) => {
            fields[item.key] = true;
            return fields;
          }, {}),
        },
      },
    }));
  };

  const clearAllStudentFields = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        students: {
          ...current.granularPermissions.students,
          fields: STUDENT_FIELD_DEFINITIONS.reduce((fields, item) => {
            fields[item.key] = false;
            return fields;
          }, {}),
        },
      },
    }));
  };

  const handlePaymentActionToggle = (actionKey) => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        payments: {
          ...current.granularPermissions.payments,
          actions: {
            ...current.granularPermissions.payments.actions,
            [actionKey]: !current.granularPermissions.payments.actions[
              actionKey
            ],
          },
        },
      },
    }));
  };

  const handlePaymentFieldToggle = (fieldKey) => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        payments: {
          ...current.granularPermissions.payments,
          fields: {
            ...current.granularPermissions.payments.fields,
            [fieldKey]: !current.granularPermissions.payments.fields[
              fieldKey
            ],
          },
        },
      },
    }));
  };

  const handlePaymentUpiFieldToggle = (fieldKey) => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        payments: {
          ...current.granularPermissions.payments,
          upiSettings: {
            ...current.granularPermissions.payments.upiSettings,
            [fieldKey]: !current.granularPermissions.payments.upiSettings[
              fieldKey
            ],
          },
        },
      },
    }));
  };

  const selectAllPaymentActions = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        payments: {
          ...current.granularPermissions.payments,
          actions: ALL_PAYMENT_ACTION_KEYS.reduce((actions, key) => {
            actions[key] = true;
            return actions;
          }, {}),
        },
      },
    }));
  };

  const clearAllPaymentActions = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        payments: {
          ...current.granularPermissions.payments,
          actions: ALL_PAYMENT_ACTION_KEYS.reduce((actions, key) => {
            actions[key] = false;
            return actions;
          }, {}),
        },
      },
    }));
  };

  const selectAllPaymentFields = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        payments: {
          ...current.granularPermissions.payments,
          fields: PAYMENT_FIELD_DEFINITIONS.reduce((fields, item) => {
            fields[item.key] = true;
            return fields;
          }, {}),
        },
      },
    }));
  };

  const clearAllPaymentFields = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        payments: {
          ...current.granularPermissions.payments,
          fields: PAYMENT_FIELD_DEFINITIONS.reduce((fields, item) => {
            fields[item.key] = false;
            return fields;
          }, {}),
        },
      },
    }));
  };

  const selectAllPaymentUpiFields = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        payments: {
          ...current.granularPermissions.payments,
          upiSettings: PAYMENT_UPI_FIELD_DEFINITIONS.reduce((fields, item) => {
            fields[item.key] = true;
            return fields;
          }, {}),
        },
      },
    }));
  };

  const clearAllPaymentUpiFields = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        payments: {
          ...current.granularPermissions.payments,
          upiSettings: PAYMENT_UPI_FIELD_DEFINITIONS.reduce((fields, item) => {
            fields[item.key] = false;
            return fields;
          }, {}),
        },
      },
    }));
  };

  const handleNotificationActionToggle = (actionKey) => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        notifications: {
          ...current.granularPermissions.notifications,
          actions: {
            ...current.granularPermissions.notifications.actions,
            [actionKey]: !current.granularPermissions.notifications.actions[
              actionKey
            ],
          },
        },
      },
    }));
  };

  const handleNotificationFieldToggle = (fieldKey) => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        notifications: {
          ...current.granularPermissions.notifications,
          fields: {
            ...current.granularPermissions.notifications.fields,
            [fieldKey]: !current.granularPermissions.notifications.fields[
              fieldKey
            ],
          },
        },
      },
    }));
  };

  const selectAllNotificationActions = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        notifications: {
          ...current.granularPermissions.notifications,
          actions: ALL_NOTIFICATION_ACTION_KEYS.reduce((actions, key) => {
            actions[key] = true;
            return actions;
          }, {}),
        },
      },
    }));
  };

  const clearAllNotificationActions = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        notifications: {
          ...current.granularPermissions.notifications,
          actions: ALL_NOTIFICATION_ACTION_KEYS.reduce((actions, key) => {
            actions[key] = false;
            return actions;
          }, {}),
        },
      },
    }));
  };

  const selectAllNotificationFields = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        notifications: {
          ...current.granularPermissions.notifications,
          fields: NOTIFICATION_FIELD_DEFINITIONS.reduce((fields, item) => {
            fields[item.key] = true;
            return fields;
          }, {}),
        },
      },
    }));
  };

  const clearAllNotificationFields = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        notifications: {
          ...current.granularPermissions.notifications,
          fields: NOTIFICATION_FIELD_DEFINITIONS.reduce((fields, item) => {
            fields[item.key] = false;
            return fields;
          }, {}),
        },
      },
    }));
  };

  const handleInvoiceActionToggle = (actionKey) => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        invoices: {
          ...current.granularPermissions.invoices,
          actions: {
            ...current.granularPermissions.invoices.actions,
            [actionKey]: !current.granularPermissions.invoices.actions[
              actionKey
            ],
          },
        },
      },
    }));
  };

  const handleInvoiceFieldToggle = (fieldKey) => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        invoices: {
          ...current.granularPermissions.invoices,
          fields: {
            ...current.granularPermissions.invoices.fields,
            [fieldKey]: !current.granularPermissions.invoices.fields[
              fieldKey
            ],
          },
        },
      },
    }));
  };

  const selectAllInvoiceActions = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        invoices: {
          ...current.granularPermissions.invoices,
          actions: ALL_INVOICE_ACTION_KEYS.reduce((actions, key) => {
            actions[key] = true;
            return actions;
          }, {}),
        },
      },
    }));
  };

  const clearAllInvoiceActions = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        invoices: {
          ...current.granularPermissions.invoices,
          actions: ALL_INVOICE_ACTION_KEYS.reduce((actions, key) => {
            actions[key] = false;
            return actions;
          }, {}),
        },
      },
    }));
  };

  const selectAllInvoiceFields = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        invoices: {
          ...current.granularPermissions.invoices,
          fields: INVOICE_FIELD_DEFINITIONS.reduce((fields, item) => {
            fields[item.key] = true;
            return fields;
          }, {}),
        },
      },
    }));
  };

  const clearAllInvoiceFields = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        invoices: {
          ...current.granularPermissions.invoices,
          fields: INVOICE_FIELD_DEFINITIONS.reduce((fields, item) => {
            fields[item.key] = false;
            return fields;
          }, {}),
        },
      },
    }));
  };

  const handleSettingsActionToggle = (actionKey) => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        settings: {
          ...current.granularPermissions.settings,
          actions: {
            ...current.granularPermissions.settings.actions,
            [actionKey]: !current.granularPermissions.settings.actions[
              actionKey
            ],
          },
        },
      },
    }));
  };

  const selectAllSettingsActions = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        settings: {
          ...current.granularPermissions.settings,
          actions: ALL_SETTINGS_ACTION_KEYS.reduce((actions, key) => {
            actions[key] = true;
            return actions;
          }, {}),
        },
      },
    }));
  };

  const clearAllSettingsActions = () => {
    setFormData((current) => ({
      ...current,
      granularPermissions: {
        ...current.granularPermissions,
        settings: {
          ...current.granularPermissions.settings,
          actions: ALL_SETTINGS_ACTION_KEYS.reduce((actions, key) => {
            actions[key] = false;
            return actions;
          }, {}),
        },
      },
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("User name is required");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      toast.error("Enter a valid email address");
      return false;
    }

    if (!editingUser && formData.password.length < 6) {
      toast.error(
        "Password must contain at least 6 characters"
      );
      return false;
    }

    if (
      editingUser &&
      formData.password &&
      formData.password.length < 6
    ) {
      toast.error(
        "Password must contain at least 6 characters"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSaving(true);

      if (editingUser) {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
        };

        // Only an admin's request may include these — the backend rejects
        // them outright from anyone else, so a non-admin never sends them.
        if (isAdmin) {
          payload.role = formData.role;
          payload.pagePermissions = formData.pagePermissions;
          payload.granularPermissions = formData.granularPermissions;
        }

        if (formData.password.trim()) {
          payload.password = formData.password;
        }

        await api.patch(
          `/users/${editingUser.id}`,
          payload
        );

        toast.success("User updated successfully");
      } else if (isAdmin) {
        await api.post("/users/create-admin", {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          pagePermissions: formData.pagePermissions,
          granularPermissions: formData.granularPermissions,
        });

        toast.success("User created successfully");
      }

      closeFormModal();
      await fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to save user"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await api.delete(
        `/users/${selectedUser.id}`
      );

      toast.success("User deleted successfully");

      setShowDeleteModal(false);
      setSelectedUser(null);

      await fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete user"
      );
    }
  };

  const formatRole = (role) => {
    if (!role) return "Administrator";

    return role
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  return (
    <div className="users-page">
<section className="users-directory">
        <div className="users-toolbar">
          <div className="users-search">
            <FiSearch />

            <input
              type="text"
              placeholder="Search name, email or role..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          {isAdmin && (
            <button
              type="button"
              className="add-user-btn"
              onClick={openAddModal}
            >
              <FiPlus />
              <span>Add User</span>
            </button>
          )}
        </div>

        <div className="users-table-card">
          {isLoading ? (
            <div className="users-message">
              <LoadingLogo />
              <span>Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="users-message">
              <FiUsers />

              <strong>No users found</strong>

              <span>
                Try changing your search
              </span>
            </div>
          ) : (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user.name
                              ?.charAt(0)
                              ?.toUpperCase() || "A"}
                          </div>

                          <div className="user-name">
                            <strong>
                              {user.name}
                            </strong>

                            <span>
                              {formatRole(user.role)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="user-email-cell">
                          <FiMail />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      <td>
                        <span className="user-role-badge">
                          <FiShield />

                          {formatRole(user.role)}
                        </span>
                      </td>

                      <td>
                        <div className="user-actions">
                          <button
                            type="button"
                            title="View User"
                            onClick={() =>
                              openViewModal(user)
                            }
                          >
                            <FiEye />
                          </button>

                          <button
                            type="button"
                            title="Edit User"
                            onClick={() =>
                              openEditModal(user)
                            }
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            type="button"
                            className="user-delete-btn"
                            title="Delete User"
                            onClick={() =>
                              openDeleteModal(user)
                            }
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
{showFormModal && (
        <div className="user-modal-overlay">
          <div className="user-modal user-form-modal">
            <div className="user-modal-header">
              <div className="user-modal-title">
                <div className="user-modal-icon">
                  <FiUser />
                </div>

                <div>
                  <h2>
                    {editingUser
                      ? "Edit User"
                      : "Add User"}
                  </h2>

                  <p>
                    {editingUser
                      ? "Update user account details"
                      : "Create a new portal user account"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="user-modal-close"
                onClick={closeFormModal}
              >
                <FiX />
              </button>
            </div>

            <form
              className="user-form"
              onSubmit={handleSubmit}
            >
              <div className="user-form-group">
                <label>User Name *</label>

                <div className="user-input-box">
                  <FiUser />

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter user name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="user-form-group">
                <label>Email Address *</label>

                <div className="user-input-box">
                  <FiMail />

                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="user-form-group">
                <label>
                  {editingUser
                    ? "New Password"
                    : "Password *"}
                </label>

                <div className="user-input-box">
                  <FiLock />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current password"
                        : "Minimum 6 characters"
                    }
                    value={formData.password}
                    onChange={handleChange}
                  />

                  <button
                    type="button"
                    className="user-password-toggle"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {editingUser && (
                  <small className="password-help">
                    Password change panna venam na blank-ah
                    vidu.
                  </small>
                )}
              </div>

              {isAdmin && (
              <>
              <div className="user-form-group">
                <label>Role *</label>

                <div className="user-input-box user-select-box">
                  <FiShield />

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="admin">
                      Administrator
                    </option>

                    <option value="trainer">
                     Trainer
                    </option>
                  </select>
                </div>
              </div>

              <div className="user-form-group">
                <label>Page Access</label>

                {formData.role === "admin" ? (
                  <p className="user-permission-admin-note">
                    Administrators automatically have access to every page.
                  </p>
                ) : (
                  <div className="user-permission-grid">
                    {PAGE_DEFINITIONS.map((page) => (
                      <label
                        key={page.key}
                        className="user-permission-checkbox"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(
                            formData.pagePermissions[page.key]
                          )}
                          onChange={() =>
                            handlePermissionToggle(page.key)
                          }
                        />
                        <span>{page.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {formData.role !== "admin" &&
                formData.pagePermissions.students && (
                  <div className="user-form-group student-permissions-panel">
                    <label>Students — Granular Permissions</label>

                    <div className="student-permission-section">
                      <div className="student-permission-section-header">
                        <strong>Actions</strong>

                        <div className="student-permission-bulk-actions">
                          <button
                            type="button"
                            onClick={selectAllStudentActions}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearAllStudentActions}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="user-permission-grid">
                        {STUDENT_ACTION_DEFINITIONS.map((action) => {
                          const isBulkUpload = action.key === "bulkUpload";

                          return (
                            <label
                              key={action.key}
                              className={`user-permission-checkbox${
                                isBulkUpload ? " locked" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(
                                  formData.granularPermissions.students
                                    .actions[action.key]
                                )}
                                disabled={isBulkUpload}
                                onChange={() =>
                                  handleStudentActionToggle(action.key)
                                }
                              />
                              <span>
                                {action.label}
                                {isBulkUpload && (
                                  <small> (follows Add Student)</small>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="student-permission-subsection">
                        <span className="student-permission-subsection-title">
                          Course Setup
                        </span>

                        <div className="user-permission-grid">
                          {COURSE_SETUP_ACTION_DEFINITIONS.map((action) => (
                            <label
                              key={action.key}
                              className="user-permission-checkbox"
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(
                                  formData.granularPermissions.students
                                    .actions[action.key]
                                )}
                                onChange={() =>
                                  handleStudentActionToggle(action.key)
                                }
                              />
                              <span>{action.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="student-permission-subsection">
                        <span className="student-permission-subsection-title">
                          Batch Setup
                        </span>

                        <div className="user-permission-grid">
                          {BATCH_SETUP_ACTION_DEFINITIONS.map((action) => (
                            <label
                              key={action.key}
                              className="user-permission-checkbox"
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(
                                  formData.granularPermissions.students
                                    .actions[action.key]
                                )}
                                onChange={() =>
                                  handleStudentActionToggle(action.key)
                                }
                              />
                              <span>{action.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="student-permission-section">
                      <div className="student-permission-section-header">
                        <strong>Fields</strong>

                        <div className="student-permission-bulk-actions">
                          <button
                            type="button"
                            onClick={selectAllStudentFields}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearAllStudentFields}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="user-permission-grid">
                        {STUDENT_FIELD_DEFINITIONS.map((field) => (
                          <label
                            key={field.key}
                            className="user-permission-checkbox"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(
                                formData.granularPermissions.students.fields[
                                  field.key
                                ]
                              )}
                              onChange={() =>
                                handleStudentFieldToggle(field.key)
                              }
                            />
                            <span>{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {formData.role !== "admin" &&
                formData.pagePermissions.payments && (
                  <div className="user-form-group student-permissions-panel">
                    <label>Payments — Granular Permissions</label>

                    <div className="student-permission-section">
                      <div className="student-permission-section-header">
                        <strong>Actions</strong>

                        <div className="student-permission-bulk-actions">
                          <button
                            type="button"
                            onClick={selectAllPaymentActions}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearAllPaymentActions}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="user-permission-grid">
                        {PAYMENT_ACTION_DEFINITIONS.map((action) => (
                          <label
                            key={action.key}
                            className="user-permission-checkbox"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(
                                formData.granularPermissions.payments
                                  .actions[action.key]
                              )}
                              onChange={() =>
                                handlePaymentActionToggle(action.key)
                              }
                            />
                            <span>{action.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="student-permission-section">
                      <div className="student-permission-section-header">
                        <strong>Fields</strong>

                        <div className="student-permission-bulk-actions">
                          <button
                            type="button"
                            onClick={selectAllPaymentFields}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearAllPaymentFields}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="user-permission-grid">
                        {PAYMENT_FIELD_DEFINITIONS.map((field) => (
                          <label
                            key={field.key}
                            className="user-permission-checkbox"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(
                                formData.granularPermissions.payments.fields[
                                  field.key
                                ]
                              )}
                              onChange={() =>
                                handlePaymentFieldToggle(field.key)
                              }
                            />
                            <span>{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="student-permission-section">
                      <div className="student-permission-section-header">
                        <strong>UPI Settings</strong>

                        <div className="student-permission-bulk-actions">
                          <button
                            type="button"
                            onClick={selectAllPaymentUpiFields}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearAllPaymentUpiFields}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="user-permission-grid">
                        {PAYMENT_UPI_FIELD_DEFINITIONS.map((field) => (
                          <label
                            key={field.key}
                            className="user-permission-checkbox"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(
                                formData.granularPermissions.payments
                                  .upiSettings[field.key]
                              )}
                              onChange={() =>
                                handlePaymentUpiFieldToggle(field.key)
                              }
                            />
                            <span>{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {formData.role !== "admin" &&
                formData.pagePermissions.notifications && (
                  <div className="user-form-group student-permissions-panel">
                    <label>Notifications — Granular Permissions</label>

                    <div className="student-permission-section">
                      <div className="student-permission-section-header">
                        <strong>Actions</strong>

                        <div className="student-permission-bulk-actions">
                          <button
                            type="button"
                            onClick={selectAllNotificationActions}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearAllNotificationActions}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="user-permission-grid">
                        {NOTIFICATION_ACTION_DEFINITIONS.map((action) => (
                          <label
                            key={action.key}
                            className="user-permission-checkbox"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(
                                formData.granularPermissions.notifications
                                  .actions[action.key]
                              )}
                              onChange={() =>
                                handleNotificationActionToggle(action.key)
                              }
                            />
                            <span>{action.label}</span>
                          </label>
                        ))}
                      </div>

                      <div className="student-permission-subsection">
                        <span className="student-permission-subsection-title">
                          Send Notification — Sub-actions
                        </span>

                        <div className="user-permission-grid">
                          {SEND_NOTIFICATION_SUB_ACTION_DEFINITIONS.map(
                            (action) => (
                              <label
                                key={action.key}
                                className="user-permission-checkbox"
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(
                                    formData.granularPermissions.notifications
                                      .actions[action.key]
                                  )}
                                  onChange={() =>
                                    handleNotificationActionToggle(action.key)
                                  }
                                />
                                <span>{action.label}</span>
                              </label>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="student-permission-section">
                      <div className="student-permission-section-header">
                        <strong>Fields</strong>

                        <div className="student-permission-bulk-actions">
                          <button
                            type="button"
                            onClick={selectAllNotificationFields}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearAllNotificationFields}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="user-permission-grid">
                        {NOTIFICATION_FIELD_DEFINITIONS.map((field) => (
                          <label
                            key={field.key}
                            className="user-permission-checkbox"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(
                                formData.granularPermissions.notifications
                                  .fields[field.key]
                              )}
                              onChange={() =>
                                handleNotificationFieldToggle(field.key)
                              }
                            />
                            <span>{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {formData.role !== "admin" &&
                formData.pagePermissions.invoices && (
                  <div className="user-form-group student-permissions-panel">
                    <label>Invoices — Granular Permissions</label>

                    <div className="student-permission-section">
                      <div className="student-permission-section-header">
                        <strong>Actions</strong>

                        <div className="student-permission-bulk-actions">
                          <button
                            type="button"
                            onClick={selectAllInvoiceActions}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearAllInvoiceActions}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="user-permission-grid">
                        {INVOICE_ACTION_DEFINITIONS.map((action) => (
                          <label
                            key={action.key}
                            className="user-permission-checkbox"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(
                                formData.granularPermissions.invoices
                                  .actions[action.key]
                              )}
                              onChange={() =>
                                handleInvoiceActionToggle(action.key)
                              }
                            />
                            <span>{action.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="student-permission-section">
                      <div className="student-permission-section-header">
                        <strong>Fields</strong>

                        <div className="student-permission-bulk-actions">
                          <button
                            type="button"
                            onClick={selectAllInvoiceFields}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearAllInvoiceFields}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="user-permission-grid">
                        {INVOICE_FIELD_DEFINITIONS.map((field) => (
                          <label
                            key={field.key}
                            className="user-permission-checkbox"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(
                                formData.granularPermissions.invoices.fields[
                                  field.key
                                ]
                              )}
                              onChange={() =>
                                handleInvoiceFieldToggle(field.key)
                              }
                            />
                            <span>{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {formData.role !== "admin" &&
                formData.pagePermissions.settings && (
                  <div className="user-form-group student-permissions-panel">
                    <label>Settings — Granular Permissions</label>

                    <div className="student-permission-section">
                      <div className="student-permission-section-header">
                        <strong>Sections</strong>

                        <div className="student-permission-bulk-actions">
                          <button
                            type="button"
                            onClick={selectAllSettingsActions}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearAllSettingsActions}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="user-permission-grid">
                        {SETTINGS_ACTION_DEFINITIONS.map((action) => (
                          <label
                            key={action.key}
                            className="user-permission-checkbox"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(
                                formData.granularPermissions.settings
                                  .actions[action.key]
                              )}
                              onChange={() =>
                                handleSettingsActionToggle(action.key)
                              }
                            />
                            <span>{action.label}</span>
                          </label>
                        ))}
                      </div>

                      <p className="password-help">
                        Course & Batch and Mobile Layout have no separate
                        permission — Course & Batch follows the Students
                        page's Add/Delete Course/Batch permissions, and
                        Mobile Layout is a personal device preference.
                      </p>
                    </div>
                  </div>
                )}
              </>
              )}

              <div className="user-form-actions">
                <button
                  type="button"
                  className="user-secondary-btn"
                  onClick={closeFormModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="user-primary-btn"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingUser
                      ? "Update User"
                      : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
{showViewModal && selectedUser && (
        <div className="user-modal-overlay">
          <div className="user-profile-modal">
            <button
              type="button"
              className="user-profile-close"
              onClick={closeViewModal}
            >
              <FiX />
            </button>

            <div className="user-profile-top">
              <span>THE SK LEARNINGS</span>

              <small>
                {formatRole(selectedUser.role).toUpperCase()} PROFILE
              </small>
            </div>

            <div className="user-profile-main">
              <div className="user-profile-avatar">
                {selectedUser.name
                  ?.charAt(0)
                  ?.toUpperCase() || "A"}
              </div>

              <div>
                <span className="user-profile-label">
                  USER NAME
                </span>

                <h2>{selectedUser.name}</h2>

                <div className="user-profile-role">
                  <FiShield />
                  {formatRole(selectedUser.role)}
                </div>
              </div>
            </div>

            <div className="user-profile-details">
              <div className="user-profile-detail">
                <div>
                  <FiMail />
                </div>

                <span>Email Address</span>

                <strong>
                  {selectedUser.email}
                </strong>
              </div>

              <div className="user-profile-detail">
                <div>
                  <FiShield />
                </div>

                <span>Account Role</span>

                <strong>
                  {formatRole(
                    selectedUser.role
                  )}
                </strong>
              </div>
            </div>

            <div className="user-profile-footer">
              <span>
                MEDICAL • ENGINEERING • FOUNDATIONS •
                JUNIOR IAS
              </span>

              <strong>
                THE SK LEARNINGS
              </strong>
            </div>
          </div>
        </div>
      )}
{showDeleteModal && selectedUser && (
        <div className="user-modal-overlay">
          <div className="user-delete-modal">
            <div className="user-delete-icon">
              <FiTrash2 />
            </div>

            <h2>Delete User?</h2>

            <p>
              <strong>{selectedUser.name}</strong>{" "}
              account delete panna sure-ah? Indha action
              undo panna mudiyadhu.
            </p>

            <div className="user-delete-actions">
              <button
                type="button"
                className="user-secondary-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="user-confirm-delete"
                onClick={handleDelete}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
