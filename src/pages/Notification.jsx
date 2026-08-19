import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiBell,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiSend,
} from "react-icons/fi";

import toast from "react-hot-toast";

import api from "../services/axios";
import "../styles/notification.css";

const initialSummary = {
  total: 0,
  dueSoon: 0,
  dueToday: 0,
  overdue: 0,
  reminderSent: 0,
  paidAfterReminder: 0,
  unpaid: 0,
};

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(initialSummary);
  const [reminderIntervalDays, setReminderIntervalDays] = useState(3);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [reminderFilter, setReminderFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [isSavingInterval, setIsSavingInterval] = useState(false);
  const [sendingStudentId, setSendingStudentId] = useState(null);

  const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;

    if (!error?.response) {
      return "Unable to connect to the server.";
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

    return fallback;
  };

  const fetchNotifications = async (showSuccess = false) => {
    try {
      const response = await api.get("/notifications");

      setNotifications(response.data?.notifications || []);

      setSummary({
        ...initialSummary,
        ...(response.data?.summary || {}),
      });

      setReminderIntervalDays(
        Number(response.data?.reminderIntervalDays || 3),
      );

      if (showSuccess) {
        toast.success("Notifications refreshed");
      }
    } catch (error) {
      console.error(
        "Notification load error:",
        error?.response?.data || error,
      );

      toast.error(
        getErrorMessage(error, "Failed to load notifications"),
      );
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        await fetchNotifications();
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const courseOptions = useMemo(() => {
    return [
      ...new Set(
        notifications
          .map((item) => item.course)
          .filter(Boolean),
      ),
    ].sort();
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return notifications.filter((item) => {
      const matchesSearch =
        !keyword ||
        String(item.studentName || "").toLowerCase().includes(keyword) ||
        String(item.rollNo || "").toLowerCase().includes(keyword) ||
        String(item.course || "").toLowerCase().includes(keyword) ||
        String(item.batch || "").toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" || item.alertType === statusFilter;

      const matchesCourse =
        courseFilter === "all" || item.course === courseFilter;

      let matchesReminder = true;

      if (reminderFilter === "sent") {
        matchesReminder = Number(item.reminderCount || 0) > 0;
      }

      if (reminderFilter === "not_sent") {
        matchesReminder = Number(item.reminderCount || 0) === 0;
      }

      if (reminderFilter === "paid_after") {
        matchesReminder = Boolean(item.paidAfterReminder);
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCourse &&
        matchesReminder
      );
    });
  }, [
    notifications,
    search,
    statusFilter,
    courseFilter,
    reminderFilter,
  ]);

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAlertLabel = (item) => {
    if (item.alertType === "due_soon") return "Due Soon";
    if (item.alertType === "due_today") return "Due Today";
    if (item.alertType === "overdue") return "Overdue";

    if (item.alertType === "paid") {
      return item.paidAfterReminder ? "Paid After Reminder" : "Paid";
    }

    return "Active";
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchNotifications(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveReminderInterval = async () => {
    const intervalDays = Number(reminderIntervalDays);

    if (!Number.isInteger(intervalDays) || intervalDays < 1 || intervalDays > 30) {
      toast.error("Reminder interval must be between 1 and 30 days");
      return;
    }

    try {
      setIsSavingInterval(true);
      await api.patch("/settings", {
        overdueReminderIntervalDays: intervalDays,
      });
      toast.success("Reminder interval updated");
      await fetchNotifications();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update reminder interval"));
    } finally {
      setIsSavingInterval(false);
    }
  };

  const handleSendReminder = async (item) => {
    try {
      setSendingStudentId(item.studentId);

      const response = await api.post(
        `/notifications/student/${item.studentId}/send-reminder`,
      );

      toast.success(
        response.data?.message || "Reminder sent successfully",
      );

      await fetchNotifications();
    } catch (error) {
      console.error(
        "Manual reminder error:",
        error?.response?.data || error,
      );

      toast.error(
        getErrorMessage(error, "Failed to send reminder"),
      );
    } finally {
      setSendingStudentId(null);
    }
  };

  const handleSendAll = async () => {
    if (Number(summary.unpaid || 0) === 0) {
      toast.error("No unpaid students available");
      return;
    }

    const confirmed = window.confirm(
      `Send fee reminder to all ${summary.unpaid} unpaid/partial students?`,
    );

    if (!confirmed) return;

    try {
      setIsSendingAll(true);

      const response = await api.post(
        "/notifications/send-all-unpaid",
      );

      const data = response.data || {};

      if (Number(data.failed || 0) > 0) {
        toast(data.message || "Reminder process completed");
      } else {
        toast.success(
          data.message || "Reminders sent successfully",
        );
      }

      await fetchNotifications();
    } catch (error) {
      console.error(
        "Send all reminders error:",
        error?.response?.data || error,
      );

      toast.error(
        getErrorMessage(error, "Failed to send reminders"),
      );
    } finally {
      setIsSendingAll(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setCourseFilter("all");
    setReminderFilter("all");
  };

  return (
    <div className="notification-page">
      <div className="notification-summary-grid">
        <SummaryCard
          icon={<FiBell />}
          label="Unpaid"
          value={summary.unpaid}
          type="unpaid"
        />

        <SummaryCard
          icon={<FiClock />}
          label="Due Soon"
          value={summary.dueSoon}
          type="soon"
        />

        <SummaryCard
          icon={<FiClock />}
          label="Due Today"
          value={summary.dueToday}
          type="today"
        />

        <SummaryCard
          icon={<FiBell />}
          label="Overdue"
          value={summary.overdue}
          type="overdue"
        />

        <SummaryCard
          icon={<FiSend />}
          label="Reminder Sent"
          value={summary.reminderSent}
          type="sent"
        />

        <SummaryCard
          icon={<FiCheckCircle />}
          label="Paid After Reminder"
          value={summary.paidAfterReminder}
          type="paid"
        />
      </div>

      <section className="notification-section">
        <div className="notification-toolbar">
          <div className="notification-search">
            <FiSearch />

            <input
              type="text"
              placeholder="Search student, roll no, course or batch..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="notification-filter-wrapper">
            <button
              type="button"
              className={`notification-toolbar-btn ${
                showFilters ? "active" : ""
              }`}
              onClick={() => setShowFilters((current) => !current)}
            >
              <FiFilter />
              Filter
            </button>

            {showFilters && (
              <div className="notification-filter-dropdown">
                <div className="notification-filter-head">
                  <strong>Filter</strong>

                  <button
                    type="button"
                    onClick={clearFilters}
                  >
                    Clear
                  </button>
                </div>

                <label>
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                  >
                    <option value="all">All</option>
                    <option value="due_soon">Due Soon</option>
                    <option value="due_today">Due Today</option>
                    <option value="overdue">Overdue</option>
                    <option value="paid">Paid</option>
                    <option value="active">Active</option>
                  </select>
                </label>

                <label>
                  Course
                  <select
                    value={courseFilter}
                    onChange={(event) =>
                      setCourseFilter(event.target.value)
                    }
                  >
                    <option value="all">All Courses</option>

                    {courseOptions.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Reminder
                  <select
                    value={reminderFilter}
                    onChange={(event) =>
                      setReminderFilter(event.target.value)
                    }
                  >
                    <option value="all">All</option>
                    <option value="sent">Sent</option>
                    <option value="not_sent">Not Sent</option>
                    <option value="paid_after">
                      Paid After Reminder
                    </option>
                  </select>
                </label>
              </div>
            )}
          </div>

          <button
            type="button"
            className="notification-toolbar-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <FiRefreshCw />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="notification-send-all-btn"
            onClick={handleSendAll}
            disabled={
              isSendingAll ||
              Number(summary.unpaid || 0) === 0
            }
          >
            <FiSend />
            {isSendingAll ? "Sending..." : "Send Notification"}
          </button>
        </div>

        <div className="notification-realert-strip">
          <FiBell />
          <span>Automatic re-alert:</span>
          <label className="notification-interval-control">
            <span>Every</span>
            <input
              type="number"
              min="1"
              max="30"
              value={reminderIntervalDays}
              onChange={(event) => setReminderIntervalDays(event.target.value)}
              aria-label="Automatic reminder interval in days"
            />
            <span>day{Number(reminderIntervalDays) === 1 ? "" : "s"}</span>
          </label>
          <button
            type="button"
            className="notification-interval-save"
            onClick={handleSaveReminderInterval}
            disabled={isSavingInterval}
          >
            {isSavingInterval ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="notification-table-card">
          {isLoading ? (
            <div className="notification-empty">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notification-empty">
              No notifications found
            </div>
          ) : (
            <div className="notification-table-wrap">
              <table className="notification-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Pending</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Reminder</th>
                    <th>Next Alert</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredNotifications.map((item) => (
                    <tr key={item.studentId}>
                      <td>
                        <div className="notification-student-cell">
                          <div className="notification-avatar">
                            {item.studentName
                              ?.charAt(0)
                              ?.toUpperCase() || "S"}
                          </div>

                          <div>
                            <strong>{item.studentName}</strong>
                            <span>{item.rollNo}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{item.course}</strong>
                        <span className="notification-subtext">
                          {item.batch || "-"}
                        </span>
                      </td>

                      <td>
                        <strong>
                          ₹{formatMoney(item.pendingAmount)}
                        </strong>
                        <span className="notification-subtext">
                          Paid ₹{formatMoney(item.paidAmount)}
                        </span>
                      </td>

                      <td>{formatDate(item.feeEndingDate)}</td>

                      <td>
                        <span
                          className={`notification-status ${item.alertType}`}
                        >
                          {getAlertLabel(item)}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {Number(item.reminderCount || 0)} Sent
                        </strong>
                        <span className="notification-subtext">
                          {item.lastReminderSentAt
                            ? formatDateTime(item.lastReminderSentAt)
                            : "Not sent"}
                        </span>
                      </td>

                      <td>
                        {item.paymentStatus === "paid" ? (
                          <span className="notification-completed">
                            Completed
                          </span>
                        ) : (
                          <>
                            <strong>
                              {formatDate(item.nextReminderDate)}
                            </strong>
                            <span className="notification-subtext">
                              Auto re-alert
                            </span>
                          </>
                        )}
                      </td>

                      <td>
                        {item.paymentStatus !== "paid" &&
                        Number(item.pendingAmount || 0) > 0 ? (
                          <button
                            type="button"
                            className="notification-row-send"
                            disabled={
                              sendingStudentId === item.studentId
                            }
                            onClick={() => handleSendReminder(item)}
                          >
                            <FiSend />
                            {sendingStudentId === item.studentId
                              ? "Sending"
                              : "Send"}
                          </button>
                        ) : (
                          <span className="notification-paid">
                            <FiCheckCircle />
                            Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const SummaryCard = ({
  icon,
  label,
  value,
  type,
}) => (
  <article className={`notification-summary-card ${type}`}>
    <div className="notification-summary-icon">
      {icon}
    </div>

    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  </article>
);

export default Notification;
