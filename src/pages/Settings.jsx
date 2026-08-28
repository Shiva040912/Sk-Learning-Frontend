


import { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiBookOpen,
  FiCheckCircle,
  FiCreditCard,
  FiFileText,
  FiImage,
  FiLock,
  FiSave,
  FiSmartphone,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";

import api from "../services/axios";
import LoadingLogo from "../components/LoadingLogo";

import "../styles/settings.css";

const initialProfile = {
  name: "",
  email: "",
  phone: "",
  profileImage: "",
};

const initialPassword = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const initialSettings = {
  monthlyFeeEnabled: true,
  defaultMonths: 12,
  minimumMonths: 1,
  maximumMonths: 12,

  partialFeeEnabled: true,
  minimumPartialAmount: 10000,

  yearlyFeeEnabled: true,

  commonFeeSetupEnabled: true,
  courseWiseFeeSetupEnabled: true,
  recurringFeeStartDay: 1,
  recurringFeeDueDay: 10,

  whatsappEnabled: false,
  reminderDaysBeforeDue: 3,
  reminderOnDueDate: true,
  overdueReminderEnabled: true,
  overdueReminderIntervalDays: 3,

  invoiceEnabled: false,
  invoicePrefix: "SK-INV",
  invoiceSuffix: "",
  invoiceQrCode: "",
  gstNumber: "",
  ownerName: "",
  invoiceAddress: "",
  invoiceFooter: "",
  invoiceTerms: "",
};

const Settings = () => {
  const [mobileNavLayout, setMobileNavLayout] = useState(
    () => {
      const savedLayout = localStorage.getItem("mobileNavLayout");
      return savedLayout === "rail" ? "drawer" : savedLayout || "drawer";
    }
  );
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(initialProfile);
  const [passwordForm, setPasswordForm] = useState(initialPassword);
  const [settings, setSettings] = useState(initialSettings);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [newCourseName, setNewCourseName] = useState("");
  const [newBatch, setNewBatch] = useState({
    batchName: "",
    startTime: "",
    endTime: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [isAcademicSaving, setIsAcademicSaving] = useState(false);

  const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;

    if (!error?.response) {
      return "Unable to connect to the server. Please check the backend and try again.";
    }

    if (Array.isArray(data?.message)) {
      return data.message.filter(Boolean).join(", ");
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message.trim();
    }

    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error.trim();
    }

    if (error.response.status === 401) {
      return "Your session has expired. Please login again.";
    }

    if (error.response.status === 403) {
      return "You do not have permission to perform this action.";
    }

    if (error.response.status === 404) {
      return "Requested settings resource was not found.";
    }

    if (error.response.status === 409) {
      return "This information already exists.";
    }

    return fallback;
  };

  const fetchSettingsData = async () => {
    try {
      setIsLoading(true);

      const [
        profileResponse,
        settingsResponse,
        courseResponse,
        batchResponse,
      ] = await Promise.all([
        api.get("/users/me/profile"),
        api.get("/settings"),
        api.get("/academic/courses"),
        api.get("/academic/batches"),
      ]);

      setProfile({
        name: profileResponse.data?.name || "",
        email: profileResponse.data?.email || "",
        phone: profileResponse.data?.phone || "",
        profileImage: profileResponse.data?.profileImage || "",
      });

      setSettings((current) => ({
        ...current,
        ...(settingsResponse.data || {}),
      }));

      setCourses(courseResponse.data || []);
      setBatches(batchResponse.data || []);
    } catch (error) {
      console.error("Settings load error:", error?.response?.data || error);
      toast.error(getErrorMessage(error, "Failed to load settings"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const tabs = useMemo(
    () => [
      {
        id: "profile",
        label: "Profile",
        icon: <FiUser />,
      },
      {
        id: "fees",
        label: "Fee Settings",
        icon: <FiCreditCard />,
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: <FiBell />,
      },
      {
        id: "academic",
        label: "Course & Batch",
        icon: <FiBookOpen />,
      },
      {
        id: "invoice",
        label: "Invoice",
        icon: <FiFileText />,
      },
      {
        id: "appearance",
        label: "Mobile Layout",
        icon: <FiSmartphone />,
      },
    ],
    []
  );

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleProfilePhotoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile photo must be 2MB or smaller");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 512;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext("2d");
        const sourceSize = Math.min(image.width, image.height);
        const sourceX = (image.width - sourceSize) / 2;
        const sourceY = (image.height - sourceSize) / 2;

        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          size,
          size,
        );

        setProfile((current) => ({
          ...current,
          profileImage: canvas.toDataURL("image/jpeg", 0.82),
        }));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    if (!profile.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!profile.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (
      profile.phone.trim() &&
      !/^[6-9]\d{9}$/.test(profile.phone.trim())
    ) {
      toast.error("Phone number must be 10 digits and start with 6, 7, 8 or 9");
      return;
    }

    try {
      setIsProfileSaving(true);

      const response = await api.patch("/users/me/profile", {
        name: profile.name.trim(),
        email: profile.email.trim().toLowerCase(),
        phone: profile.phone.trim() || undefined,
        profileImage: profile.profileImage.trim(),
      });

      const updatedUser = response.data?.user;

      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent("profile-updated", {
          detail: updatedUser,
        }));

        setProfile({
          name: updatedUser.name || "",
          email: updatedUser.email || "",
          phone: updatedUser.phone || "",
          profileImage: updatedUser.profileImage || "",
        });
      }

      toast.success(response.data?.message || "Profile updated successfully");
    } catch (error) {
      console.error("Profile update error:", error?.response?.data || error);
      toast.error(getErrorMessage(error, "Failed to update profile"));
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must contain at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      setIsPasswordSaving(true);

      const response = await api.patch("/users/me/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success(response.data?.message || "Password changed successfully");
      setPasswordForm(initialPassword);
    } catch (error) {
      console.error("Password update error:", error?.response?.data || error);
      toast.error(getErrorMessage(error, "Failed to change password"));
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleSettingsChange = (event) => {
    const { name, value, type, checked } = event.target;

    let nextValue = value;

    if (type === "checkbox") {
      nextValue = checked;
    } else if (type === "number") {
      nextValue = value === "" ? "" : Number(value);
    }

    setSettings((current) => ({
      ...current,
      [name]: nextValue,
    }));
  };

  const saveSettings = async (fields, successMessage) => {
    const payload = {};

    fields.forEach((field) => {
      payload[field] = settings[field];
    });

    try {
      setIsSettingsSaving(true);

      const response = await api.patch("/settings", payload);

      setSettings((current) => ({
        ...current,
        ...(response.data?.settings || {}),
      }));

      toast.success(response.data?.message || successMessage);
    } catch (error) {
      console.error("Settings save error:", error?.response?.data || error);
      toast.error(getErrorMessage(error, "Failed to save settings"));
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const handleSaveFeeSettings = () => {
    const defaultMonths =
      Number(
        settings.defaultMonths,
      );

    const recurringFeeStartDay =
      Number(
        settings.recurringFeeStartDay,
      );

    const recurringFeeDueDay =
      Number(
        settings.recurringFeeDueDay,
      );

    if (
      !Number.isInteger(defaultMonths) ||
      defaultMonths < 1
    ) {
      toast.error(
        "Default months must be a positive whole number",
      );
      return;
    }

    if (
      !Number.isInteger(recurringFeeStartDay) ||
      recurringFeeStartDay < 1 ||
      recurringFeeStartDay > 31
    ) {
      toast.error(
        "Monthly / Part Payment start day must be between 1 and 31",
      );
      return;
    }

    if (
      !Number.isInteger(recurringFeeDueDay) ||
      recurringFeeDueDay < 1 ||
      recurringFeeDueDay > 31
    ) {
      toast.error(
        "Monthly / Part Payment due day must be between 1 and 31",
      );
      return;
    }

    saveSettings(
      [
        "monthlyFeeEnabled",
        "defaultMonths",
        "partialFeeEnabled",
        "yearlyFeeEnabled",
        "commonFeeSetupEnabled",
        "courseWiseFeeSetupEnabled",
        "recurringFeeStartDay",
        "recurringFeeDueDay",
      ],
      "Fee settings updated",
    );
  };

  const handleQrUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid QR image");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("QR image must be below 2MB");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setSettings((current) => ({
        ...current,
        invoiceQrCode: String(reader.result || ""),
      }));

      toast.success("Payment QR selected. Click Save Invoice Settings to store it.");
    };

    reader.onerror = () => {
      toast.error("Failed to read QR image");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleAddCourse = async () => {
    const courseName = newCourseName.trim();

    if (!courseName) {
      toast.error("Course name is required");
      return;
    }

    try {
      setIsAcademicSaving(true);

      await api.post("/academic/courses", {
        courseName,
      });

      setNewCourseName("");

      const response = await api.get("/academic/courses");
      setCourses(response.data || []);

      toast.success("Course added successfully");
    } catch (error) {
      console.error("Course add error:", error?.response?.data || error);
      toast.error(getErrorMessage(error, "Failed to add course"));
    } finally {
      setIsAcademicSaving(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    try {
      await api.delete(`/academic/courses/${id}`);

      setCourses((current) =>
        current.filter((course) => course._id !== id)
      );

      toast.success("Course deleted successfully");
    } catch (error) {
      console.error("Course delete error:", error?.response?.data || error);
      toast.error(getErrorMessage(error, "Failed to delete course"));
    }
  };

  const handleBatchChange = (event) => {
    const { name, value } = event.target;

    setNewBatch((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddBatch = async () => {
    const batchName = newBatch.batchName.trim();
    const startTime = newBatch.startTime.trim().toUpperCase();
    const endTime = newBatch.endTime.trim().toUpperCase();

    if (!batchName || !startTime || !endTime) {
      toast.error("Batch name, start time and end time are required");
      return;
    }

    try {
      setIsAcademicSaving(true);

      await api.post("/academic/batches", {
        batchName,
        startTime,
        endTime,
      });

      setNewBatch({
        batchName: "",
        startTime: "",
        endTime: "",
      });

      const response = await api.get("/academic/batches");
      setBatches(response.data || []);

      toast.success("Batch added successfully");
    } catch (error) {
      console.error("Batch add error:", error?.response?.data || error);
      toast.error(getErrorMessage(error, "Failed to add batch"));
    } finally {
      setIsAcademicSaving(false);
    }
  };

  const handleDeleteBatch = async (id) => {
    try {
      await api.delete(`/academic/batches/${id}`);

      setBatches((current) =>
        current.filter((batch) => batch._id !== id)
      );

      toast.success("Batch deleted successfully");
    } catch (error) {
      console.error("Batch delete error:", error?.response?.data || error);
      toast.error(getErrorMessage(error, "Failed to delete batch"));
    }
  };

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("en-IN");

  const mobileLayouts = [
    { id: "drawer", name: "Classic Drawer", description: "Menu opens smoothly from the left." },
    { id: "bottom", name: "Bottom Dock", description: "Navigation stays within thumb reach." },
  ];

  const selectMobileLayout = (layout) => {
    setMobileNavLayout(layout);
    localStorage.setItem("mobileNavLayout", layout);
    window.dispatchEvent(new CustomEvent("mobile-nav-layout-change", { detail: layout }));
    toast.success("Mobile navigation layout updated");
  };


  if (isLoading) {
    return (
      <div className="settings-loading">
        <LoadingLogo />
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="settings-page">
      

      <div className="settings-layout">
        <aside className="settings-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-nav-item ${
                activeTab === tab.id ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="settings-nav-icon">{tab.icon}</span>
              <span className="settings-nav-label">{tab.label}</span>
            </button>
          ))}
        </aside>

        <section className="settings-content">
          {activeTab === "profile" && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <div>
                  <h2>Profile Settings</h2>
                  <p>Update your personal account information and password.</p>
                </div>
              </div>

              <form className="settings-form" onSubmit={handleProfileSave}>
                <div className="profile-settings-layout">
                  <div className="profile-preview-card">
                    <div className="profile-preview-avatar">
                      {profile.profileImage ? (
                        <img src={profile.profileImage} alt={profile.name || "Profile"} />
                      ) : (
                        <FiUser />
                      )}
                    </div>
                    <strong>{profile.name || "User"}</strong>
                    <span>{profile.email || "No email"}</span>
                  </div>

                  <div className="settings-form-grid">
                    <div className="settings-field">
                      <label>Name</label>
                      <input
                        name="name"
                        value={profile.name}
                        onChange={handleProfileChange}
                        placeholder="Enter name"
                      />
                    </div>

                    <div className="settings-field">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleProfileChange}
                        placeholder="Enter email"
                      />
                    </div>

                    <div className="settings-field">
                      <label>Phone</label>
                      <input
                        name="phone"
                        maxLength={10}
                        value={profile.phone}
                        onChange={handleProfileChange}
                        placeholder="9876543210"
                      />
                    </div>

                    <div className="settings-field">
                      <label>Profile Photo</label>
                      <label className="profile-photo-upload">
                        <FiUploadCloud />
                        <span>{profile.profileImage ? "Change Photo" : "Upload Photo"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleProfilePhotoUpload}
                        />
                      </label>
                      {profile.profileImage && (
                        <button
                          type="button"
                          className="profile-photo-remove"
                          onClick={() => setProfile((current) => ({ ...current, profileImage: "" }))}
                        >
                          <FiTrash2 /> Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="settings-actions">
                  <button
                    type="submit"
                    className="settings-primary-btn"
                    disabled={isProfileSaving}
                  >
                    <FiSave />
                    {isProfileSaving ? "Saving..." : "Update Profile"}
                  </button>
                </div>
              </form>

              <div className="settings-divider" />

              <form className="settings-form" onSubmit={handlePasswordSave}>
                <div className="settings-subheading">
                  <div className="settings-subheading-icon">
                    <FiLock />
                  </div>
                  <div>
                    <h3>Change Password</h3>
                    <p>
                      Enter the current password before creating a new password.
                    </p>
                  </div>
                </div>

                <div className="settings-form-grid settings-password-grid">
                  <div className="settings-field">
                    <label>Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Current password"
                    />
                  </div>

                  <div className="settings-field">
                    <label>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div className="settings-field">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>

                <div className="settings-actions">
                  <button
                    type="submit"
                    className="settings-primary-btn"
                    disabled={isPasswordSaving}
                  >
                    <FiLock />
                    {isPasswordSaving ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="settings-panel mobile-layout-panel">
              <div className="settings-panel-header">
                <div>
                  <h2>Mobile Navigation</h2>
                  <p>Choose how the menu appears on phones. Desktop navigation will stay unchanged.</p>
                </div>
              </div>

              <div className="mobile-layout-picker">
                {mobileLayouts.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    className={`mobile-layout-option ${mobileNavLayout === layout.id ? "selected" : ""}`}
                    onClick={() => selectMobileLayout(layout.id)}
                    aria-pressed={mobileNavLayout === layout.id}
                  >
                    <span className={`mobile-layout-preview preview-${layout.id}`} aria-hidden="true">
                      <span className="preview-header"><i /><b /></span>
                      <span className="preview-content" />
                      <span className="preview-navigation"><i /><i /><i /><i /></span>
                    </span>
                    <span className="mobile-layout-copy">
                      <strong>{layout.name}</strong>
                      <small>{layout.description}</small>
                    </span>
                    <span className="mobile-layout-check"><FiCheckCircle /></span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "fees" && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <div>
                  <h2>Fee Settings</h2>
                  <p>
                    Control fee setup options and the common recurring cycle used
                    by Part-payment students.
                  </p>
                </div>
              </div>

              <div className="fee-settings-grid">

                <div className="fee-rule-card">
                  <div className="fee-rule-header">
                    <div className="fee-rule-icon">
                      <span>P</span>
                    </div>

                    <div className="fee-rule-title">
                      <h3>Part Payment Fees</h3>
                      <p>
                        Allow flexible payment amounts until the full balance is
                        completed.
                      </p>
                    </div>

                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        name="partialFeeEnabled"
                        checked={settings.partialFeeEnabled}
                        onChange={handleSettingsChange}
                      />
                      <span />
                    </label>
                  </div>

                  <div className="settings-rule-preview">
                    Part payments have <strong>no fixed installment count</strong>{" "}
                    and no fixed minimum payment rule in the collection flow.
                  </div>
                </div>

                <div className="fee-rule-card fee-cycle-rule-card">
                  <div className="fee-rule-header">
                    <div className="fee-rule-icon">
                      <span>D</span>
                    </div>

                    <div className="fee-rule-title">
                      <h3>Part Payment Fee Cycle</h3>
                      <p>
                        Set one recurring start and due day for all Monthly and
                        Part Payment students.
                      </p>
                    </div>
                  </div>

                  <div className="fee-rule-fields two-columns">
                    <div className="settings-field">
                      <label>Fee Start Day</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        step="1"
                        name="recurringFeeStartDay"
                        value={settings.recurringFeeStartDay}
                        onChange={handleSettingsChange}
                      />
                    </div>

                    <div className="settings-field">
                      <label>Fee Due / End Day</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        step="1"
                        name="recurringFeeDueDay"
                        value={settings.recurringFeeDueDay}
                        onChange={handleSettingsChange}
                      />
                    </div>
                  </div>

                  <div className="settings-rule-preview">
                    Example: Start Day <strong>{settings.recurringFeeStartDay}</strong>{" "}
                    and Due Day <strong>{settings.recurringFeeDueDay}</strong> means
                    the same fee cycle repeats every month. Months with fewer days
                    automatically use that month's last valid date.
                  </div>
                </div>

                <div className="fee-rule-card bulk-fee-settings-card">
                  <div className="fee-rule-header">
                    <div className="fee-rule-icon">
                      <span>B</span>
                    </div>

                    <div className="fee-rule-title">
                      <h3>Bulk Fee Setup</h3>
                      <p>
                        Enable or disable Common and Course Wise fee setup on the
                        Payment page.
                      </p>
                    </div>
                  </div>

                  <div className="bulk-fee-toggle-list">
                    <div className="bulk-fee-toggle-row">
                      <div>
                        <strong>Common Fee Setup</strong>
                        <span>
                          Apply one fee setup to all eligible students.
                        </span>
                      </div>

                      <label className="settings-switch">
                        <input
                          type="checkbox"
                          name="commonFeeSetupEnabled"
                          checked={settings.commonFeeSetupEnabled}
                          onChange={handleSettingsChange}
                        />
                        <span />
                      </label>
                    </div>

                    <div className="bulk-fee-toggle-row">
                      <div>
                        <strong>Course Wise Fee Setup</strong>
                        <span>
                          Apply one fee setup to eligible students in a course.
                        </span>
                      </div>

                      <label className="settings-switch">
                        <input
                          type="checkbox"
                          name="courseWiseFeeSetupEnabled"
                          checked={settings.courseWiseFeeSetupEnabled}
                          onChange={handleSettingsChange}
                        />
                        <span />
                      </label>
                    </div>
                  </div>

                  <div className="settings-rule-preview">
                    Students already using an active <strong>Monthly</strong> or{" "}
                    <strong>Part Payment</strong> fee plan are automatically skipped
                    during Common / Course Wise setup.
                  </div>
                </div>

                <div className="fee-rule-card yearly-rule-card">
                  <div className="fee-rule-header">
                    <div className="fee-rule-icon">
                      <span>Y</span>
                    </div>

                    <div className="fee-rule-title">
                      <h3>One-Time Payment Fees</h3>
                      <p>
                        Collect the complete configured fee in one payment.
                      </p>
                    </div>

                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        name="yearlyFeeEnabled"
                        checked={settings.yearlyFeeEnabled}
                        onChange={handleSettingsChange}
                      />
                      <span />
                    </label>
                  </div>

                  <div className="yearly-rule-status">
                    <FiCheckCircle />
                    <div>
                      <strong>Individual Start / End Date</strong>
                      <span>
                        One-Time Payment fee setup continues to use its own starting and
                        ending date from the Payment page.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-panel-actions">
                <button
                  type="button"
                  className="settings-primary-btn"
                  disabled={isSettingsSaving}
                  onClick={handleSaveFeeSettings}
                >
                  <FiSave />
                  {isSettingsSaving ? "Saving..." : "Save Fee Settings"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <div>
                  <h2>Notification Settings</h2>
                  <p>Configure WhatsApp fee reminder behaviour.</p>
                </div>
              </div>

              <div className="notification-settings-list">
                <div className="notification-setting-row">
                  <div className="notification-setting-info">
                    <div className="notification-setting-icon">
                      <FiBell />
                    </div>
                    <div>
                      <h3>WhatsApp Fee Reminders</h3>
                      <p>Enable WhatsApp reminders for student fee payments.</p>
                    </div>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      name="whatsappEnabled"
                      checked={settings.whatsappEnabled}
                      onChange={handleSettingsChange}
                    />
                    <span />
                  </label>
                </div>

                <div className="notification-setting-row with-field">
                  <div className="notification-setting-info">
                    <div className="notification-setting-icon compact">
                      <span>1</span>
                    </div>
                    <div>
                      <h3>Reminder Before Due Date</h3>
                      <p>Choose how many days before the due date a reminder is prepared.</p>
                    </div>
                  </div>
                  <div className="notification-inline-field">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      name="reminderDaysBeforeDue"
                      value={settings.reminderDaysBeforeDue}
                      onChange={handleSettingsChange}
                      disabled={!settings.whatsappEnabled}
                    />
                    <span>Days</span>
                  </div>
                </div>

                <div className="notification-setting-row">
                  <div className="notification-setting-info">
                    <div className="notification-setting-icon compact">
                      <span>2</span>
                    </div>
                    <div>
                      <h3>Due Date Reminder</h3>
                      <p>Send a reminder on the configured payment due date.</p>
                    </div>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      name="reminderOnDueDate"
                      checked={settings.reminderOnDueDate}
                      onChange={handleSettingsChange}
                      disabled={!settings.whatsappEnabled}
                    />
                    <span />
                  </label>
                </div>

                <div className="notification-setting-row with-field">
                  <div className="notification-setting-info">
                    <div className="notification-setting-icon compact">
                      <span>3</span>
                    </div>
                    <div>
                      <h3>Automatic Reminder</h3>
                      <p>Automatically repeat overdue fee reminders at the selected interval.</p>
                    </div>
                  </div>
                  <div className="notification-control-group">
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        name="overdueReminderEnabled"
                        checked={settings.overdueReminderEnabled}
                        onChange={handleSettingsChange}
                        disabled={!settings.whatsappEnabled}
                      />
                      <span />
                    </label>
                    <div className="notification-inline-field">
                      <span>Every</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        name="overdueReminderIntervalDays"
                        value={settings.overdueReminderIntervalDays}
                        onChange={handleSettingsChange}
                        disabled={
                          !settings.whatsappEnabled ||
                          !settings.overdueReminderEnabled
                        }
                      />
                      <span>
                        {Number(settings.overdueReminderIntervalDays) === 1
                          ? "Day"
                          : "Days"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-panel-actions">
                <button
                  type="button"
                  className="settings-primary-btn"
                  disabled={isSettingsSaving}
                  onClick={() =>
                    saveSettings(
                      [
                        "whatsappEnabled",
                        "reminderDaysBeforeDue",
                        "reminderOnDueDate",
                        "overdueReminderEnabled",
                        "overdueReminderIntervalDays",
                      ],
                      "Notification settings updated"
                    )
                  }
                >
                  <FiSave />
                  {isSettingsSaving ? "Saving..." : "Save Notifications"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "academic" && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <div>
                  <h2>Course & Batch</h2>
                  <p>Manage the courses and batch timings used on the Students page.</p>
                </div>
              </div>

              <div className="academic-settings-grid">
                <div className="academic-settings-card">
                  <div className="academic-card-header">
                    <div>
                      <h3>Courses</h3>
                      <p>{courses.length} course{courses.length === 1 ? "" : "s"} available</p>
                    </div>
                  </div>

                  <div className="settings-inline-form">
                    <input
                      value={newCourseName}
                      onChange={(event) => setNewCourseName(event.target.value)}
                      placeholder="Example: NEET"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAddCourse();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCourse}
                      disabled={isAcademicSaving}
                    >
                      Add Course
                    </button>
                  </div>

                  <div className="academic-items">
                    {courses.length === 0 ? (
                      <div className="settings-empty">No courses added</div>
                    ) : (
                      courses.map((course) => (
                        <div className="academic-item" key={course._id}>
                          <div className="academic-item-main">
                            <span className="academic-item-dot" />
                            <strong>{course.courseName}</strong>
                          </div>
                          <button
                            type="button"
                            title="Delete course"
                            onClick={() => handleDeleteCourse(course._id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="academic-settings-card">
                  <div className="academic-card-header">
                    <div>
                      <h3>Batches</h3>
                      <p>{batches.length} batch{batches.length === 1 ? "" : "es"} available</p>
                    </div>
                  </div>

                  <div className="batch-settings-form">
                    <input
                      name="batchName"
                      value={newBatch.batchName}
                      onChange={handleBatchChange}
                      placeholder="Batch name"
                    />
                    <input
                      name="startTime"
                      value={newBatch.startTime}
                      onChange={handleBatchChange}
                      placeholder="10:00 AM"
                    />
                    <input
                      name="endTime"
                      value={newBatch.endTime}
                      onChange={handleBatchChange}
                      placeholder="11:00 AM"
                    />
                    <button
                      type="button"
                      onClick={handleAddBatch}
                      disabled={isAcademicSaving}
                    >
                      Add Batch
                    </button>
                  </div>

                  <div className="academic-items">
                    {batches.length === 0 ? (
                      <div className="settings-empty">No batches added</div>
                    ) : (
                      batches.map((batch) => (
                        <div className="academic-item" key={batch._id}>
                          <div className="academic-item-main batch-item-main">
                            <span className="academic-item-dot" />
                            <div>
                              <strong>{batch.batchName}</strong>
                              <span>
                                {batch.startTime} - {batch.endTime}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            title="Delete batch"
                            onClick={() => handleDeleteBatch(batch._id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "invoice" && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <div>
                  <h2>Invoice Settings</h2>
                  <p>
                    Configure invoice numbering, business details and the payment QR shown to students.
                  </p>
                </div>
              </div>

              <div className="invoice-settings-body">
                <div className="invoice-enable-card">
                  <div className="invoice-enable-info">
                    <div className="invoice-enable-icon">
                      <FiFileText />
                    </div>
                    <div>
                      <h3>Invoice Generation</h3>
                      <p>Enable invoice generation for successful student payments.</p>
                    </div>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      name="invoiceEnabled"
                      checked={settings.invoiceEnabled}
                      onChange={handleSettingsChange}
                    />
                    <span />
                  </label>
                </div>

                <div className="invoice-section-card">
                  <div className="invoice-section-heading">
                    <div>
                      <span>01</span>
                      <div>
                        <h3>Invoice Number</h3>
                        <p>Set the text displayed before and after the invoice sequence.</p>
                      </div>
                    </div>
                  </div>

                  <div className="settings-form-grid invoice-number-grid">
                    <div className="settings-field">
                      <label>Prefix</label>
                      <input
                        name="invoicePrefix"
                        value={settings.invoicePrefix}
                        onChange={handleSettingsChange}
                        placeholder="SK-INV"
                      />
                    </div>
                    <div className="settings-field">
                      <label>Suffix</label>
                      <input
                        name="invoiceSuffix"
                        value={settings.invoiceSuffix}
                        onChange={handleSettingsChange}
                        placeholder="2026"
                      />
                    </div>
                    <div className="invoice-number-preview">
                      <span>Preview</span>
                      <strong>
                        {settings.invoicePrefix || "INV"}-0001
                        {settings.invoiceSuffix
                          ? `-${settings.invoiceSuffix}`
                          : ""}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="invoice-section-card">
                  <div className="invoice-section-heading">
                    <div>
                      <span>02</span>
                      <div>
                        <h3>Business Details</h3>
                        <p>These details will be printed on the student invoice.</p>
                      </div>
                    </div>
                  </div>

                  <div className="settings-form-grid">
                    <div className="settings-field">
                      <label>Owner Name</label>
                      <input
                        name="ownerName"
                        value={settings.ownerName}
                        onChange={handleSettingsChange}
                        placeholder="Enter owner name"
                      />
                    </div>

                    <div className="settings-field">
                      <label>GST Number</label>
                      <input
                        name="gstNumber"
                        value={settings.gstNumber}
                        onChange={handleSettingsChange}
                        placeholder="Enter GST number"
                      />
                    </div>

                    <div className="settings-field settings-full-width">
                      <label>Address</label>
                      <textarea
                        name="invoiceAddress"
                        value={settings.invoiceAddress}
                        onChange={handleSettingsChange}
                        placeholder="Enter the address to display on invoices"
                      />
                    </div>
                  </div>
                </div>

                <div className="invoice-section-card">
                  <div className="invoice-section-heading">
                    <div>
                      <span>03</span>
                      <div>
                        <h3>Student Payment QR</h3>
                        <p>Upload the QR students should scan when making fee payments.</p>
                      </div>
                    </div>
                  </div>

                  <div className="invoice-qr-area">
                    {settings.invoiceQrCode ? (
                      <div className="invoice-qr-preview">
                        <div className="invoice-qr-image-wrap">
                          <img src={settings.invoiceQrCode} alt="Student payment QR" />
                        </div>
                        <div className="invoice-qr-preview-info">
                          <FiCheckCircle />
                          <strong>Payment QR ready</strong>
                          <span>
                            This QR will be available for the invoice/payment flow after the invoice feature is connected.
                          </span>
                          <div className="invoice-qr-actions">
                            <label>
                              <FiUploadCloud /> Replace QR
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={handleQrUpload}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setSettings((current) => ({
                                  ...current,
                                  invoiceQrCode: "",
                                }))
                              }
                            >
                              <FiX /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="invoice-qr-picker">
                        <div className="invoice-upload-icon">
                          <FiImage />
                        </div>
                        <strong>Upload Payment QR</strong>
                        <span>PNG, JPG, JPEG or WEBP • Maximum 2MB</span>
                        <small>Click here to select the QR image</small>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleQrUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="invoice-section-card">
                  <div className="invoice-section-heading">
                    <div>
                      <span>04</span>
                      <div>
                        <h3>Footer & Terms</h3>
                        <p>Optional text displayed at the bottom of the invoice.</p>
                      </div>
                    </div>
                  </div>

                  <div className="settings-form-grid">
                    <div className="settings-field settings-full-width">
                      <label>Invoice Footer</label>
                      <textarea
                        name="invoiceFooter"
                        value={settings.invoiceFooter}
                        onChange={handleSettingsChange}
                        placeholder="Example: Thank you for choosing The SK Learnings"
                      />
                    </div>

                    <div className="settings-field settings-full-width">
                      <label>Terms & Conditions</label>
                      <textarea
                        name="invoiceTerms"
                        value={settings.invoiceTerms}
                        onChange={handleSettingsChange}
                        placeholder="Enter invoice terms and conditions"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="settings-panel-actions invoice-save-actions">
                <button
                  type="button"
                  className="settings-primary-btn"
                  disabled={isSettingsSaving}
                  onClick={() =>
                    saveSettings(
                      [
                        "invoiceEnabled",
                        "invoicePrefix",
                        "invoiceSuffix",
                        "invoiceQrCode",
                        "gstNumber",
                        "ownerName",
                        "invoiceAddress",
                        "invoiceFooter",
                        "invoiceTerms",
                      ],
                      "Invoice settings updated"
                    )
                  }
                >
                  <FiSave />
                  {isSettingsSaving ? "Saving..." : "Save Invoice Settings"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

    </div>
  );
};

export default Settings;
