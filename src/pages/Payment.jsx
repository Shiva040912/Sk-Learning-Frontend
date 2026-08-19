import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiFilter,
  FiPlus,
  FiRotateCcw,
  FiSearch,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";

import api from "../services/axios";
import LoadingLogo from "../components/LoadingLogo";
import "../styles/payments.css";

const initialFeeForm = {
  totalFee: "",
  feeType: "",
  feeEndingDate: "",
  selectedMonths: "",
};

const Payments = () => {
  const [students, setStudents] = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);

  const [feeSettings, setFeeSettings] = useState({
    monthlyFeeEnabled: true,
    defaultMonths: 12,
    minimumMonths: 3,
    maximumMonths: 12,
    partialFeeEnabled: true,
    minimumPartialAmount: 10000,
    yearlyFeeEnabled: true,
  });

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feeTypeFilter, setFeeTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isFeeSaving, setIsFeeSaving] = useState(false);
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);
  const [isReversing, setIsReversing] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);

  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);

  const [feeForm, setFeeForm] = useState(initialFeeForm);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [partialAmount, setPartialAmount] = useState("");

  const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;

    if (!error?.response) {
      return "Unable to connect to the server. Please check your connection.";
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
      return "Requested payment data was not found.";
    }

    if (error.response.status === 409) {
      return "This payment information already exists.";
    }

    return fallback;
  };

  const fetchPaymentPageData = async () => {
    try {
      setIsLoading(true);

      const [studentsResponse, paymentsResponse, settingsResponse] =
        await Promise.all([
          api.get("/students"),
          api.get("/payments"),
          api.get("/settings/fees"),
        ]);

      setStudents(studentsResponse.data || []);
      setPaymentRecords(paymentsResponse.data || []);

      setFeeSettings((current) => ({
        ...current,
        ...(settingsResponse.data || {}),
      }));
    } catch (error) {
      console.error("Payment page load error:", error?.response?.data || error);

      toast.error(getErrorMessage(error, "Failed to load payment details"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentPageData();
  }, []);

  const paymentRows = useMemo(() => {
    return students.map((student) => {
      const records = paymentRecords
        .filter(
          (payment) =>
            String(payment.studentId) === String(student._id) ||
            String(payment.student?._id) === String(student._id),
        )
        .sort(
          (a, b) =>
            new Date(b.paymentDate || b.createdAt || 0) -
            new Date(a.paymentDate || a.createdAt || 0),
        );

      const latestPayment = records[0];

      return {
        ...student,
        studentName: student.studentName || "-",
        rollNo: student.rollNo || "-",
        course: student.course || "-",
        batch: student.batch || "-",
        totalFee: Number(student.totalFee || 0),
        paidAmount: Number(student.paidAmount || 0),
        pendingAmount: Number(student.pendingAmount || 0),
        feeType: student.feeType || "",
        feeEndingDate: student.feeEndingDate || null,
        feeSetupCompleted: Boolean(student.feeSetupCompleted),
        selectedMonths: Number(student.selectedMonths || 0),
        monthlyAmount: Number(student.monthlyAmount || 0),
        paidMonths: Number(student.paidMonths || 0),
        paymentStatus: ["unpaid", "partial", "paid"].includes(
          student.paymentStatus,
        )
          ? student.paymentStatus
          : "unpaid",
        paymentMethod:
          latestPayment?.paymentMethod || student.paymentMethod || "",
        paymentDate:
          latestPayment?.paymentDate || latestPayment?.createdAt || null,
        paymentRecords: records,
      };
    });
  }, [students, paymentRecords]);

  const summary = useMemo(() => {
    return paymentRows.reduce(
      (result, student) => {
        if (student.feeSetupCompleted) {
          result.configuredFees += student.totalFee;
          result.collected += student.paidAmount;
          result.pending += student.pendingAmount;
          result.configuredStudents += 1;
        }

        if (student.paymentStatus === "paid") {
          result.paidStudents += 1;
        }

        return result;
      },
      {
        configuredFees: 0,
        collected: 0,
        pending: 0,
        configuredStudents: 0,
        paidStudents: 0,
      },
    );
  }, [paymentRows]);

  const courseOptions = useMemo(() => {
    return [
      ...new Set(
        paymentRows
          .map((student) => student.course)
          .filter((course) => course && course !== "-"),
      ),
    ];
  }, [paymentRows]);

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return paymentRows
      .filter((student) => {
        const matchesSearch =
          !keyword ||
          student.studentName.toLowerCase().includes(keyword) ||
          student.rollNo.toLowerCase().includes(keyword) ||
          student.course.toLowerCase().includes(keyword) ||
          student.batch.toLowerCase().includes(keyword);

        const matchesCourse =
          courseFilter === "all" || student.course === courseFilter;

        const matchesStatus =
          statusFilter === "all" || student.paymentStatus === statusFilter;

        const matchesFeeType =
          feeTypeFilter === "all" || student.feeType === feeTypeFilter;

        return (
          matchesSearch && matchesCourse && matchesStatus && matchesFeeType
        );
      })
      .sort((a, b) =>
        String(a.rollNo || "").localeCompare(
          String(b.rollNo || ""),
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          },
        ),
      );
  }, [paymentRows, search, courseFilter, statusFilter, feeTypeFilter]);

  const activeFilterCount =
    Number(courseFilter !== "all") +
    Number(statusFilter !== "all") +
    Number(feeTypeFilter !== "all");

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

  const formatFeeType = (value) => {
    const values = {
      monthly: "Monthly",
      partial: "Partial",
      yearly: "Yearly",
    };

    return values[value] || "-";
  };

  const formatPaymentMethod = (value) => {
    const values = {
      cash: "Cash",
      bank: "Bank",
      upi: "UPI",
      qr: "QR",
    };

    return values[value] || "-";
  };

  const getStatusLabel = (status) => {
    if (status === "paid") return "Paid";
    if (status === "partial") return "Partial";
    return "Unpaid";
  };

  const getFeeTypeEnabled = (type) => {
    if (type === "monthly") return feeSettings.monthlyFeeEnabled;
    if (type === "partial") return feeSettings.partialFeeEnabled;
    if (type === "yearly") return feeSettings.yearlyFeeEnabled;
    return false;
  };

  const openFeeSetupModal = (student) => {
    const defaultMonths = Number(feeSettings.defaultMonths || 12);

    setSelectedStudent(student);

    setFeeForm({
      totalFee:
        student.feeSetupCompleted && student.totalFee
          ? String(student.totalFee)
          : "",
      feeType: student.feeType || "",
      feeEndingDate: student.feeEndingDate
        ? new Date(student.feeEndingDate).toISOString().split("T")[0]
        : "",
      selectedMonths:
        student.feeType === "monthly" && student.selectedMonths
          ? String(student.selectedMonths)
          : String(defaultMonths),
    });

    setShowFeeModal(true);
  };

  const closeFeeSetupModal = () => {
    if (isFeeSaving) return;

    setShowFeeModal(false);
    setSelectedStudent(null);
    setFeeForm(initialFeeForm);
  };

  const handleFeeFormChange = (event) => {
    const { name, value } = event.target;

    setFeeForm((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      if (name === "feeType" && value === "monthly") {
        next.selectedMonths = String(feeSettings.defaultMonths || 12);
      }

      if (name === "feeType" && value !== "monthly") {
        next.selectedMonths = "";
      }

      return next;
    });
  };

  const monthlyPreview = useMemo(() => {
    if (feeForm.feeType !== "monthly") return 0;

    const totalFee = Number(feeForm.totalFee);
    const months = Number(feeForm.selectedMonths);

    if (!totalFee || !months) return 0;

    return Number((totalFee / months).toFixed(2));
  }, [feeForm.totalFee, feeForm.feeType, feeForm.selectedMonths]);

  const handleFeeSetup = async (event) => {
    event.preventDefault();

    if (!selectedStudent) return;

    const totalFee = Number(feeForm.totalFee);

    if (!Number.isFinite(totalFee) || totalFee <= 0) {
      toast.error("Enter a valid total fee");
      return;
    }

    if (!feeForm.feeType) {
      toast.error("Select fee type");
      return;
    }

    if (!getFeeTypeEnabled(feeForm.feeType)) {
      toast.error(
        `${formatFeeType(feeForm.feeType)} payment is disabled in Settings`,
      );
      return;
    }

    if (!feeForm.feeEndingDate) {
      toast.error("Select fees ending date");
      return;
    }

    const payload = {
      totalFee,
      feeType: feeForm.feeType,
      feeEndingDate: feeForm.feeEndingDate,
    };

    if (feeForm.feeType === "monthly") {
      const months = Number(feeForm.selectedMonths);
      const minimumMonths = Number(feeSettings.minimumMonths || 3);
      const maximumMonths = Number(feeSettings.maximumMonths || 12);

      if (!Number.isInteger(months)) {
        toast.error("Select a valid number of months");
        return;
      }

      if (months < minimumMonths || months > maximumMonths) {
        toast.error(
          `Monthly duration must be between ${minimumMonths} and ${maximumMonths} months`,
        );
        return;
      }

      payload.selectedMonths = months;
    }

    try {
      setIsFeeSaving(true);

      const response = await api.put(
        `/payments/student/${selectedStudent._id}/fee-setup`,
        payload,
      );

      toast.success(
        response.data?.message ||
          `${selectedStudent.studentName} fee setup completed`,
      );

      setShowFeeModal(false);
      setSelectedStudent(null);
      setFeeForm(initialFeeForm);

      await fetchPaymentPageData();
    } catch (error) {
      console.error("Fee setup error:", error?.response?.data || error);

      toast.error(getErrorMessage(error, "Failed to setup student fee"));
    } finally {
      setIsFeeSaving(false);
    }
  };

  const openPaymentModal = (student) => {
    if (!student.feeSetupCompleted) {
      toast.error("Setup the student fee before collecting payment");
      return;
    }

    if (student.paymentStatus === "paid" || student.pendingAmount <= 0) {
      toast.success("This student fee is already fully paid");
      return;
    }

    setSelectedStudent(student);
    setSelectedPaymentMethod("");

    if (student.feeType === "partial") {
      const suggested = Math.min(
        Number(feeSettings.minimumPartialAmount || 0),
        Number(student.pendingAmount || 0),
      );

      setPartialAmount(suggested > 0 ? String(suggested) : "");
    } else {
      setPartialAmount("");
    }

    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    if (isPaymentSaving) return;

    setShowPaymentModal(false);
    setSelectedStudent(null);
    setSelectedPaymentMethod("");
    setPartialAmount("");
  };

  const paymentPreviewAmount = useMemo(() => {
    if (!selectedStudent) return 0;

    if (selectedStudent.feeType === "monthly") {
      const nextMonth = Number(selectedStudent.paidMonths || 0) + 1;

      const isLastMonth =
        nextMonth === Number(selectedStudent.selectedMonths || 0);

      return isLastMonth
        ? Number(selectedStudent.pendingAmount || 0)
        : Math.min(
            Number(selectedStudent.monthlyAmount || 0),
            Number(selectedStudent.pendingAmount || 0),
          );
    }

    if (selectedStudent.feeType === "partial") {
      return Number(partialAmount || 0);
    }

    if (selectedStudent.feeType === "yearly") {
      return Number(selectedStudent.pendingAmount || 0);
    }

    return 0;
  }, [selectedStudent, partialAmount]);

  const handleConfirmPayment = async () => {
    if (!selectedStudent) return;

    if (!selectedPaymentMethod) {
      toast.error("Select payment method");
      return;
    }

    const payload = {
      paymentMethod: selectedPaymentMethod,
    };

    if (selectedStudent.feeType === "partial") {
      const amount = Number(partialAmount);
      const pendingAmount = Number(selectedStudent.pendingAmount || 0);
      const minimumPartial = Number(feeSettings.minimumPartialAmount || 0);

      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Enter a valid partial payment amount");
        return;
      }

      if (amount > pendingAmount) {
        toast.error(
          `Payment cannot be greater than pending amount ₹${formatMoney(
            pendingAmount,
          )}`,
        );
        return;
      }

      if (amount < minimumPartial && amount !== pendingAmount) {
        toast.error(
          `Minimum partial payment is ₹${formatMoney(minimumPartial)}`,
        );
        return;
      }

      payload.amount = amount;
    }

    try {
      setIsPaymentSaving(true);

      const response = await api.post(
        `/payments/student/${selectedStudent._id}/collect`,
        payload,
      );

      toast.success(response.data?.message || "Payment collected successfully");

      setShowPaymentModal(false);
      setSelectedStudent(null);
      setSelectedPaymentMethod("");
      setPartialAmount("");

      await fetchPaymentPageData();
    } catch (error) {
      console.error("Collect payment error:", error?.response?.data || error);

      toast.error(getErrorMessage(error, "Failed to collect payment"));
    } finally {
      setIsPaymentSaving(false);
    }
  };

  const openReverseModal = (student) => {
    if (!student.feeSetupCompleted) {
      toast.error("Fee setup is not completed for this student");
      return;
    }

    setSelectedStudent(student);
    setShowReverseModal(true);
  };

  const closeReverseModal = () => {
    if (isReversing) return;

    setShowReverseModal(false);
    setSelectedStudent(null);
  };

  const handleReverseLastPayment = async () => {
    if (!selectedStudent) return;

    try {
      setIsReversing(true);

      const response = await api.post(
        `/payments/student/${selectedStudent._id}/reset-fee`,
      );

      toast.success(response.data?.message || "Fee setup reset successfully");

      setShowReverseModal(false);
      setSelectedStudent(null);

      await fetchPaymentPageData();
    } catch (error) {
      console.error("Reverse payment error:", error?.response?.data || error);

      toast.error(getErrorMessage(error, "Failed to reset fee setup"));
    } finally {
      setIsReversing(false);
    }
  };
  const openStudentDetails = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const closeStudentDetails = () => {
    setShowDetailsModal(false);
    setSelectedStudent(null);
  };

  return (
    <div className="payments-page">
      <div className="payments-summary-grid">
        <article className="payment-summary-card">
          <div className="payment-summary-icon">
            <FiDollarSign />
          </div>
          <div>
            <span>Total Fees</span>
            <strong>₹{formatMoney(summary.configuredFees)}</strong>
            <small>{summary.configuredStudents} students configured</small>
          </div>
        </article>

        <article className="payment-summary-card">
          <div className="payment-summary-icon">
            <FiCheckCircle />
          </div>
          <div>
            <span>Collected</span>
            <strong>₹{formatMoney(summary.collected)}</strong>
            <small>{summary.paidStudents} fully paid students</small>
          </div>
        </article>

        <article className="payment-summary-card">
          <div className="payment-summary-icon">
            <FiClock />
          </div>
          <div>
            <span>Pending</span>
            <strong>₹{formatMoney(summary.pending)}</strong>
            <small>Outstanding student fees</small>
          </div>
        </article>

        <article className="payment-summary-card">
          <div className="payment-summary-icon">
            <FiTrendingUp />
          </div>
          <div>
            <span>Setup Completed</span>
            <strong>{summary.configuredStudents}</strong>
            <small>{paymentRows.length} total students</small>
          </div>
        </article>
      </div>

      <section className="payment-history-section">
        <div className="payment-toolbar">
          <div className="payment-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search student, roll no, course or batch..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="payment-filter-wrapper">
            <button
              type="button"
              className={`payment-filter-button ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters((current) => !current)}
            >
              <FiFilter />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="filter-count-badge">{activeFilterCount}</span>
              )}
            </button>

            {showFilters && (
              <div className="payment-filter-dropdown">
                <div className="payment-filter-header">
                  <strong>Filter Students</strong>
                  <div className="filter-header-actions">
                    <button type="button" disabled={activeFilterCount === 0} onClick={() => {
                      setCourseFilter("all");
                      setStatusFilter("all");
                      setFeeTypeFilter("all");
                    }}>Clear</button>
                    <button type="button" className="filter-close-btn" onClick={() => setShowFilters(false)} aria-label="Close filters">
                      <FiX />
                    </button>
                  </div>
                </div>

                <div className="payment-filter-field">
                  <label>Course</label>
                  <select
                    value={courseFilter}
                    onChange={(event) => setCourseFilter(event.target.value)}
                  >
                    <option value="all">All Courses</option>
                    {courseOptions.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="payment-filter-field">
                  <label>Status</label>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="payment-filter-field">
                  <label>Fee Type</label>
                  <select
                    value={feeTypeFilter}
                    onChange={(event) => setFeeTypeFilter(event.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="monthly">Monthly</option>
                    <option value="partial">Partial</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="payment-table-card">
          {isLoading ? (
            <div className="payment-message">
              <LoadingLogo />
              <span>Loading payment details...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="payment-message">
              <FiCreditCard />
              <strong>No students found</strong>
              <span>Try changing your search or filter.</span>
            </div>
          ) : (
            <div className="payment-table-wrapper">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Course</th>
                    <th>Total Fees</th>
                    <th>Status</th>
                    <th>Reverse</th>
                    <th>Setup</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={student._id}
                      className="payment-clickable-row"
                      onClick={() => openStudentDetails(student)}
                    >
                      <td data-label="S.No">
                        <span className="payment-serial">{index + 1}</span>
                      </td>

                      <td data-label="Name">
                        <div className="payment-student">
                          <div className="payment-avatar">
                            {student.studentName?.charAt(0)?.toUpperCase() ||
                              "S"}
                          </div>
                          <div>
                            <strong>{student.studentName}</strong>
                            {student.feeSetupCompleted && (
                              <span>{formatFeeType(student.feeType)}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td data-label="Roll No">
                        <span className="payment-roll">{student.rollNo}</span>
                      </td>

                      <td data-label="Course">
                        <span className="payment-course">{student.course}</span>
                      </td>

                      <td data-label="Total Fees">
                        {student.feeSetupCompleted ? (
                          <div className="payment-fee-cell">
                            <strong>₹{formatMoney(student.totalFee)}</strong>
                            {student.pendingAmount > 0 && (
                              <span>
                                Pending ₹{formatMoney(student.pendingAmount)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="payment-not-set">Not Set</span>
                        )}
                      </td>

                      <td data-label="Status">
                        <button
                          type="button"
                          className={`payment-status-control ${student.paymentStatus}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            openPaymentModal(student);
                          }}
                          disabled={
                            !student.feeSetupCompleted ||
                            student.paymentStatus === "paid"
                          }
                        >
                          <span className="payment-switch-track">
                            <span className="payment-switch-thumb" />
                          </span>
                          <span className="payment-switch-label">
                            {getStatusLabel(student.paymentStatus)}
                          </span>
                        </button>
                      </td>

                      <td data-label="Reverse">
                        <button
                          type="button"
                          className="payment-reverse-btn"
                          title={
                            student.feeSetupCompleted
                              ? "Reset fee setup"
                              : "Fee setup not completed"
                          }
                          disabled={!student.feeSetupCompleted}
                          onClick={(event) => {
                            event.stopPropagation();
                            openReverseModal(student);
                          }}
                        >
                          <FiRotateCcw />
                        </button>
                      </td>

                      <td data-label="Setup">
                        {student.feeSetupCompleted ? (
                          <span
                            className="fee-setup-completed"
                            title="Fee setup completed"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <FiCheckCircle />
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="fee-setup-add"
                            title="Setup student fee"
                            onClick={(event) => {
                              event.stopPropagation();
                              openFeeSetupModal(student);
                            }}
                          >
                            <FiPlus />
                          </button>
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

      {showFeeModal && selectedStudent && (
        <div className="payment-modal-overlay">
          <div className="payment-modal fee-setup-modal">
            <div className="payment-modal-header">
              <div>
                <span>FEE SETUP</span>
                <h2>{selectedStudent.studentName}</h2>
                <p>
                  {selectedStudent.rollNo} • {selectedStudent.course}
                </p>
              </div>
              <button
                type="button"
                className="payment-modal-close"
                onClick={closeFeeSetupModal}
                aria-label="Close fee setup"
              >
                <FiX />
              </button>
            </div>

            <form className="fee-setup-form" onSubmit={handleFeeSetup}>
              <div className="payment-form-grid">
                <div className="payment-form-group">
                  <label>Total Fees *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    name="totalFee"
                    value={feeForm.totalFee}
                    onChange={handleFeeFormChange}
                    placeholder="Enter total fees"
                  />
                </div>

                <div className="payment-form-group">
                  <label>Fee Type *</label>
                  <select
                    name="feeType"
                    value={feeForm.feeType}
                    onChange={handleFeeFormChange}
                  >
                    <option value="">Select fee type</option>
                    <option
                      value="monthly"
                      disabled={!feeSettings.monthlyFeeEnabled}
                    >
                      Monthly
                    </option>
                    <option
                      value="partial"
                      disabled={!feeSettings.partialFeeEnabled}
                    >
                      Partial
                    </option>
                    <option
                      value="yearly"
                      disabled={!feeSettings.yearlyFeeEnabled}
                    >
                      Yearly
                    </option>
                  </select>
                </div>

                {feeForm.feeType === "monthly" && (
                  <div className="payment-form-group">
                    <label>Payment Duration *</label>
                    <select
                      name="selectedMonths"
                      value={feeForm.selectedMonths}
                      onChange={handleFeeFormChange}
                    >
                      {Array.from(
                        {
                          length:
                            Number(feeSettings.maximumMonths || 12) -
                            Number(feeSettings.minimumMonths || 3) +
                            1,
                        },
                        (_, index) =>
                          Number(feeSettings.minimumMonths || 3) + index,
                      ).map((month) => (
                        <option key={month} value={month}>
                          {month} Months
                          {month === Number(feeSettings.defaultMonths)
                            ? " (Default)"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="payment-form-group">
                  <label>Fees Ending Date *</label>
                  <input
                    type="date"
                    name="feeEndingDate"
                    value={feeForm.feeEndingDate}
                    onChange={handleFeeFormChange}
                  />
                </div>
              </div>

              {feeForm.feeType === "monthly" && (
                <div className="fee-rule-preview">
                  <div>
                    <span>Selected Duration</span>
                    <strong>{feeForm.selectedMonths || "-"} Months</strong>
                  </div>
                  <div>
                    <span>Monthly Amount</span>
                    <strong>₹{formatMoney(monthlyPreview)}</strong>
                  </div>
                </div>
              )}

              {feeForm.feeType === "partial" && (
                <div className="fee-rule-note">
                  Minimum partial payment will be{" "}
                  <strong>
                    ₹{formatMoney(feeSettings.minimumPartialAmount)}
                  </strong>
                  . Final remaining balance can be lower than this amount.
                </div>
              )}

              {feeForm.feeType === "yearly" && (
                <div className="fee-rule-note">
                  Yearly mode collects the complete pending fee in one payment.
                </div>
              )}

              <div className="payment-modal-actions">
                <button
                  type="button"
                  className="payment-secondary-btn"
                  onClick={closeFeeSetupModal}
                  disabled={isFeeSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="payment-primary-btn"
                  disabled={isFeeSaving}
                >
                  {isFeeSaving ? "Setting..." : "Set Fee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedStudent && (
        <div className="payment-modal-overlay">
          <div className="payment-modal payment-collect-modal">
            <div className="payment-modal-header">
              <div>
                <span>COLLECT PAYMENT</span>
                <h2>{selectedStudent.studentName}</h2>
                <p>
                  {formatFeeType(selectedStudent.feeType)} • Pending ₹
                  {formatMoney(selectedStudent.pendingAmount)}
                </p>
              </div>
              <button
                type="button"
                className="payment-modal-close"
                onClick={closePaymentModal}
                aria-label="Close payment"
              >
                <FiX />
              </button>
            </div>

            <div className="payment-collect-body">
              <div className="collect-summary">
                <div>
                  <span>Total Fee</span>
                  <strong>₹{formatMoney(selectedStudent.totalFee)}</strong>
                </div>
                <div>
                  <span>Already Paid</span>
                  <strong>₹{formatMoney(selectedStudent.paidAmount)}</strong>
                </div>
                <div>
                  <span>Pending</span>
                  <strong>₹{formatMoney(selectedStudent.pendingAmount)}</strong>
                </div>
              </div>

              {selectedStudent.feeType === "monthly" && (
                <div className="payment-rule-box">
                  <span>Monthly Payment</span>
                  <strong>₹{formatMoney(paymentPreviewAmount)}</strong>
                  <small>
                    Month{" "}
                    {Math.min(
                      Number(selectedStudent.paidMonths || 0) + 1,
                      Number(selectedStudent.selectedMonths || 0),
                    )}{" "}
                    of {selectedStudent.selectedMonths}
                  </small>
                </div>
              )}

              {selectedStudent.feeType === "partial" && (
                <div className="payment-form-group">
                  <label>Partial Payment Amount *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={partialAmount}
                    onChange={(event) => setPartialAmount(event.target.value)}
                    placeholder={`Minimum ₹${formatMoney(
                      feeSettings.minimumPartialAmount,
                    )}`}
                  />
                  <small className="payment-field-hint">
                    Minimum ₹{formatMoney(feeSettings.minimumPartialAmount)}. If
                    final pending balance is lower, that exact balance is
                    allowed.
                  </small>
                </div>
              )}

              {selectedStudent.feeType === "yearly" && (
                <div className="payment-rule-box">
                  <span>Full Payment</span>
                  <strong>₹{formatMoney(paymentPreviewAmount)}</strong>
                  <small>Yearly fee will be closed with this payment.</small>
                </div>
              )}

              <div className="payment-form-group">
                <label>Payment Method *</label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(event) =>
                    setSelectedPaymentMethod(event.target.value)
                  }
                >
                  <option value="">Select payment method</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="upi">UPI</option>
                  <option value="qr">QR</option>
                </select>
              </div>

              <div className="payment-collect-total">
                <span>Collect Now</span>
                <strong>₹{formatMoney(paymentPreviewAmount)}</strong>
              </div>

              <div className="payment-modal-actions">
                <button
                  type="button"
                  className="payment-secondary-btn"
                  onClick={closePaymentModal}
                  disabled={isPaymentSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="payment-primary-btn"
                  onClick={handleConfirmPayment}
                  disabled={isPaymentSaving}
                >
                  <FiCheckCircle />
                  {isPaymentSaving ? "Collecting..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReverseModal && selectedStudent && (
        <div className="payment-modal-overlay">
          <div className="payment-modal payment-reverse-modal">
            <div className="payment-modal-header">
              <div>
                <span>RESET FEE SETUP</span>
                <h2>{selectedStudent.studentName}</h2>
                <p>
                  {selectedStudent.rollNo} • {selectedStudent.course}
                </p>
              </div>

              <button
                type="button"
                className="payment-modal-close"
                onClick={closeReverseModal}
                aria-label="Close reset fee setup"
              >
                <FiX />
              </button>
            </div>

            <div className="payment-reverse-body">
              <div className="reverse-icon-wrap">
                <FiRotateCcw />
              </div>

              <h3>Reset this student's fee setup?</h3>

              <p>
                This will clear the current fee setup and payment history so you
                can configure the fee again from the beginning.
              </p>

              <div className="reverse-payment-summary">
                <div>
                  <span>Total Fee</span>
                  <strong>₹{formatMoney(selectedStudent.totalFee)}</strong>
                </div>

                <div>
                  <span>Fee Type</span>
                  <strong>{formatFeeType(selectedStudent.feeType)}</strong>
                </div>

                <div>
                  <span>Paid / Pending</span>
                  <strong>
                    ₹{formatMoney(selectedStudent.paidAmount)} / ₹
                    {formatMoney(selectedStudent.pendingAmount)}
                  </strong>
                </div>
              </div>

              <div className="reverse-reset-list">
                <div>
                  <span>Payments</span>
                  <strong>Will be cleared</strong>
                </div>

                <div>
                  <span>Invoices</span>
                  <strong>Will be deactivated</strong>
                </div>

                <div>
                  <span>Fee Setup</span>
                  <strong>Will return to Not Set</strong>
                </div>
              </div>

              <div className="reverse-warning">
                After reset, the Setup column will show the + button again. You
                can then enter the correct total fee, fee type, duration and
                ending date from the beginning.
              </div>

              <div className="payment-modal-actions">
                <button
                  type="button"
                  className="payment-secondary-btn"
                  onClick={closeReverseModal}
                  disabled={isReversing}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="payment-reverse-confirm-btn"
                  onClick={handleReverseLastPayment}
                  disabled={isReversing}
                >
                  <FiRotateCcw />

                  {isReversing ? "Resetting..." : "Reset Fee Setup"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedStudent && (
        <div className="payment-modal-overlay">
          <div className="payment-modal payment-details-modal">
            <div className="payment-modal-header">
              <div>
                <span>STUDENT PAYMENT DETAILS</span>
                <h2>{selectedStudent.studentName}</h2>
                <p>
                  {selectedStudent.rollNo} • {selectedStudent.course}
                </p>
              </div>
              <button
                type="button"
                className="payment-modal-close"
                onClick={closeStudentDetails}
                aria-label="Close details"
              >
                <FiX />
              </button>
            </div>

            <div className="payment-details-body">
              <div className="payment-detail-item">
                <span>Student Name</span>
                <strong>{selectedStudent.studentName}</strong>
              </div>
              <div className="payment-detail-item">
                <span>Roll No</span>
                <strong>{selectedStudent.rollNo}</strong>
              </div>
              <div className="payment-detail-item">
                <span>Course</span>
                <strong>{selectedStudent.course}</strong>
              </div>
              <div className="payment-detail-item">
                <span>Batch</span>
                <strong>{selectedStudent.batch || "-"}</strong>
              </div>
              <div className="payment-detail-item">
                <span>Total Fees</span>
                <strong>
                  {selectedStudent.feeSetupCompleted
                    ? `₹${formatMoney(selectedStudent.totalFee)}`
                    : "-"}
                </strong>
              </div>
              <div className="payment-detail-item">
                <span>Fee Type</span>
                <strong>{formatFeeType(selectedStudent.feeType)}</strong>
              </div>

              {selectedStudent.feeType === "monthly" && (
                <>
                  <div className="payment-detail-item">
                    <span>Monthly Amount</span>
                    <strong>
                      ₹{formatMoney(selectedStudent.monthlyAmount)}
                    </strong>
                  </div>
                  <div className="payment-detail-item">
                    <span>Months Paid</span>
                    <strong>
                      {selectedStudent.paidMonths} /{" "}
                      {selectedStudent.selectedMonths}
                    </strong>
                  </div>
                </>
              )}

              <div className="payment-detail-item">
                <span>Paid Amount</span>
                <strong>₹{formatMoney(selectedStudent.paidAmount)}</strong>
              </div>
              <div className="payment-detail-item">
                <span>Pending Amount</span>
                <strong>₹{formatMoney(selectedStudent.pendingAmount)}</strong>
              </div>
              <div className="payment-detail-item">
                <span>Status</span>
                <strong
                  className={`detail-status ${selectedStudent.paymentStatus}`}
                >
                  {getStatusLabel(selectedStudent.paymentStatus)}
                </strong>
              </div>
              <div className="payment-detail-item">
                <span>Last Payment Method</span>
                <strong>
                  {formatPaymentMethod(selectedStudent.paymentMethod)}
                </strong>
              </div>
              <div className="payment-detail-item">
                <span>Last Payment Date</span>
                <strong>{formatDate(selectedStudent.paymentDate)}</strong>
              </div>
              <div className="payment-detail-item">
                <span>Fees Ending Date</span>
                <strong>{formatDate(selectedStudent.feeEndingDate)}</strong>
              </div>
            </div>

            <div className="payment-history-list">
              <div className="payment-history-title">
                <strong>Payment History</strong>
                <span>
                  {selectedStudent.paymentRecords.length} transaction
                  {selectedStudent.paymentRecords.length === 1 ? "" : "s"}
                </span>
              </div>

              {selectedStudent.paymentRecords.length === 0 ? (
                <div className="payment-history-empty">
                  No payment recorded yet.
                </div>
              ) : (
                selectedStudent.paymentRecords.map((record) => (
                  <div key={record._id} className="payment-history-row">
                    <div>
                      <strong>₹{formatMoney(record.amount)}</strong>
                      <span>
                        {formatDate(record.paymentDate || record.createdAt)}
                      </span>
                    </div>
                    <span className="payment-history-method">
                      {formatPaymentMethod(record.paymentMethod)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
