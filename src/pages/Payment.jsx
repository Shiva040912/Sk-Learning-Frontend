import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiEdit2,
  FiFilter,
  FiImage,
  FiPlus,
  FiRotateCcw,
  FiSave,
  FiSearch,
  FiSettings,
  FiTrash2,
  FiTrendingUp,
  FiUpload,
  FiShield,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";

import api from "../services/axios";
import LoadingLogo from "../components/LoadingLogo";
import "../styles/payments.css";

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const initialFeeForm = {
  totalFee: "",
  feeType: "",
  feeStartingDate: "",
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
    commonFeeSetupEnabled: true,
    courseWiseFeeSetupEnabled: true,
    recurringFeeStartDay: 1,
    recurringFeeDueDay: 10,
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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);

  const [showUpiSettingsModal, setShowUpiSettingsModal] = useState(false);
  const [isUpiSettingsLoading, setIsUpiSettingsLoading] = useState(false);
  const [isUpiSettingsSaving, setIsUpiSettingsSaving] = useState(false);

  const [paymentSettings, setPaymentSettings] = useState({
    upiId: "",
    receiverName: "",
    paymentPhone: "",
    upiQrImage: "",
  });

  const [feeForm, setFeeForm] = useState(initialFeeForm);
  const [feeSetupMode, setFeeSetupMode] = useState("individual");
  const [bulkCourse, setBulkCourse] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [partialAmount, setPartialAmount] = useState("");

  const [detailsPaymentMethod, setDetailsPaymentMethod] = useState("");
  const [monthlyPaymentMethod, setMonthlyPaymentMethod] = useState("");
  const [detailsPartialAmount, setDetailsPartialAmount] = useState("");
  const [isDetailsPaymentSaving, setIsDetailsPaymentSaving] = useState(false);
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [isFeeEditSaving, setIsFeeEditSaving] = useState(false);
  const [editFeeForm, setEditFeeForm] = useState({
    totalFee: "",
    feeType: "partial",
    feeStartingDate: "",
    feeEndingDate: "",
  });
  const [isHistoryClearing, setIsHistoryClearing] = useState(false);

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
        feeStartingDate: student.feeStartingDate || null,
        feeEndingDate: student.feeEndingDate || null,
        feeSetupCompleted: Boolean(student.feeSetupCompleted),
        selectedMonths: Number(student.selectedMonths || 0),
        monthlyAmount: Number(student.monthlyAmount || 0),
        monthlyInstallments: Array.isArray(student.monthlyInstallments)
          ? student.monthlyInstallments
              .map((installment) => ({
                ...installment,
                installmentNumber: Number(installment.installmentNumber || 0),
                amount: Number(installment.amount || 0),
                status: installment.status === "paid" ? "paid" : "unpaid",
              }))
              .sort(
                (a, b) =>
                  Number(a.installmentNumber || 0) -
                  Number(b.installmentNumber || 0),
              )
          : [],
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

  const getEmptyFeeForm = () => ({
    ...initialFeeForm,
    feeStartingDate: getTodayDateString(),
    selectedMonths: String(feeSettings.defaultMonths || 12),
  });

  const getStudentFeeForm = (student) => ({
    totalFee:
      student?.feeSetupCompleted && student?.totalFee
        ? String(student.totalFee)
        : "",
    feeType: student?.feeType || "",
    feeStartingDate: student?.feeStartingDate
      ? new Date(student.feeStartingDate).toISOString().split("T")[0]
      : getTodayDateString(),
    feeEndingDate: student?.feeEndingDate
      ? new Date(student.feeEndingDate).toISOString().split("T")[0]
      : "",
    selectedMonths:
      student?.feeType === "monthly" && student?.selectedMonths
        ? String(student.selectedMonths)
        : String(feeSettings.defaultMonths || 12),
  });

  const openFeeSetupModal = (student) => {
    setFeeSetupMode("individual");
    setBulkCourse("");
    setSelectedStudent(student);
    setFeeForm(getStudentFeeForm(student));
    setShowFeeModal(true);
  };

  const openFeeSetupManager = () => {
    setFeeSetupMode("individual");
    setBulkCourse("");
    setSelectedStudent(null);
    setFeeForm(getEmptyFeeForm());
    setShowFeeModal(true);
  };

  const closeFeeSetupModal = () => {
    if (isFeeSaving) return;

    setShowFeeModal(false);
    setSelectedStudent(null);
    setFeeSetupMode("individual");
    setBulkCourse("");
    setFeeForm(initialFeeForm);
  };

  const handleFeeSetupModeChange = (mode) => {
    if (isFeeSaving) return;

    if (
      mode === "common" &&
      !feeSettings.commonFeeSetupEnabled
    ) {
      toast.error("Common fee setup is disabled in Settings");
      return;
    }

    if (
      mode === "course" &&
      !feeSettings.courseWiseFeeSetupEnabled
    ) {
      toast.error("Course Wise fee setup is disabled in Settings");
      return;
    }

    setFeeSetupMode(mode);
    setBulkCourse("");
    setSelectedStudent(null);

    const nextForm = getEmptyFeeForm();

    if (mode === "common" || mode === "course") {
      nextForm.feeType = "yearly";
      nextForm.selectedMonths = "";
    }

    setFeeForm(nextForm);
  };

  const handleIndividualStudentChange = (event) => {
    const studentId = event.target.value;

    const student =
      paymentRows.find((item) => item._id === studentId) || null;

    setSelectedStudent(student);

    setFeeForm(
      student ? getStudentFeeForm(student) : getEmptyFeeForm(),
    );
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

      if (
        name === "feeStartingDate" &&
        next.feeEndingDate &&
        value > next.feeEndingDate
      ) {
        next.feeEndingDate = "";
      }

      return next;
    });
  };

  const monthlyPreview = useMemo(() => {
    if (true) return 0;

    const totalFee = Number(feeForm.totalFee);
    const months = Number(feeForm.selectedMonths);

    if (!Number.isInteger(totalFee) || !Number.isInteger(months) || months < 1) {
      return 0;
    }

    return Math.floor(totalFee / months);
  }, [feeForm.totalFee, feeForm.feeType, feeForm.selectedMonths]);

  const monthlySetupPreview = useMemo(() => {
    if (true) return [];

    const totalFee = Number(feeForm.totalFee);
    const months = Number(feeForm.selectedMonths);

    if (
      !Number.isFinite(totalFee) ||
      totalFee <= 0 ||
      !Number.isInteger(totalFee) ||
      !Number.isInteger(months) ||
      months < 1 ||
      totalFee < months
    ) {
      return [];
    }

    const baseAmount = Math.floor(totalFee / months);
    const finalAmount = totalFee - baseAmount * (months - 1);

    return Array.from({ length: months }, (_, index) => ({
      installmentNumber: index + 1,
      amount: index === months - 1 ? finalAmount : baseAmount,
    }));
  }, [feeForm.totalFee, feeForm.feeType, feeForm.selectedMonths]);

  const getCurrentMonthlyInstallment = (student) => {
    if (student?.feeType !== "monthly") return null;

    return (
      (student.monthlyInstallments || []).find(
        (installment) => installment.status !== "paid",
      ) || null
    );
  };

  const syncPaymentPageFromResult = (result) => {
    const responseStudent = result?.student;
    const payment = result?.payment;

    if (responseStudent) {
      const responseStudentId = responseStudent.id || responseStudent._id;
      setStudents((current) =>
        current.map((student) =>
          String(student._id) === String(responseStudentId)
            ? { ...student, ...responseStudent, _id: student._id }
            : student,
        ),
      );
    }

    if (payment) {
      setPaymentRecords((current) => [
        payment,
        ...current.filter((record) => String(record._id) !== String(payment._id)),
      ]);
    }
  };
  const syncSelectedStudentFromPaymentResult = (result) => {
    syncPaymentPageFromResult(result);

    const responseStudent = result?.student;
    const payment = result?.payment;

    if (!responseStudent) return;

    setSelectedStudent((current) => {
      if (!current) return current;

      const nextRecords = payment
        ? [
            payment,
            ...(current.paymentRecords || []).filter(
              (record) => String(record._id) !== String(payment._id),
            ),
          ]
        : current.paymentRecords || [];

      return {
        ...current,
        ...responseStudent,
        monthlyInstallments: Array.isArray(responseStudent.monthlyInstallments)
          ? responseStudent.monthlyInstallments
          : current.monthlyInstallments || [],
        paymentRecords: nextRecords,
        paymentMethod:
          payment?.paymentMethod ||
          responseStudent.paymentMethod ||
          current.paymentMethod ||
          "",
        paymentDate:
          payment?.paymentDate ||
          responseStudent.paymentDate ||
          current.paymentDate ||
          null,
      };
    });
  };

  const handleMonthlyInstallmentPayment = async (installment) => {
    if (!selectedStudent || selectedStudent.feeType !== "monthly") return;

    if (installment.status === "paid") return;

    const currentInstallment = getCurrentMonthlyInstallment(selectedStudent);

    if (
      !currentInstallment ||
      Number(currentInstallment.installmentNumber) !==
        Number(installment.installmentNumber)
    ) {
      toast.error(
        currentInstallment
          ? `Month ${currentInstallment.installmentNumber} must be paid first`
          : "No unpaid installment available",
      );
      return;
    }

    if (!monthlyPaymentMethod) {
      toast.error("Select payment method");
      return;
    }

    try {
      setIsDetailsPaymentSaving(true);

      const response = await api.post(
        `/payments/student/${selectedStudent._id}/collect`,
        {
          paymentMethod: monthlyPaymentMethod,
          installmentNumber: Number(installment.installmentNumber),
        },
      );

      toast.success(
        response.data?.message ||
          `Month ${installment.installmentNumber} payment collected`,
      );

      syncSelectedStudentFromPaymentResult(response.data || {});
      setMonthlyPaymentMethod("");

    } catch (error) {
      console.error(
        "Monthly installment payment error:",
        error?.response?.data || error,
      );

      toast.error(
        getErrorMessage(error, "Failed to collect monthly installment"),
      );
    } finally {
      setIsDetailsPaymentSaving(false);
    }
  };

  const handlePartialPaymentFromDetails = async () => {
    if (!selectedStudent || selectedStudent.feeType !== "partial") return;

    const amount = Number(detailsPartialAmount);
    const pendingAmount = Number(selectedStudent.pendingAmount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid paid amount");
      return;
    }

    if (amount > pendingAmount) {
      toast.error(
        `Payment cannot be greater than balance ₹${formatMoney(pendingAmount)}`,
      );
      return;
    }

    if (!detailsPaymentMethod) {
      toast.error("Select payment method");
      return;
    }

    try {
      setIsDetailsPaymentSaving(true);

      const response = await api.post(
        `/payments/student/${selectedStudent._id}/collect`,
        {
          paymentMethod: detailsPaymentMethod,
          amount,
        },
      );

      toast.success(response.data?.message || "Payment added successfully");

      syncSelectedStudentFromPaymentResult(response.data || {});
      setDetailsPartialAmount("");
      setDetailsPaymentMethod("");
      setShowDetailsModal(false);
      setSelectedStudent(null);

    } catch (error) {
      console.error(
        "Partial payment error:",
        error?.response?.data || error,
      );

      toast.error(getErrorMessage(error, "Failed to add partial payment"));
    } finally {
      setIsDetailsPaymentSaving(false);
    }
  };

  const handleFeeSetup = async (event) => {
    event.preventDefault();

    if (feeSetupMode === "individual" && !selectedStudent) {
      toast.error("Select a student");
      return;
    }

    if (feeSetupMode === "course" && !bulkCourse) {
      toast.error("Select a course");
      return;
    }

    const totalFee = Number(feeForm.totalFee);

    if (!Number.isFinite(totalFee) || totalFee <= 0) {
      toast.error("Enter a valid total fee");
      return;
    }

    if (!feeForm.feeType) {
      toast.error("Select fee type");
      return;
    }

    if (feeSetupMode !== "individual" && feeForm.feeType !== "yearly") {
      toast.error("Common and Course Wise fee setup use Yearly payment only");
      return;
    }

    if (false && !Number.isInteger(totalFee)) {
      toast.error("Monthly total fee must be a whole rupee amount");
      return;
    }

    if (!getFeeTypeEnabled(feeForm.feeType)) {
      toast.error(
        `${formatFeeType(feeForm.feeType)} payment is disabled in Settings`,
      );
      return;
    }

    const payload = {
      totalFee,
      feeType: feeForm.feeType,
    };

    if (feeForm.feeType === "yearly") {
      if (!feeForm.feeStartingDate) {
        toast.error("Select fees starting date");
        return;
      }

      if (!feeForm.feeEndingDate) {
        toast.error("Select fees ending date");
        return;
      }

      const todayDate = getTodayDateString();

      if (feeForm.feeStartingDate < todayDate) {
        toast.error("Fees starting date cannot be in the past");
        return;
      }

      if (feeForm.feeEndingDate < todayDate) {
        toast.error("Fees ending date cannot be in the past");
        return;
      }

      if (feeForm.feeEndingDate < feeForm.feeStartingDate) {
        toast.error("Fees ending date cannot be before the starting date");
        return;
      }

      payload.feeStartingDate = feeForm.feeStartingDate;
      payload.feeEndingDate = feeForm.feeEndingDate;
    }

    if (false) {
      const months = Number(feeForm.selectedMonths);

      if (!Number.isInteger(months) || months < 1) {
        toast.error("Number of months must be a positive whole number");
        return;
      }

      if (Math.round(totalFee * 100) < months) {
        toast.error("Number of months is too high for the configured total fee");
        return;
      }

      payload.selectedMonths = months;
    }

    try {
      setIsFeeSaving(true);

      let response;

      if (feeSetupMode === "common") {
        response = await api.put(
          "/payments/fee-setup/common",
          payload,
        );
      } else if (feeSetupMode === "course") {
        response = await api.put(
          `/payments/fee-setup/course/${encodeURIComponent(bulkCourse)}`,
          payload,
        );
      } else {
        response = await api.put(
          `/payments/student/${selectedStudent._id}/fee-setup`,
          payload,
        );
      }

      const result = response.data || {};

      if (feeSetupMode === "individual") {
        toast.success(
          result.message ||
            `${selectedStudent.studentName} fee setup completed`,
        );
      } else {
        const successCount = Number(result.successCount || 0);
        const skippedCount = Number(result.skippedCount || 0);
        const failedCount = Number(result.failedCount || 0);

        toast.success(
          `${successCount} updated${
            skippedCount ? `, ${skippedCount} skipped` : ""
          }${failedCount ? `, ${failedCount} failed` : ""}`,
          {
            duration: 5000,
          },
        );
      }

      setShowFeeModal(false);
      setSelectedStudent(null);
      setFeeSetupMode("individual");
      setBulkCourse("");
      setFeeForm(initialFeeForm);

      await fetchPaymentPageData();
    } catch (error) {
      console.error("Fee setup error:", error?.response?.data || error);

      toast.error(
        getErrorMessage(
          error,
          feeSetupMode === "individual"
            ? "Failed to setup student fee"
            : "Failed to apply bulk fee setup",
        ),
      );
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
      setPartialAmount("");
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

    if (false) {
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


      payload.amount = amount;
    }

    try {
      setIsPaymentSaving(true);

      const response = await api.post(
        `/payments/student/${selectedStudent._id}/collect`,
        payload,
      );

      toast.success(response.data?.message || "Payment collected successfully");
      syncPaymentPageFromResult(response.data || {});

      setShowPaymentModal(false);
      setSelectedStudent(null);
      setSelectedPaymentMethod("");
      setPartialAmount("");

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
  const loadUpiSettings = async () => {
    try {
      setIsUpiSettingsLoading(true);

      const response = await api.get("/payments/settings");
      const saved = response.data?.paymentSettings || response.data?.settings || response.data || {};

      setPaymentSettings({
        upiId: saved.upiId || "",
        receiverName: saved.receiverName || "",
        paymentPhone: saved.paymentPhone || "",
        upiQrImage: saved.upiQrImage || "",
      });

      return true;
    } catch (error) {
      console.error(
        "UPI settings load error:",
        error?.response?.data || error,
      );

      toast.error(
        getErrorMessage(
          error,
          "Failed to load UPI payment settings",
        ),
      );

      return false;
    } finally {
      setIsUpiSettingsLoading(false);
    }
  };

  const openUpiSettings = async () => {
    setShowUpiSettingsModal(true);
    await loadUpiSettings();
  };

  const closeUpiSettings = () => {
    if (isUpiSettingsSaving) return;
    setShowUpiSettingsModal(false);
  };

  const handlePaymentSettingChange = (event) => {
    const { name, value } = event.target;

    setPaymentSettings((current) => ({
      ...current,
      [name]:
        name === "paymentPhone"
          ? value.replace(/\D/g, "").slice(0, 10)
          : value,
    }));
  };

  const handleQrUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid QR image");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxSize = 520;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = maxSize;
        canvas.height = maxSize;

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, maxSize, maxSize);

        const scale = Math.min(
          maxSize / image.width,
          maxSize / image.height,
        );

        const width = image.width * scale;
        const height = image.height * scale;
        const x = (maxSize - width) / 2;
        const y = (maxSize - height) / 2;

        context.drawImage(
          image,
          x,
          y,
          width,
          height,
        );

        const upiQrImage = canvas.toDataURL(
          "image/jpeg",
          0.9,
        );

        setPaymentSettings((current) => ({
          ...current,
          upiQrImage,
        }));

        toast.success("QR image selected");
      };

      image.onerror = () => {
        toast.error("Unable to read the QR image");
      };

      image.src = String(reader.result || "");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeQrImage = () => {
    setPaymentSettings((current) => ({
      ...current,
      upiQrImage: "",
    }));
  };

  const handleSavePaymentSettings = async (event) => {
    event.preventDefault();

    const upiId = paymentSettings.upiId.trim();
    const receiverName = paymentSettings.receiverName.trim();
    const paymentPhone = paymentSettings.paymentPhone.trim();

    if (!upiId || !upiId.includes("@")) {
      toast.error("Enter a valid UPI ID");
      return;
    }

    if (!receiverName) {
      toast.error("Receiver name is required");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(paymentPhone)) {
      toast.error(
        "Enter a valid 10 digit payment phone number",
      );
      return;
    }

    if (!paymentSettings.upiQrImage) {
      toast.error("Upload the payment QR image");
      return;
    }

    try {
      setIsUpiSettingsSaving(true);

      const response = await api.put(
        "/payments/settings",
        {
          upiId,
          receiverName,
          paymentPhone,
          upiQrImage:
            paymentSettings.upiQrImage,
        },
      );

      const saved =
        response.data?.paymentSettings ||
        response.data?.settings ||
        response.data ||
        {};

      setPaymentSettings({
        upiId: saved.upiId ?? upiId,
        receiverName:
          saved.receiverName ?? receiverName,
        paymentPhone:
          saved.paymentPhone ?? paymentPhone,
        upiQrImage:
          saved.upiQrImage ??
          paymentSettings.upiQrImage,
      });

      toast.success(
        response.data?.message ||
          "UPI payment settings updated successfully",
      );

      setShowUpiSettingsModal(false);
    } catch (error) {
      console.error(
        "UPI settings save error:",
        error?.response?.data || error,
      );

      toast.error(
        getErrorMessage(
          error,
          "Failed to update UPI payment settings",
        ),
      );
    } finally {
      setIsUpiSettingsSaving(false);
    }
  };

  const startFeeEdit = () => {
    if (!selectedStudent?.feeSetupCompleted) return;
    setEditFeeForm({
      totalFee: String(selectedStudent.totalFee || ""),
      feeType: selectedStudent.feeType === "yearly" ? "yearly" : "partial",
      feeStartingDate: selectedStudent.feeStartingDate
        ? String(selectedStudent.feeStartingDate).slice(0, 10)
        : getTodayDateString(),
      feeEndingDate: selectedStudent.feeEndingDate
        ? String(selectedStudent.feeEndingDate).slice(0, 10)
        : "",
    });
    setIsEditingFee(true);
  };

  const handleEditFeeSave = async () => {
    if (!selectedStudent) return;
    const totalFee = Number(editFeeForm.totalFee);
    if (!Number.isFinite(totalFee) || totalFee <= 0) {
      toast.error("Enter a valid total fee");
      return;
    }
    if (totalFee < Number(selectedStudent.paidAmount || 0)) {
      toast.error("Total fee cannot be less than the already paid amount");
      return;
    }
    if (
      editFeeForm.feeType === "yearly" &&
      (!editFeeForm.feeStartingDate || !editFeeForm.feeEndingDate)
    ) {
      toast.error("Select fee starting and ending dates");
      return;
    }

    try {
      setIsFeeEditSaving(true);
      const response = await api.put(
        `/payments/student/${selectedStudent._id}/fee-edit`,
        {
          totalFee,
          feeType: editFeeForm.feeType,
          feeStartingDate: editFeeForm.feeStartingDate || undefined,
          feeEndingDate: editFeeForm.feeEndingDate || undefined,
        },
      );
      const updated = response.data?.student;
      if (updated) {
        setStudents((current) =>
          current.map((student) =>
            String(student._id) === String(updated._id)
              ? { ...student, ...updated }
              : student,
          ),
        );
        setSelectedStudent((current) => current ? { ...current, ...updated } : current);
      }
      setIsEditingFee(false);
      toast.success(response.data?.message || "Fee details updated successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update fee details"));
    } finally {
      setIsFeeEditSaving(false);
    }
  };
  const openStudentDetails = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
    setShowHistoryModal(false);
    setDetailsPaymentMethod("");
    setDetailsPartialAmount("");
  };

  const closeStudentDetails = () => {
    if (isDetailsPaymentSaving || isHistoryClearing || isFeeEditSaving) return;

    setShowDetailsModal(false);
    setShowHistoryModal(false);
    setSelectedStudent(null);
    setDetailsPaymentMethod("");
    setMonthlyPaymentMethod("");
    setDetailsPartialAmount("");
  };

  const openPaymentHistory = () => {
    if (!selectedStudent?.feeSetupCompleted) {
      toast.error("Fee setup is not completed for this student");
      return;
    }

    setShowDetailsModal(false);
    setShowHistoryModal(true);
    setDetailsPaymentMethod("");
    setMonthlyPaymentMethod("");
    setDetailsPartialAmount("");
  };

  const closePaymentHistory = () => {
    if (isDetailsPaymentSaving || isHistoryClearing || isFeeEditSaving) return;

    setShowHistoryModal(false);
    setShowDetailsModal(true);
    setDetailsPaymentMethod("");
    setMonthlyPaymentMethod("");
    setDetailsPartialAmount("");
  };

  const handleClearPaymentHistory = async () => {
    if (!selectedStudent) return;

    if ((selectedStudent.paymentRecords || []).length === 0) {
      toast.success("Payment history is already empty");
      return;
    }

    try {
      setIsHistoryClearing(true);

      const response = await api.delete(
        `/payments/student/${selectedStudent._id}/history`,
      );

      toast.success(
        response.data?.message || "Payment history cleared successfully",
      );

      setSelectedStudent((current) =>
        current
          ? {
              ...current,
              paymentRecords: [],
              paymentMethod: "",
              paymentDate: null,
              monthlyInstallments: (current.monthlyInstallments || []).map(
                (installment) => ({
                  ...installment,
                  paymentId: null,
                  paidAt:
                    installment.status === "paid"
                      ? null
                      : installment.paidAt,
                }),
              ),
            }
          : current,
      );

      await fetchPaymentPageData();
    } catch (error) {
      console.error(
        "Clear payment history error:",
        error?.response?.data || error,
      );

      toast.error(
        getErrorMessage(error, "Failed to clear payment history"),
      );
    } finally {
      setIsHistoryClearing(false);
    }
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
                    <option value="partial">Partial</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="payment-upi-setup-btn"
            onClick={openUpiSettings}
            title="UPI payment setup"
          >
            <FiSettings />
            <span>UPI Settings</span>
          </button>

          <button
            type="button"
            className="payment-main-setup-btn"
            onClick={openFeeSetupManager}
            title="Fee setup"
          >
            <FiPlus />
            <span>Fee Setup</span>
          </button>
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
                        <div className="payment-status-cell">
                        {student.feeType === "yearly" ? (
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
                        ) : (
                          <div
                            className={`payment-status-display ${
                              student.paymentStatus === "paid"
                                ? "paid"
                                : student.feeSetupCompleted
                                  ? student.feeType || "unpaid"
                                  : "not-set"
                            }`}
                            title={
                              student.feeType === "monthly"
                                ? "Open student details to manage monthly installments"
                                : student.feeType === "partial"
                                  ? "Open student details to add partial payments"
                                  : ""
                            }
                          >
                            <span className="payment-status-dot" />
                            <span>
                              {student.paymentStatus === "paid"
                                ? "Paid"
                                : student.feeSetupCompleted
                                  ? formatFeeType(student.feeType)
                                  : "Not Set"}
                            </span>
                          </div>
                        )}
                        </div>
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

      {showFeeModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal fee-setup-modal fee-setup-manager-modal">
            <div className="payment-modal-header">
              <div>
                <span>FEE SETUP</span>
                <h2>Fee Configuration</h2>
                <p>
                  Choose how you want to set the student fees and ending date.
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
              <div className="fee-setup-mode-grid">
                <button
                  type="button"
                  className={`fee-setup-mode-card ${
                    feeSetupMode === "individual" ? "active" : ""
                  }`}
                  onClick={() => handleFeeSetupModeChange("individual")}
                  disabled={isFeeSaving}
                >
                  <span>01</span>
                  <div>
                    <strong>Individual</strong>
                    <small>One student</small>
                  </div>
                </button>

                <button
                  type="button"
                  className={`fee-setup-mode-card ${
                    feeSetupMode === "common" ? "active" : ""
                  }`}
                  onClick={() => handleFeeSetupModeChange("common")}
                  disabled={
                    isFeeSaving ||
                    !feeSettings.commonFeeSetupEnabled
                  }
                >
                  <span>02</span>
                  <div>
                    <strong>Common</strong>
                    <small>
                      {feeSettings.commonFeeSetupEnabled
                        ? "All eligible students"
                        : "Disabled in Settings"}
                    </small>
                  </div>
                </button>

                <button
                  type="button"
                  className={`fee-setup-mode-card ${
                    feeSetupMode === "course" ? "active" : ""
                  }`}
                  onClick={() => handleFeeSetupModeChange("course")}
                  disabled={
                    isFeeSaving ||
                    !feeSettings.courseWiseFeeSetupEnabled
                  }
                >
                  <span>03</span>
                  <div>
                    <strong>Course Wise</strong>
                    <small>
                      {feeSettings.courseWiseFeeSetupEnabled
                        ? "Eligible students in course"
                        : "Disabled in Settings"}
                    </small>
                  </div>
                </button>
              </div>

              {feeSetupMode === "individual" && (
                <div className="fee-setup-target-card">
                  <div className="payment-form-group fee-target-select">
                    <label>Select Student *</label>

                    <select
                      value={selectedStudent?._id || ""}
                      onChange={handleIndividualStudentChange}
                      disabled={isFeeSaving}
                    >
                      <option value="">Select student</option>

                      {paymentRows.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.rollNo} - {student.studentName} - {student.course}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedStudent && (
                    <div className="fee-target-preview">
                      <div>
                        <span>Student</span>
                        <strong>{selectedStudent.studentName}</strong>
                      </div>

                      <div>
                        <span>Roll No</span>
                        <strong>{selectedStudent.rollNo}</strong>
                      </div>

                      <div>
                        <span>Course</span>
                        <strong>{selectedStudent.course}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {feeSetupMode === "common" && (
                <div className="fee-setup-target-card common-target-card">
                  <div>
                    <span>COMMON FEE</span>
                    <strong>Apply the same fee and ending date to all students</strong>
                    <p>
                      Students who already started payment will be skipped.
                    </p>
                  </div>

                  <div className="bulk-student-count">
                    <strong>{paymentRows.length}</strong>
                    <span>Students</span>
                  </div>
                </div>
              )}

              {feeSetupMode === "course" && (
                <div className="fee-setup-target-card course-target-card">
                  <div className="payment-form-group fee-target-select">
                    <label>Select Course *</label>

                    <select
                      value={bulkCourse}
                      onChange={(event) => setBulkCourse(event.target.value)}
                      disabled={isFeeSaving}
                    >
                      <option value="">Select course</option>

                      {courseOptions.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                  </div>

                  {bulkCourse && (
                    <div className="course-target-summary">
                      <span>{bulkCourse} Students</span>
                      <strong>
                        {
                          paymentRows.filter(
                            (student) => student.course === bulkCourse,
                          ).length
                        }
                      </strong>
                    </div>
                  )}
                </div>
              )}

              <div className="payment-form-grid bulk-fee-form-grid">
                <div className="payment-form-group">
                  <label>Total Fees *</label>
                  <input
                    type="number"
                    min="1"
                    step={false ? "1" : "0.01"}
                    name="totalFee"
                    value={feeForm.totalFee}
                    onChange={handleFeeFormChange}
                    placeholder="Enter total fees"
                  />
                </div>

                <div className="payment-form-group">
                  <label>Fee Type *</label>

                  {feeSetupMode === "individual" ? (
                    <select
                      name="feeType"
                      value={feeForm.feeType}
                      onChange={handleFeeFormChange}
                    >
                      <option value="">Select fee type</option>
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
                  ) : (
                    <div className="bulk-yearly-fixed-field">
                      <strong>Yearly / Full Payment</strong>
                      <span>
                        Common and Course Wise setup always use Yearly payment.
                      </span>
                    </div>
                  )}
                </div>

                {false && (
                  <div className="payment-form-group">
                    <label>Number of Months *</label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      name="selectedMonths"
                      value={feeForm.selectedMonths}
                      onChange={handleFeeFormChange}
                      placeholder="Example: 14"
                      inputMode="numeric"
                    />

                    <small className="payment-field-hint">
                      No fixed maximum. Enter the number of monthly installments
                      required for this student.
                    </small>
                  </div>
                )}

                {feeForm.feeType === "yearly" && (
                  <>
                    <div className="payment-form-group">
                      <label>Fees Starting Date *</label>

                      <input
                        type="date"
                        name="feeStartingDate"
                        value={feeForm.feeStartingDate}
                        min={getTodayDateString()}
                        onChange={handleFeeFormChange}
                      />
                    </div>

                    <div className="payment-form-group">
                      <label>Fees Ending Date *</label>

                      <input
                        type="date"
                        name="feeEndingDate"
                        value={feeForm.feeEndingDate}
                        min={feeForm.feeStartingDate || getTodayDateString()}
                        onChange={handleFeeFormChange}
                      />
                    </div>
                  </>
                )}

                {(false ||
                  feeForm.feeType === "partial") && (
                  <div className="payment-form-group settings-cycle-info-field">
                    <label>Partial Fee Cycle</label>

                    <div className="payment-common-cycle-box">
                      <div>
                        <span>Start Day</span>
                        <strong>{feeSettings.recurringFeeStartDay}</strong>
                      </div>

                      <div>
                        <span>Due / End Day</span>
                        <strong>{feeSettings.recurringFeeDueDay}</strong>
                      </div>
                    </div>

                    <small className="payment-field-hint">
                      This recurring cycle comes from Settings and repeats every
                      month for Partial-payment students.
                    </small>
                  </div>
                )}
              </div>

              {false && (
                <>
                  <div className="fee-rule-preview">
                    <div>
                      <span>Selected Duration</span>
                      <strong>{feeForm.selectedMonths || "-"} Months</strong>
                    </div>

                    <div>
                      <span>First Installment</span>
                      <strong>
                        ₹
                        {formatMoney(
                          monthlySetupPreview[0]?.amount || monthlyPreview,
                        )}
                      </strong>
                    </div>
                  </div>

                  {monthlySetupPreview.length > 0 && (
                    <div className="monthly-setup-preview">
                      <div className="monthly-setup-preview-title">
                        <strong>Installment Preview</strong>
                        <span>{monthlySetupPreview.length} months</span>
                      </div>

                      <div className="monthly-setup-preview-list">
                        {monthlySetupPreview.map((installment) => (
                          <div
                            key={installment.installmentNumber}
                            className="monthly-setup-preview-row"
                          >
                            <span>Month {installment.installmentNumber}</span>
                            <strong>₹{formatMoney(installment.amount)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {feeForm.feeType === "partial" && (
                <div className="fee-rule-note">
                  Partial mode has no fixed installment count. The admin can add
                  any received amount until the student's balance becomes ₹0.
                </div>
              )}

              {feeForm.feeType === "yearly" && (
                <div className="fee-rule-note">
                  Yearly mode collects the complete configured fee in one payment.
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
                  disabled={
                    isFeeSaving ||
                    (feeSetupMode === "individual" && !selectedStudent) ||
                    (feeSetupMode === "course" && !bulkCourse)
                  }
                >
                  {isFeeSaving
                    ? "Applying..."
                    : feeSetupMode === "individual"
                      ? "Set Individual Fee"
                      : feeSetupMode === "common"
                        ? "Apply Common Fee"
                        : "Apply Course Fee"}
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

              {false && (
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
                    placeholder="Enter received amount"
                  />
                  <small className="payment-field-hint">
                    Enter any received amount up to the current remaining balance.
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

      {showUpiSettingsModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal upi-settings-modal">
            <div className="payment-modal-header">
              <div>
                <span>ONLINE PAYMENT</span>
                <h2>UPI Payment Setup</h2>
                <p>
                  Configure the receiver details used on the public student Pay Now page.
                </p>
              </div>

              <button
                type="button"
                className="payment-modal-close"
                onClick={closeUpiSettings}
                disabled={isUpiSettingsSaving}
                aria-label="Close UPI settings"
              >
                <FiX />
              </button>
            </div>

            {isUpiSettingsLoading ? (
              <div className="upi-settings-loading">
                <LoadingLogo />
                <span>Loading UPI settings...</span>
              </div>
            ) : (
              <form
                className="upi-settings-form"
                onSubmit={handleSavePaymentSettings}
              >
                <div className="upi-settings-grid">
                  <div className="payment-form-group">
                    <label>UPI ID *</label>

                    <input
                      type="text"
                      name="upiId"
                      value={paymentSettings.upiId}
                      onChange={handlePaymentSettingChange}
                      placeholder="example@upi"
                      autoComplete="off"
                    />

                    <small className="payment-field-hint">
                      This UPI ID is used for GPay, PhonePe and Paytm.
                    </small>
                  </div>

                  <div className="payment-form-group">
                    <label>Receiver Name *</label>

                    <input
                      type="text"
                      name="receiverName"
                      value={paymentSettings.receiverName}
                      onChange={handlePaymentSettingChange}
                      placeholder="The SK Learnings"
                      autoComplete="off"
                    />

                    <small className="payment-field-hint">
                      Students will see this receiver name before payment.
                    </small>
                  </div>

                  <div className="payment-form-group">
                    <label>Payment Phone Number *</label>

                    <input
                      type="tel"
                      name="paymentPhone"
                      inputMode="numeric"
                      maxLength="10"
                      value={paymentSettings.paymentPhone}
                      onChange={handlePaymentSettingChange}
                      placeholder="9876543210"
                      autoComplete="off"
                    />

                    <small className="payment-field-hint">
                      Enter the mobile number connected with the payment account.
                    </small>
                  </div>
                </div>

                <div className="upi-qr-settings">
                  <div className="upi-qr-settings-heading">
                    <div>
                      <span>PAYMENT QR</span>
                      <strong>Upload Payment QR</strong>
                      <small>
                        The latest saved QR will automatically appear on every student's public payment page.
                      </small>
                    </div>

                    <FiImage />
                  </div>

                  <div className="upi-qr-settings-content">
                    <div className="upi-qr-preview">
                      {paymentSettings.upiQrImage ? (
                        <img
                          src={paymentSettings.upiQrImage}
                          alt="Payment QR preview"
                        />
                      ) : (
                        <div className="upi-qr-empty">
                          <FiImage />
                          <span>No QR uploaded</span>
                        </div>
                      )}
                    </div>

                    <div className="upi-qr-actions">
                      <label
                        className="upi-upload-button"
                        htmlFor="upi-qr-file"
                      >
                        <FiUpload />
                        <span>
                          {paymentSettings.upiQrImage
                            ? "Change QR"
                            : "Upload QR"}
                        </span>
                      </label>

                      <input
                        id="upi-qr-file"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleQrUpload}
                      />

                      {paymentSettings.upiQrImage && (
                        <button
                          type="button"
                          className="upi-remove-button"
                          onClick={removeQrImage}
                        >
                          <FiTrash2 />
                          <span>Remove QR</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="upi-settings-note">
                  <FiShield />
                  <span>
                    These values are stored in Payment Settings. If you change them later,
                    the student Pay Now page will automatically load the latest saved UPI details and QR.
                  </span>
                </div>

                <div className="payment-modal-actions">
                  <button
                    type="button"
                    className="payment-secondary-btn"
                    onClick={closeUpiSettings}
                    disabled={isUpiSettingsSaving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="payment-primary-btn"
                    disabled={isUpiSettingsSaving}
                  >
                    <FiSave />
                    {isUpiSettingsSaving
                      ? "Saving..."
                      : "Save UPI Settings"}
                  </button>
                </div>
              </form>
            )}
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
              <div className="payment-details-header-actions">

                {selectedStudent.feeSetupCompleted && (
                  <button
                    type="button"
                    className="payment-view-history-btn"
                    onClick={openPaymentHistory}
                  >
                    <FiClock />
                    <span>View History</span>
                  </button>
                )}

                <button
                  type="button"
                  className="payment-modal-close"
                  onClick={closeStudentDetails}
                  aria-label="Close details"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="management-details-overview">
              <section className="management-student-panel">
                <div className="management-section-label">STUDENT INFORMATION</div>
                <dl className="management-info-list">
                  <div><dt>Student</dt><dd>{selectedStudent.studentName}</dd></div>
                  <div><dt>Roll Number</dt><dd>{selectedStudent.rollNo}</dd></div>
                  <div><dt>Course</dt><dd>{selectedStudent.course}</dd></div>
                  <div><dt>Batch</dt><dd>{selectedStudent.batch || "-"}</dd></div>
                  <div><dt>Fee Method</dt><dd>{formatFeeType(selectedStudent.feeType)}</dd></div>
                </dl>
              </section>

              <section className="management-fee-panel">
                <div className="management-section-label">FEE ACCOUNT</div>
                <div className="management-amount-summary">
                  <div><span>Total Fee</span><strong>{selectedStudent.feeSetupCompleted ? `₹${formatMoney(selectedStudent.totalFee)}` : "-"}</strong></div>
                  <div><span>Paid</span><strong>₹{formatMoney(selectedStudent.paidAmount)}</strong></div>
                  <div><span>Balance</span><strong>₹{formatMoney(selectedStudent.pendingAmount)}</strong></div>
                  <div className="management-status-cell"><span>Status</span><strong className={`detail-status ${selectedStudent.paymentStatus}`}>{getStatusLabel(selectedStudent.paymentStatus)}</strong></div>
                </div>
                <dl className="management-meta-list">
                  <div><dt>Last Payment Method</dt><dd>{formatPaymentMethod(selectedStudent.paymentMethod)}</dd></div>
                  <div><dt>Last Payment Date</dt><dd>{formatDate(selectedStudent.paymentDate)}</dd></div>
                  <div><dt>Fee Start</dt><dd>{formatDate(selectedStudent.feeStartingDate)}</dd></div>
                  <div><dt>Fee End</dt><dd>{formatDate(selectedStudent.feeEndingDate)}</dd></div>
                </dl>
              </section>
            </div>

            {isEditingFee && (
              <section className="details-fee-edit-section">
                <div className="details-section-heading">
                  <div><span>CORRECT FEE ENTRY</span><strong>Edit amount and fee method</strong></div>
                  <small>A corrected fee-generated message will be sent.</small>
                </div>
                <div className="details-fee-edit-form">
                  <div className="payment-form-group"><label>Total Fee *</label><input type="number" min={Math.max(1, Number(selectedStudent.paidAmount || 0))} step="0.01" value={editFeeForm.totalFee} onChange={(event) => setEditFeeForm((current) => ({ ...current, totalFee: event.target.value }))} disabled={isFeeEditSaving} /></div>
                  <div className="payment-form-group"><label>Fee Method *</label><select value={editFeeForm.feeType} onChange={(event) => setEditFeeForm((current) => ({ ...current, feeType: event.target.value }))} disabled={isFeeEditSaving}><option value="partial">Partial Payment</option><option value="yearly">Full Payment (Yearly)</option></select></div>
                  {editFeeForm.feeType === "yearly" && <><div className="payment-form-group"><label>Starting Date *</label><input type="date" value={editFeeForm.feeStartingDate} onChange={(event) => setEditFeeForm((current) => ({ ...current, feeStartingDate: event.target.value }))} disabled={isFeeEditSaving} /></div><div className="payment-form-group"><label>Ending Date *</label><input type="date" min={editFeeForm.feeStartingDate} value={editFeeForm.feeEndingDate} onChange={(event) => setEditFeeForm((current) => ({ ...current, feeEndingDate: event.target.value }))} disabled={isFeeEditSaving} /></div></>}
                </div>
                <div className="details-fee-edit-actions"><button type="button" className="payment-secondary-btn" onClick={() => setIsEditingFee(false)} disabled={isFeeEditSaving}>Cancel</button><button type="button" className="payment-primary-btn" onClick={handleEditFeeSave} disabled={isFeeEditSaving}><FiSave />{isFeeEditSaving ? "Updating..." : "Update & Send"}</button></div>
              </section>
            )}
            {false &&
              selectedStudent.paymentStatus !== "paid" && (
                <div className="details-payment-actions-section">
                  <div className="details-payment-actions-title">
                    <div>
                      <span>MONTHLY PAYMENT</span>
                      <strong>Mark Installment as Paid</strong>
                    </div>
                    <small>
                      Complete the current month before moving to the next month.
                    </small>
                  </div>

                  <div className="details-monthly-installment-list">
                    {(selectedStudent.monthlyInstallments || []).map(
                      (installment) => {
                        const currentInstallment =
                          getCurrentMonthlyInstallment(selectedStudent);
                        const isPaid = installment.status === "paid";
                        const isCurrent =
                          !isPaid &&
                          Number(currentInstallment?.installmentNumber) ===
                            Number(installment.installmentNumber);

                        return (
                          <div
                            key={installment.installmentNumber}
                            className={`details-monthly-installment-row ${
                              isPaid ? "paid" : isCurrent ? "current" : "future"
                            }`}
                          >
                            <div className="details-monthly-installment-info">
                              <span>Month {installment.installmentNumber}</span>
                              <strong>₹{formatMoney(installment.amount)}</strong>
                            </div>

                            {isPaid ? (
                              <span className="installment-paid-badge">
                                <FiCheckCircle /> Paid
                              </span>
                            ) : isCurrent ? (
                              <div className="details-monthly-current-action">
                                <select
                                  value={monthlyPaymentMethod}
                                  onChange={(event) =>
                                    setMonthlyPaymentMethod(event.target.value)
                                  }
                                  disabled={isDetailsPaymentSaving}
                                >
                                  <option value="">Payment method</option>
                                  <option value="cash">Cash</option>
                                  <option value="bank">Bank</option>
                                  <option value="upi">UPI</option>
                                  <option value="qr">QR</option>
                                </select>

                                <button
                                  type="button"
                                  className="installment-pay-btn"
                                  onClick={() =>
                                    handleMonthlyInstallmentPayment(installment)
                                  }
                                  disabled={isDetailsPaymentSaving}
                                >
                                  {isDetailsPaymentSaving
                                    ? "Saving..."
                                    : "Mark Paid"}
                                </button>
                              </div>
                            ) : (
                              <span className="future-installment-label">
                                Unpaid
                              </span>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

            {selectedStudent.feeType === "partial" &&
              selectedStudent.paymentStatus !== "paid" && (
                <div className="details-payment-actions-section">
                  <div className="details-payment-actions-title">
                    <div>
                      <span>PARTIAL PAYMENT</span>
                      <strong>Add Received Amount</strong>
                    </div>
                    <div className="details-entry-side-actions">
                      <small>Balance: ₹{formatMoney(selectedStudent.pendingAmount)}</small>
                      <button type="button" className="details-inline-edit-btn" onClick={startFeeEdit} aria-label="Edit fee amount and method" title="Edit fee">
                        <FiEdit2 /><span>Edit Fee</span>
                      </button>
                    </div>
                  </div>

                  <div className="details-partial-payment-form">
                    <div className="payment-form-group">
                      <label>Paid Amount *</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={selectedStudent.pendingAmount}
                        value={detailsPartialAmount}
                        onChange={(event) =>
                          setDetailsPartialAmount(event.target.value)
                        }
                        placeholder="Example: 5000"
                        disabled={isDetailsPaymentSaving}
                      />
                    </div>

                    <div className="payment-form-group">
                      <label>Payment Method *</label>
                      <select
                        value={detailsPaymentMethod}
                        onChange={(event) =>
                          setDetailsPaymentMethod(event.target.value)
                        }
                        disabled={isDetailsPaymentSaving}
                      >
                        <option value="">Select payment method</option>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank</option>
                        <option value="upi">UPI</option>
                        <option value="qr">QR</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="partial-add-payment-btn"
                      onClick={handlePartialPaymentFromDetails}
                      disabled={isDetailsPaymentSaving}
                    >
                      <FiPlus />
                      {isDetailsPaymentSaving ? "Adding..." : "Add Payment"}
                    </button>
                  </div>
                </div>
              )}

            {selectedStudent.paymentStatus === "paid" &&
              (false ||
                selectedStudent.feeType === "partial") && (
                <div className="details-fee-complete-banner">
                  <FiCheckCircle />
                  <div>
                    <strong>Fee Fully Paid</strong>
                    <span>Remaining balance is ₹0.</span>
                  </div>
                </div>
              )}

          </div>
        </div>
      )}

      {showHistoryModal && selectedStudent && (
        <div className="payment-modal-overlay">
          <div className="payment-modal payment-history-modal">
            <div className="payment-modal-header">
              <div>
                <span>PAYMENT HISTORY</span>
                <h2>{selectedStudent.studentName}</h2>
                <p>
                  {selectedStudent.rollNo} • {formatFeeType(selectedStudent.feeType)}
                </p>
              </div>

              <div className="payment-history-header-actions">
                {(selectedStudent.paymentRecords || []).length > 0 && (
                  <button
                    type="button"
                    className="payment-clear-history-btn"
                    onClick={handleClearPaymentHistory}
                    disabled={isHistoryClearing || isDetailsPaymentSaving}
                  >
                    <FiTrash2 />
                    <span>
                      {isHistoryClearing ? "Clearing..." : "Clear History"}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  className="payment-modal-close"
                  onClick={closePaymentHistory}
                  disabled={isHistoryClearing || isDetailsPaymentSaving}
                  aria-label="Close payment history"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="payment-history-modal-summary">
              <div>
                <span>Total Fee</span>
                <strong>₹{formatMoney(selectedStudent.totalFee)}</strong>
              </div>

              <div>
                <span>Total Paid</span>
                <strong>₹{formatMoney(selectedStudent.paidAmount)}</strong>
              </div>

              <div>
                <span>Balance</span>
                <strong>₹{formatMoney(selectedStudent.pendingAmount)}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong className={`detail-status ${selectedStudent.paymentStatus}`}>
                  {getStatusLabel(selectedStudent.paymentStatus)}
                </strong>
              </div>
            </div>

            <div className="payment-history-list payment-history-modal-list">
              {selectedStudent.paymentRecords.length === 0 ? (
                <div className="payment-history-empty">
                  No payment history available.
                </div>
              ) : (
                selectedStudent.paymentRecords.map((record) => (
                  <div key={record._id} className="history-only-row">
                    <div className="history-only-main">
                      <strong>
                        {record.installmentNumber
                          ? `Month ${record.installmentNumber}`
                          : `₹${formatMoney(record.amount)}`}
                      </strong>
                      {record.installmentNumber && (
                        <span>₹{formatMoney(record.amount)}</span>
                      )}
                    </div>

                    <div className="history-only-meta">
                      <div>
                        <span>Paid Date</span>
                        <strong>
                          {formatDate(record.paymentDate || record.createdAt)}
                        </strong>
                      </div>

                      <div>
                        <span>Method</span>
                        <strong>{formatPaymentMethod(record.paymentMethod)}</strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong className="history-paid-status">Paid</strong>
                      </div>
                    </div>
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