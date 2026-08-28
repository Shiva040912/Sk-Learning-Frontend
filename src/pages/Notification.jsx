import { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiMoreVertical,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/axios";
import LoadingLogo from "../components/LoadingLogo";
import "../styles/notification.css";

const initialSummary = {
  total: 0, dueSoon: 0, dueToday: 0, overdue: 0,
  reminderSent: 0, paidAfterReminder: 0, unpaid: 0,
};

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(initialSummary);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [reminderFilter, setReminderFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendMode, setSendMode] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isSendingSelected, setIsSendingSelected] = useState(false);
  const [sendingStudentId, setSendingStudentId] = useState(null);
  const [openPreferenceId, setOpenPreferenceId] = useState(null);
  const [savingPreference, setSavingPreference] = useState(null);

  const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    if (!error?.response) return "Unable to connect to the server.";
    if (Array.isArray(data?.message)) return data.message.filter(Boolean).join(", ");
    if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
    if (typeof data?.error === "string" && data.error.trim()) return data.error.trim();
    return fallback;
  };

  const fetchNotifications = async (showSuccess = false) => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data?.notifications || []);
      setSummary({ ...initialSummary, ...(response.data?.summary || {}) });
      if (showSuccess) toast.success("Notifications refreshed");
    } catch (error) {
      console.error("Notification load error:", error?.response?.data || error);
      toast.error(getErrorMessage(error, "Failed to load notifications"));
    }
  };

  useEffect(() => {
    const load = async () => {
      try { setIsLoading(true); await fetchNotifications(); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!openPreferenceId) return undefined;
    const closeMenu = (event) => {
      if (!event.target.closest(".notification-action-cell")) setOpenPreferenceId(null);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [openPreferenceId]);

  const courseOptions = useMemo(() => [
    ...new Set(notifications.map((item) => item.course).filter(Boolean)),
  ].sort(), [notifications]);

  const eligibleNotifications = useMemo(() => notifications.filter((item) => (
    item.paymentStatus !== "paid" &&
    Number(item.pendingAmount || 0) > 0 &&
    !item.notificationPreferences?.muteAll &&
    !item.notificationPreferences?.muteReminder
  )), [notifications]);

  const filteredNotifications = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesSearch = !keyword || [item.studentName, item.rollNo, item.course, item.batch]
        .some((value) => String(value || "").toLowerCase().includes(keyword));
      const matchesStatus = statusFilter === "all" || item.alertType === statusFilter;
      const matchesCourse = courseFilter === "all" || item.course === courseFilter;
      let matchesReminder = true;
      if (reminderFilter === "sent") matchesReminder = Number(item.reminderCount || 0) > 0;
      if (reminderFilter === "not_sent") matchesReminder = Number(item.reminderCount || 0) === 0;
      if (reminderFilter === "paid_after") matchesReminder = Boolean(item.paidAfterReminder);
      return matchesSearch && matchesStatus && matchesCourse && matchesReminder;
    });
  }, [notifications, search, statusFilter, courseFilter, reminderFilter]);

  const formatMoney = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };
  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  const getAlertLabel = (item) => {
    if (item.alertType === "due_soon") return "Due Soon";
    if (item.alertType === "due_today") return "Due Today";
    if (item.alertType === "overdue") return "Overdue";
    if (item.alertType === "paid") return item.paidAfterReminder ? "Paid After Reminder" : "Paid";
    return "Active";
  };

  const handleRefresh = async () => {
    try { setIsRefreshing(true); await fetchNotifications(true); }
    finally { setIsRefreshing(false); }
  };
  const handleSendReminder = async (item) => {
    try {
      setSendingStudentId(item.studentId);
      const response = await api.post(`/notifications/student/${item.studentId}/send-reminder`);
      toast.success(response.data?.message || "Reminder sent successfully");
      await fetchNotifications();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send reminder"));
    } finally { setSendingStudentId(null); }
  };
  const handleSendAll = async () => {
    if (Number(summary.unpaid || 0) === 0) return toast.error("No unpaid students available");
    if (!window.confirm(`Send fee reminder to all ${summary.unpaid} unpaid/part-payment students?`)) return;
    try {
      setIsSendingAll(true);
      const response = await api.post("/notifications/send-all-unpaid");
      const data = response.data || {};
      if (Number(data.failed || 0) > 0) toast(data.message || "Reminder process completed");
      else toast.success(data.message || "Reminders sent successfully");
      await fetchNotifications();
      setShowSendModal(false);
      setSendMode(null);
      setSelectedStudentIds([]);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send reminders"));
    } finally { setIsSendingAll(false); }
  };

  const openSendModal = () => {
    if (eligibleNotifications.length === 0) return toast.error("No unpaid students available");
    setSendMode(null);
    setSelectedStudentIds([]);
    setShowSendModal(true);
  };

  const closeSendModal = () => {
    if (isSendingAll || isSendingSelected) return;
    setShowSendModal(false);
    setSendMode(null);
    setSelectedStudentIds([]);
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((current) => current.includes(studentId)
      ? current.filter((id) => id !== studentId)
      : [...current, studentId]);
  };

  const handleSendSelected = async () => {
    if (selectedStudentIds.length === 0) return toast.error("Select at least one student");
    try {
      setIsSendingSelected(true);
      const response = await api.post("/notifications/send-selected", { studentIds: selectedStudentIds });
      const data = response.data || {};
      if (Number(data.failed || 0) > 0) toast(data.message || "Reminder process completed");
      else toast.success(data.message || "Reminders sent successfully");
      closeSendModal();
      await fetchNotifications();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send reminders"));
    } finally { setIsSendingSelected(false); }
  };

  const handlePreferenceChange = async (item, key, value) => {
    const previous = item.notificationPreferences || {};
    const next = { ...previous, [key]: value };
    setNotifications((current) => current.map((entry) => entry.studentId === item.studentId ? { ...entry, notificationPreferences: next } : entry));
    try {
      setSavingPreference(`${item.studentId}:${key}`);
      const response = await api.patch(`/notifications/student/${item.studentId}/preferences`, { [key]: value });
      const saved = response.data?.notificationPreferences;
      if (saved) setNotifications((current) => current.map((entry) => entry.studentId === item.studentId ? { ...entry, notificationPreferences: saved } : entry));
      toast.success("Notification preference updated");
    } catch (error) {
      setNotifications((current) => current.map((entry) => entry.studentId === item.studentId ? { ...entry, notificationPreferences: previous } : entry));
      toast.error(getErrorMessage(error, "Failed to update preference"));
    } finally { setSavingPreference(null); }
  };

  const clearFilters = () => { setStatusFilter("all"); setCourseFilter("all"); setReminderFilter("all"); };
  const activeFilterCount = Number(statusFilter !== "all") + Number(courseFilter !== "all") + Number(reminderFilter !== "all");

  return (
    <div className="notification-page">
      <div className="notification-summary-grid">
        <SummaryCard icon={<FiBell />} label="Unpaid" value={summary.unpaid} type="unpaid" />
        <SummaryCard icon={<FiClock />} label="Due Soon" value={summary.dueSoon} type="soon" />
        <SummaryCard icon={<FiClock />} label="Due Today" value={summary.dueToday} type="today" />
        <SummaryCard icon={<FiBell />} label="Overdue" value={summary.overdue} type="overdue" />
        <SummaryCard icon={<FiSend />} label="Reminder Sent" value={summary.reminderSent} type="sent" />
        <SummaryCard icon={<FiCheckCircle />} label="Paid After Reminder" value={summary.paidAfterReminder} type="paid" />
      </div>

      <section className="notification-section">
        <div className="notification-toolbar">
          <div className="notification-search"><FiSearch /><input type="text" placeholder="Search student, roll no, course or batch..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <div className="notification-filter-wrapper">
            <button type="button" className={`notification-toolbar-btn ${showFilters ? "active" : ""}`} onClick={() => setShowFilters((value) => !value)}><FiFilter />Filter{activeFilterCount > 0 && <span className="filter-count-badge">{activeFilterCount}</span>}</button>
            {showFilters && <div className="notification-filter-dropdown">
              <div className="notification-filter-head"><strong>Filter</strong><div className="filter-header-actions"><button type="button" disabled={!activeFilterCount} onClick={clearFilters}>Clear</button><button type="button" className="filter-close-btn" onClick={() => setShowFilters(false)}><FiX /></button></div></div>
              <label>Status<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All</option><option value="due_soon">Due Soon</option><option value="due_today">Due Today</option><option value="overdue">Overdue</option><option value="paid">Paid</option><option value="active">Active</option></select></label>
              <label>Course<select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}><option value="all">All Courses</option>{courseOptions.map((course) => <option key={course} value={course}>{course}</option>)}</select></label>
              <label>Reminder<select value={reminderFilter} onChange={(e) => setReminderFilter(e.target.value)}><option value="all">All</option><option value="sent">Sent</option><option value="not_sent">Not Sent</option><option value="paid_after">Paid After Reminder</option></select></label>
            </div>}
          </div>
          <button type="button" className="notification-toolbar-btn" onClick={handleRefresh} disabled={isRefreshing}><FiRefreshCw />{isRefreshing ? "Refreshing..." : "Refresh"}</button>
          <button type="button" className="notification-send-all-btn" onClick={openSendModal} disabled={!eligibleNotifications.length}><FiSend />Send Notification</button>
        </div>

        <div className="notification-table-card">
          {isLoading ? <div className="notification-empty"><LoadingLogo />Loading notifications...</div> : filteredNotifications.length === 0 ? <div className="notification-empty">No notifications found</div> :
            <div className="notification-table-wrap"><table className="notification-table">
              <thead><tr><th>Student</th><th>Course</th><th>Pending</th><th>Due Date</th><th>Status</th><th>Reminder</th><th>Next Alert</th><th>Action</th></tr></thead>
              <tbody>{filteredNotifications.map((item) => <tr key={item.studentId}>
                <td><div className="notification-student-cell"><div className="notification-avatar">{item.studentName?.charAt(0)?.toUpperCase() || "S"}</div><div><strong>{item.studentName}</strong><span>{item.rollNo}</span></div></div></td>
                <td><strong>{item.course}</strong><span className="notification-subtext">{item.batch || "-"}</span></td>
                <td><strong>₹{formatMoney(item.pendingAmount)}</strong><span className="notification-subtext">Paid ₹{formatMoney(item.paidAmount)}</span></td>
                <td>{formatDate(item.feeEndingDate)}</td>
                <td><span className={`notification-status ${item.alertType}`}>{getAlertLabel(item)}</span></td>
                <td><strong>{Number(item.reminderCount || 0)} Sent</strong><span className="notification-subtext">{item.lastReminderSentAt ? formatDateTime(item.lastReminderSentAt) : "Not sent"}</span></td>
                <td>{item.paymentStatus === "paid" ? <span className="notification-completed">Completed</span> : <><strong>{formatDate(item.nextReminderDate)}</strong><span className="notification-subtext">Auto re-alert</span></>}</td>
                <td><div className="notification-action-cell">
                  {item.paymentStatus !== "paid" && Number(item.pendingAmount || 0) > 0 ? <button type="button" className="notification-row-send" disabled={sendingStudentId === item.studentId || item.notificationPreferences?.muteAll || item.notificationPreferences?.muteReminder} onClick={() => handleSendReminder(item)}><FiSend />{sendingStudentId === item.studentId ? "Sending" : "Send"}</button> : <span className="notification-paid"><FiCheckCircle />Paid</span>}
                  <button type="button" className="notification-more-btn" aria-label={`Notification settings for ${item.studentName}`} aria-expanded={openPreferenceId === item.studentId} onClick={() => setOpenPreferenceId((current) => current === item.studentId ? null : item.studentId)}><FiMoreVertical /></button>
                  {openPreferenceId === item.studentId && <div className="notification-preference-menu">
                    <div className="notification-preference-pointer" />
                    <div className="notification-preference-title"><strong>Notification settings</strong><span>{item.studentName}</span></div>
                    <PreferenceToggle item={item} preferenceKey="muteAll" label="Mute all messages" description="No fee messages will be sent" savingPreference={savingPreference} onChange={handlePreferenceChange} />
                    <PreferenceToggle item={item} preferenceKey="muteReminder" label="Mute reminder messages" description="Fee reminders will not be sent" savingPreference={savingPreference} onChange={handlePreferenceChange} />
                  </div>}
                </div></td>
              </tr>)}</tbody>
            </table></div>}
        </div>
      </section>
      {showSendModal && <div className="notification-send-modal-overlay">
        <div className="notification-send-modal" role="dialog" aria-modal="true" aria-labelledby="notification-send-title">
          <div className="notification-send-modal-head"><div><span>SEND NOTIFICATION</span><h2 id="notification-send-title">Choose recipients</h2><p>Send a fee reminder to all unpaid students or only selected students.</p></div><button type="button" onClick={closeSendModal} aria-label="Close"><FiX /></button></div>
          {!sendMode ? <div className="notification-send-mode-grid">
            <button type="button" onClick={() => setSendMode("all")}><FiSend /><strong>Send to All</strong><small>Send to all {eligibleNotifications.length} unpaid students</small></button>
            <button type="button" onClick={() => setSendMode("individual")}><FiBell /><strong>Individual</strong><small>Select one or more students</small></button>
          </div> : sendMode === "all" ? <div className="notification-send-confirm"><strong>Send to all {eligibleNotifications.length} unpaid students?</strong><p>This will send the reminder to every eligible student.</p><div><button type="button" onClick={() => setSendMode(null)} disabled={isSendingAll}>Back</button><button type="button" className="notification-send-all-btn" onClick={handleSendAll} disabled={isSendingAll}><FiSend />{isSendingAll ? "Sending..." : "Send to All"}</button></div></div> : <div className="notification-individual-picker">
            <div className="notification-picker-actions"><strong>Select students</strong><button type="button" onClick={() => setSelectedStudentIds(selectedStudentIds.length === eligibleNotifications.length ? [] : eligibleNotifications.map((item) => item.studentId))}>{selectedStudentIds.length === eligibleNotifications.length ? "Clear all" : "Select all"}</button></div>
            <div className="notification-picker-list">{eligibleNotifications.map((item) => <label key={item.studentId}><input type="checkbox" checked={selectedStudentIds.includes(item.studentId)} onChange={() => toggleStudentSelection(item.studentId)} /><span><strong>{item.studentName}</strong><small>{item.rollNo} · {item.course} · Pending ₹{formatMoney(item.pendingAmount)}</small></span></label>)}</div>
            <div className="notification-send-confirm"><div><button type="button" onClick={() => setSendMode(null)} disabled={isSendingSelected}>Back</button><button type="button" className="notification-send-all-btn" onClick={handleSendSelected} disabled={isSendingSelected || selectedStudentIds.length === 0}><FiSend />{isSendingSelected ? "Sending..." : `Send to ${selectedStudentIds.length} Student${selectedStudentIds.length === 1 ? "" : "s"}`}</button></div></div>
          </div>}
        </div>
      </div>}

    </div>
  );
};

const PreferenceToggle = ({ item, preferenceKey, label, description, savingPreference, onChange }) => {
  const checked = Boolean(item.notificationPreferences?.[preferenceKey]);
  return <label className="notification-preference-row"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} disabled={savingPreference === `${item.studentId}:${preferenceKey}`} onChange={(event) => onChange(item, preferenceKey, event.target.checked)} /><i aria-hidden="true" /></label>;
};

const SummaryCard = ({ icon, label, value, type }) => <article className={`notification-summary-card ${type}`}><div className="notification-summary-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></article>;

export default Notification;
