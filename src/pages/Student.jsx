import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiEdit2,
  FiEye,
  FiPlus,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiX,
  FiUsers,
  FiBookOpen,
  FiCalendar,
  FiPhone,
  FiMail,
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiSettings,
  FiSave,
  FiUpload,
  FiDownload,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiFileText,
  FiArrowLeft,
} from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";
import toast from "react-hot-toast";

import api from "../services/axios";
import LoadingLogo from "../components/LoadingLogo";
import { getCurrentUser } from "../utils/permissions";
import {
  hasStudentAction,
  getVisibleStudentFields,
  hasAnyRowAction,
} from "../utils/studentPermissions";
import "../styles/students.css";


const initialForm = {
  studentName: "",
  rollNo: "",
  parentName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  alternatePhone: "",
  email: "",
  course: "",
  idproof: "",
  batch: "",
  schoolName: "",
  address: "",
};

const MAX_BULK_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;

const BULK_UPLOAD_TEMPLATE_HEADERS = [
  "Student Name",
  "Roll No",
  "Parent Name",
  "Date of Birth",
  "Gender",
  "Phone",
  "Alternate Phone",
  "Email",
  "Course",
  "Batch",
  "Aadhaar Number",
  "School Name",
  "Address",
];

const BULK_UPLOAD_TEMPLATE_EXAMPLE = [
  "Aarav Kumar",
  "SK-LN-101",
  "Suresh Kumar",
  "2007-05-14",
  "Male",
  "98789 89789",
  "",
  "aarav@example.com",
  "NEET",
  "Morning",
  "1234 5678 9878",
  "XYZ Public School",
  "12, Main Street",
];

const escapeCsvValue = (value) => {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

const downloadCsv = (filename, rows) => {
  const csvContent = rows
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const Students = () => {
  const currentUser = getCurrentUser();

  const canView = hasStudentAction(currentUser, "view");
  const canAdd = hasStudentAction(currentUser, "add");
  const canEdit = hasStudentAction(currentUser, "edit");
  const canDelete = hasStudentAction(currentUser, "delete");
  const canBulkUpload = hasStudentAction(currentUser, "bulkUpload");
  const canAddCourse = hasStudentAction(currentUser, "addCourse");
  const canDeleteCourse = hasStudentAction(currentUser, "deleteCourse");
  const canAddBatch = hasStudentAction(currentUser, "addBatch");
  const canDeleteBatch = hasStudentAction(currentUser, "deleteBatch");

  const visibleFields = getVisibleStudentFields(currentUser);
  const showStudentColumn =
    visibleFields.has("studentName") || visibleFields.has("parentName");
  const showActionsColumn = hasAnyRowAction(currentUser);

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] =
    useState("all");
  const [batchFilter, setBatchFilter] =
    useState("all");
  const [showFilters, setShowFilters] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);

  const [showFormModal, setShowFormModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);

  const [editingStudent, setEditingStudent] =
    useState(null);

  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState(null);

  const [formData, setFormData] =
    useState(initialForm);

  const [formErrors, setFormErrors] =
    useState({});

  const [submitError, setSubmitError] =
    useState("");

  const [academicCourses, setAcademicCourses] = useState([]);
  const [academicBatches, setAcademicBatches] = useState([]);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newBatch, setNewBatch] = useState({
    batchName: "",
    startTime: "",
    endTime: "",
  });
  const [isSetupSaving, setIsSetupSaving] = useState(false);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState("select");
  const [bulkFile, setBulkFile] = useState(null);
  const [isBulkPreviewing, setIsBulkPreviewing] = useState(false);
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkPreviewTab, setBulkPreviewTab] = useState("valid");
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState(null);
  const bulkFileInputRef = useRef(null);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);

      const response =
        await api.get("/students");

      setStudents(response.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load students"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAcademicSetup = async () => {
    try {
      const [courseResponse, batchResponse] = await Promise.all([
        api.get("/academic/courses"),
        api.get("/academic/batches"),
      ]);

      setAcademicCourses(courseResponse.data || []);
      setAcademicBatches(batchResponse.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load courses and batches"
      );
    }
  };

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }

    fetchStudents();
    fetchAcademicSetup();
  }, [canView]);

  const studentCourses = useMemo(() => {
    const courseList = students
      .map((student) => student.course)
      .filter(Boolean);

    return [...new Set(courseList)];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return students
      .filter((student) => {
        const matchesSearch =
          !keyword ||
          student.studentName
            ?.toLowerCase()
            .includes(keyword) ||
          student.phone?.replace(/\s/g, "").includes(
            search.replace(/\s/g, "")
          );

        const matchesCourse =
          courseFilter === "all" ||
          student.course === courseFilter;

        const matchesBatch =
          batchFilter === "all" ||
          student.batch === batchFilter;

        return (
          matchesSearch &&
          matchesCourse &&
          matchesBatch
        );
      })
      .sort((firstStudent, secondStudent) =>
        String(firstStudent.rollNo || "").localeCompare(
          String(secondStudent.rollNo || ""),
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        )
      );
  }, [
    students,
    search,
    courseFilter,
    batchFilter,
  ]);

  const activeFilterCount =
    Number(courseFilter !== "all") + Number(batchFilter !== "all");

  const summary = useMemo(() => {
    return students.reduce(
      (result, student) => {
        result.totalStudents += 1;

        if (student.isActive !== false) {
          result.activeStudents += 1;
        }

        result.totalFees += Number(
          student.totalFee || 0
        );

        result.totalPaid += Number(
          student.paidAmount || 0
        );

        result.totalPending += Number(
          student.pendingAmount || 0
        );

        return result;
      },
      {
        totalStudents: 0,
        activeStudents: 0,
        totalFees: 0,
        totalPaid: 0,
        totalPending: 0,
      }
    );
  }, [students]);

  const openAddModal = () => {
    if (!canAdd) return;

    setEditingStudent(null);
    setFormData(initialForm);
    setFormErrors({});
    setSubmitError("");
    setShowFormModal(true);
  };

  const openEditModal = (student) => {
    if (!canEdit) return;

    setEditingStudent(student);

    setFormData({
      studentName:
        student.studentName || "",
      rollNo:
        student.rollNo || "",
      parentName:
        student.parentName || "",
      dateOfBirth: student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split("T")[0]
        : "",
      gender: student.gender || "",
      phone: student.phone || "",
      alternatePhone:
        student.alternatePhone || "",
      email: student.email || "",
      course: student.course || "",
      idproof: student.idproof || "",
      batch: student.batch || "",
      schoolName:
        student.schoolName || "",
      address: student.address || "",
    });

    setFormErrors({});
    setSubmitError("");
    setShowFormModal(true);
  };

  const openViewModal = (student) => {
    if (!canView) return;

    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const openDeleteModal = (student) => {
    if (!canDelete) return;

    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingStudent(null);
    setFormData(initialForm);
    setFormErrors({});
    setSubmitError("");
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedStudent(null);
  };

  const formatPhoneInput = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);

    if (digits.length <= 5) {
      return digits;
    }

    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const formatAadhaarInput = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);

    return digits
      .replace(/(\d{4})(?=\d)/g, "$1 ")
      .trim();
  };

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    let nextValue = value;

    if (
      name === "phone" ||
      name === "alternatePhone"
    ) {
      nextValue = formatPhoneInput(value);
    }

    if (name === "idproof") {
      nextValue = formatAadhaarInput(value);
    }

    setFormData((current) => ({
      ...current,
      [name]: nextValue,
    }));

    setFormErrors((current) => ({
      ...current,
      [name]: "",
    }));

    setSubmitError("");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.studentName.trim()) {
      errors.studentName =
        "Student name is required";
    }

    if (!formData.rollNo.trim()) {
      errors.rollNo =
        "Roll number is required";
    }

    if (!formData.parentName.trim()) {
      errors.parentName =
        "Parent name is required";
    }

    if (!formData.dateOfBirth) {
      errors.dateOfBirth =
        "Date of birth is required";
    } else {
      const selectedDob = new Date(
        `${formData.dateOfBirth}T00:00:00`
      );
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (
        Number.isNaN(selectedDob.getTime()) ||
        selectedDob > today
      ) {
        errors.dateOfBirth =
          "Enter a valid date of birth";
      }
    }

    if (!formData.gender) {
      errors.gender = "Please select the student's gender";
    }

    if (!formData.phone.trim()) {
      errors.phone =
        "Phone number is required";
    } else if (
      !/^[6-9]\d{4} \d{5}$/.test(
        formData.phone.trim()
      )
    ) {
      errors.phone =
        "Enter phone as 98789 89789 and start with 6, 7, 8 or 9";
    }

    if (
      formData.alternatePhone &&
      !/^[6-9]\d{4} \d{5}$/.test(
        formData.alternatePhone.trim()
      )
    ) {
      errors.alternatePhone =
        "Enter alternate phone as 98789 89789 and start with 6, 7, 8 or 9";
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      errors.email =
        "Enter a valid email address";
    }

    if (
      formData.phone.trim() &&
      formData.alternatePhone.trim() &&
      formData.phone.trim() ===
        formData.alternatePhone.trim()
    ) {
      errors.alternatePhone =
        "Phone and alternate phone cannot be the same";
    }

    if (!formData.course.trim()) {
      errors.course =
        "Course is required";
    }

    if (!formData.idproof.trim()) {
      errors.idproof =
        "Aadhaar number is required";
    } else if (
      !/^\d{4} \d{4} \d{4}$/.test(
        formData.idproof.trim()
      )
    ) {
      errors.idproof =
        "Enter Aadhaar as 1234 5678 9878";
    }

    setFormErrors(errors);

    const firstError =
      Object.values(errors)[0];

    if (firstError) {
      toast.error(firstError);
      return false;
    }

    return true;
  };

  const getBackendErrorMessage = (error) => {
    const responseData = error?.response?.data;

    if (!error?.response) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    const message = responseData?.message;

    if (Array.isArray(message)) {
      return message.filter(Boolean).join(", ");
    }

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }

    if (
      typeof responseData?.error === "string" &&
      responseData.error.trim()
    ) {
      return responseData.error.trim();
    }

    if (error.response.status === 409) {
      return "This student information already exists.";
    }

    if (error.response.status === 400) {
      return "Please check the entered student details.";
    }

    return "Failed to save student. Please try again.";
  };

  const getBackendField = (message) => {
    const text = String(message || "").toLowerCase();

    if (text.includes("roll")) return "rollNo";

    if (
      text.includes("aadhaar") ||
      text.includes("aadhar") ||
      text.includes("id proof") ||
      text.includes("idproof")
    ) {
      return "idproof";
    }

    if (
      text.includes("alternative phone") ||
      text.includes("alternate phone")
    ) {
      return "alternatePhone";
    }

    if (text.includes("phone")) return "phone";
    if (text.includes("email")) return "email";
    if (text.includes("parent")) return "parentName";
    if (
      text.includes("date of birth") ||
      text.includes("dateofbirth") ||
      text.includes("dob")
    ) {
      return "dateOfBirth";
    }
    if (text.includes("student name")) return "studentName";
    if (text.includes("gender")) return "gender";
    if (text.includes("course")) return "course";

    if (text.includes("payment method")) {
      return "paymentMethod";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    const payload = {
      studentName: formData.studentName.trim(),
      rollNo: formData.rollNo.trim(),
      parentName: formData.parentName.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      phone: formData.phone.trim(),
      alternatePhone:
        formData.alternatePhone.trim() || undefined,
      email:
        formData.email.trim().toLowerCase() || undefined,
      course: formData.course.trim(),
      idproof: formData.idproof.trim(),
      batch: formData.batch.trim() || undefined,
      schoolName:
        formData.schoolName.trim() || undefined,
      address: formData.address.trim() || undefined,
    };

    try {
      setIsSaving(true);

      if (editingStudent) {
        await api.patch(
          `/students/${editingStudent._id}`,
          payload
        );

        toast.success(
          "Student updated successfully"
        );
      } else {
        await api.post("/students", payload);

        toast.success(
          "Student added successfully"
        );
      }

      closeFormModal();
      await fetchStudents();
    } catch (error) {
      console.error(
        "Student save failed:",
        error?.response?.data || error
      );

      const backendMessage =
        getBackendErrorMessage(error);

      const backendField =
        getBackendField(backendMessage);

      setSubmitError(backendMessage);

      if (backendField) {
        setFormErrors((current) => ({
          ...current,
          [backendField]: backendMessage,
        }));

        requestAnimationFrame(() => {
          const fieldElement =
            document.querySelector(
              `[name="${backendField}"]`
            );

          fieldElement?.focus();
          fieldElement?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
      }

      toast.error(backendMessage, {
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;

    try {
      await api.delete(
        `/students/${selectedStudent._id}`
      );

      toast.success(
        "Student deleted successfully"
      );

      setShowDeleteModal(false);
      setSelectedStudent(null);

      await fetchStudents();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete student"
      );
    }
  };

  const handleAddCourse = async () => {
    if (!canAddCourse) return;

    const courseName = newCourseName.trim();

    if (!courseName) {
      toast.error("Course name is required");
      return;
    }

    try {
      setIsSetupSaving(true);
      await api.post("/academic/courses", { courseName });
      setNewCourseName("");
      await fetchAcademicSetup();
      toast.success("Course added successfully");
    } catch (error) {
      toast.error(
        getBackendErrorMessage(error) ||
          "Failed to add course"
      );
    } finally {
      setIsSetupSaving(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!canDeleteCourse) return;

    try {
      await api.delete(`/academic/courses/${id}`);
      await fetchAcademicSetup();
      toast.success("Course deleted successfully");
    } catch (error) {
      toast.error(
        getBackendErrorMessage(error) ||
          "Failed to delete course"
      );
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
    if (!canAddBatch) return;

    const batchName = newBatch.batchName.trim();
    const startTime = newBatch.startTime.trim().toUpperCase();
    const endTime = newBatch.endTime.trim().toUpperCase();

    if (!batchName || !startTime || !endTime) {
      toast.error("Batch name, start time and end time are required");
      return;
    }

    const normalTimePattern =
      /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

    if (
      !normalTimePattern.test(startTime) ||
      !normalTimePattern.test(endTime)
    ) {
      toast.error("Enter time like 10:00 AM or 04:30 PM");
      return;
    }

    try {
      setIsSetupSaving(true);

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

      await fetchAcademicSetup();
      toast.success("Batch added successfully");
    } catch (error) {
      toast.error(
        getBackendErrorMessage(error) ||
          "Failed to add batch"
      );
    } finally {
      setIsSetupSaving(false);
    }
  };

  const handleSetupSave = async () => {
    const courseName = newCourseName.trim();
    const batchName = newBatch.batchName.trim();
    const startTime = newBatch.startTime.trim().toUpperCase();
    const endTime = newBatch.endTime.trim().toUpperCase();

    const hasCourse = Boolean(courseName) && canAddCourse;
    const hasAnyBatchValue = Boolean(batchName || startTime || endTime);
    const hasCompleteBatch =
      Boolean(batchName && startTime && endTime) && canAddBatch;

    if (!hasCourse && !hasAnyBatchValue) {
      setShowSetupModal(false);
      return;
    }

    if (hasAnyBatchValue && !hasCompleteBatch) {
      toast.error("Batch name, start time and end time are required");
      return;
    }

    const normalTimePattern =
      /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

    if (
      hasCompleteBatch &&
      (!normalTimePattern.test(startTime) ||
        !normalTimePattern.test(endTime))
    ) {
      toast.error("Enter time like 10:00 AM or 04:30 PM");
      return;
    }

    try {
      setIsSetupSaving(true);
      const requests = [];

      if (hasCourse) {
        requests.push(
          api.post("/academic/courses", { courseName })
        );
      }

      if (hasCompleteBatch) {
        requests.push(
          api.post("/academic/batches", {
            batchName,
            startTime,
            endTime,
          })
        );
      }

      await Promise.all(requests);

      setNewCourseName("");
      setNewBatch({
        batchName: "",
        startTime: "",
        endTime: "",
      });

      await fetchAcademicSetup();
      setShowSetupModal(false);
      toast.success("Setup saved successfully");
    } catch (error) {
      toast.error(
        getBackendErrorMessage(error) ||
          "Failed to save setup"
      );
    } finally {
      setIsSetupSaving(false);
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!canDeleteBatch) return;

    try {
      await api.delete(`/academic/batches/${id}`);
      await fetchAcademicSetup();
      toast.success("Batch deleted successfully");
    } catch (error) {
      toast.error(
        getBackendErrorMessage(error) ||
          "Failed to delete batch"
      );
    }
  };

  const formatBatchLabel = (batch) =>
    `${batch.batchName} — ${batch.startTime} - ${batch.endTime}`;

  const openBulkModal = () => {
    if (!canBulkUpload) return;

    setShowBulkModal(true);
    setBulkStep("select");
    setBulkFile(null);
    setBulkPreview(null);
    setBulkPreviewTab("valid");
    setBulkImportResult(null);
  };

  const closeBulkModal = () => {
    if (isBulkPreviewing || isBulkImporting) return;

    setShowBulkModal(false);
    setBulkStep("select");
    setBulkFile(null);
    setBulkPreview(null);
    setBulkPreviewTab("valid");
    setBulkImportResult(null);

    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    downloadCsv("student-bulk-upload-template.csv", [
      BULK_UPLOAD_TEMPLATE_HEADERS,
      BULK_UPLOAD_TEMPLATE_EXAMPLE,
    ]);
  };

  const handleBulkFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      toast.error("Only .xlsx or .csv files are allowed");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_BULK_UPLOAD_FILE_SIZE) {
      toast.error("File is too large. Maximum allowed size is 5 MB");
      event.target.value = "";
      return;
    }

    setBulkFile(file);
  };

  const clearBulkFile = () => {
    setBulkFile(null);

    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = "";
    }
  };

  const handleBulkPreview = async () => {
    if (!bulkFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setIsBulkPreviewing(true);

      const formData = new FormData();
      formData.append("file", bulkFile);

      const response = await api.post(
        "/students/bulk-upload/preview",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const preview = response.data;

      setBulkPreview(preview);
      setBulkPreviewTab(
        preview.summary.valid > 0
          ? "valid"
          : preview.summary.duplicate > 0
            ? "duplicate"
            : "invalid"
      );
      setBulkStep("preview");
    } catch (error) {
      toast.error(
        getBackendErrorMessage(error) || "Failed to read the file"
      );
    } finally {
      setIsBulkPreviewing(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkPreview) return;

    const validRows = bulkPreview.rows.filter(
      (row) => row.status === "valid"
    );

    if (validRows.length === 0) {
      toast.error("There are no valid rows to import");
      return;
    }

    try {
      setIsBulkImporting(true);

      const payload = {
        rows: validRows.map((row) => ({
          rowNumber: row.rowNumber,
          ...row.data,
        })),
      };

      const response = await api.post(
        "/students/bulk-upload/import",
        payload
      );

      // Rows that were already invalid/duplicate at preview time are never
      // submitted here at all, so the import response alone only ever
      // reports failures found during this commit step — on a normal file
      // with bad rows, that made the final "Failed" count and row list
      // under-report (often showing 0) even though rows genuinely never
      // made it in. Merge the two so the summary reflects the whole file.
      const skippedAtPreview = bulkPreview.rows
        .filter((row) => row.status !== "valid")
        .map((row) => ({
          rowNumber: row.rowNumber,
          status: "failed",
          studentName: row.data.studentName,
          rollNo: row.data.rollNo,
          reason: row.reasons.join("; "),
        }));

      const mergedResults = [...skippedAtPreview, ...response.data.results].sort(
        (a, b) => (a.rowNumber ?? 0) - (b.rowNumber ?? 0)
      );

      const totalFailedCount = skippedAtPreview.length + response.data.failedCount;

      const enrichedResult = {
        totalSubmitted: bulkPreview.totalRows,
        importedCount: response.data.importedCount,
        failedCount: totalFailedCount,
        results: mergedResults,
      };

      setBulkImportResult(enrichedResult);
      setBulkStep("summary");

      await fetchStudents();

      if (response.data.importedCount > 0) {
        toast.success(
          `${response.data.importedCount} student(s) imported successfully`
        );
      }

      if (totalFailedCount > 0) {
        toast.error(
          `${totalFailedCount} row(s) could not be imported`
        );
      }
    } catch (error) {
      toast.error(
        getBackendErrorMessage(error) || "Failed to import students"
      );
    } finally {
      setIsBulkImporting(false);
    }
  };

  const getBulkErrorRows = () => {
    // After import, bulkImportResult.results already merges preview-time
    // skips with import-time failures (see handleBulkImport) — reading
    // bulkPreview here too would double-count the same rows. Before
    // import (still on the preview step), bulkImportResult is null, so
    // bulkPreview.rows is the only source available.
    if (bulkImportResult) {
      return bulkImportResult.results
        .filter((result) => result.status === "failed")
        .map((result) => ({
          rowNumber: result.rowNumber,
          studentName: result.studentName,
          rollNo: result.rollNo,
          course: "",
          phone: "",
          status: "failed",
          reason: result.reason || "",
        }));
    }

    if (bulkPreview) {
      return bulkPreview.rows
        .filter((row) => row.status !== "valid")
        .map((row) => ({
          rowNumber: row.rowNumber,
          studentName: row.data.studentName,
          rollNo: row.data.rollNo,
          course: row.data.course,
          phone: row.data.phone,
          status: row.status,
          reason: row.reasons.join("; "),
        }));
    }

    return [];
  };

  const handleDownloadErrorCsv = () => {
    const errorRows = getBulkErrorRows();

    if (errorRows.length === 0) return;

    downloadCsv("student-bulk-upload-errors.csv", [
      ["Row", "Student Name", "Roll No", "Course", "Phone", "Status", "Reason"],
      ...errorRows.map((row) => [
        row.rowNumber,
        row.studentName,
        row.rollNo,
        row.course,
        row.phone,
        row.status,
        row.reason,
      ]),
    ]);
  };

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString(
      "en-IN"
    );

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStudentId = (student) => {
    if (student.studentId) {
      return student.studentId;
    }

    if (student._id) {
      return `SK-${student._id
        .slice(-8)
        .toUpperCase()}`;
    }

    return "-";
  };

  return (
    <div className="students-page">


      <div className="student-payment-summary-grid">
        <article className="student-payment-summary-card">
          <div className="student-payment-summary-icon"><FiUsers /></div>
          <div>
            <span>Total Students</span>
            <strong>{summary.totalStudents}</strong>
            <small>Registered students</small>
          </div>
        </article>

        <article className="student-payment-summary-card">
          <div className="student-payment-summary-icon"><FiUser /></div>
          <div>
            <span>Active Students</span>
            <strong>{summary.activeStudents}</strong>
            <small>Currently active records</small>
          </div>
        </article>

        <article className="student-payment-summary-card">
          <div className="student-payment-summary-icon"><FiBookOpen /></div>
          <div>
            <span>Courses</span>
            <strong>{academicCourses.length || studentCourses.length}</strong>
            <small>Active course categories</small>
          </div>
        </article>

        <article className="student-payment-summary-card">
          <div className="student-payment-summary-icon"><FiCalendar /></div>
          <div>
            <span>Batches</span>
            <strong>{academicBatches.length}</strong>
            <small>Available batch timings</small>
          </div>
        </article>
      </div>
      <section className="students-list-section">
        <div className="students-toolbar">
          <div className="student-search">
            <FiSearch />

            <input
              type="text"
              placeholder="Search by student name or mobile number..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div className="student-filter-wrapper">
            <button
              type="button"
              className={`student-filter-button ${
                showFilters ? "active" : ""
              }`}
              onClick={() =>
                setShowFilters((current) => !current)
              }
            >
              <FiFilter />
              <span>Filter</span>

              {activeFilterCount > 0 && (
                <span className="filter-count-badge">{activeFilterCount}</span>
              )}
            </button>

            {showFilters && (
              <div className="student-filter-dropdown">
                <div className="student-filter-header">
                  <strong>Filter Students</strong>

                  <div className="filter-header-actions">
                    <button
                      type="button"
                      disabled={activeFilterCount === 0}
                      onClick={() => {
                        setCourseFilter("all");
                        setBatchFilter("all");
                      }}
                    >Clear</button>
                    <button type="button" className="filter-close-btn" onClick={() => setShowFilters(false)} aria-label="Close filters">
                      <FiX />
                    </button>
                  </div>
                </div>

                <div className="student-filter-field">
                  <label>Course</label>

                  <select
                    value={courseFilter}
                    onChange={(event) =>
                      setCourseFilter(event.target.value)
                    }
                  >
                    <option value="all">
                      All Courses
                    </option>

                    {(academicCourses.length
                      ? academicCourses.map(
                          (course) => course.courseName
                        )
                      : studentCourses
                    ).map((course) => (
                      <option
                        key={course}
                        value={course}
                      >
                        {course}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="student-filter-field">
                  <label>Batch</label>

                  <select
                    value={batchFilter}
                    onChange={(event) =>
                      setBatchFilter(event.target.value)
                    }
                  >
                    <option value="all">
                      All Batches
                    </option>

                    {academicBatches.map((batch) => {
                      const label =
                        formatBatchLabel(batch);

                      return (
                        <option
                          key={batch._id}
                          value={label}
                        >
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="students-header-actions">
            <button
              type="button"
              className="student-setup-btn"
              onClick={() => setShowSetupModal(true)}
              title="Course and Batch Setup"
            >
              <FiSettings />
              <span>Setup</span>
            </button>

            {canBulkUpload && (
              <button
                type="button"
                className="student-bulk-upload-btn"
                onClick={openBulkModal}
                title="Bulk upload students from Excel/CSV"
              >
                <FiUpload />
                <span>Bulk Upload</span>
              </button>
            )}

            {canAdd && (
              <button
                type="button"
                className="add-student-btn"
                onClick={openAddModal}
              >
                <FiPlus />
                <span>Add Student</span>
              </button>
            )}
          </div>
        </div>

        <div className="students-table-card">
          {isLoading ? (
            <div className="students-message">
              <LoadingLogo />

              <span>
                Loading students...
              </span>
            </div>
          ) : filteredStudents.length ===
            0 ? (
            <div className="students-message">
              <FiUsers />

              <strong>
                No students found
              </strong>

              <span>
                Try changing your search
                or filter
              </span>
            </div>
          ) : (
            <div className="students-table-wrapper">
              <table className="students-table">
                <thead>
                  <tr>
                    <th className="col-serial">S.No</th>
                    {showStudentColumn && <th className="col-student">Student</th>}
                    {visibleFields.has("rollNo") && <th className="col-rollno">Roll No</th>}
                    {visibleFields.has("course") && <th className="col-course">Course</th>}
                    {visibleFields.has("gender") && <th className="col-gender">Gender</th>}
                    {visibleFields.has("phone") && <th className="col-phone">Phone</th>}
                    {visibleFields.has("idproof") && (
                      <th className="col-aadhaar">Aadhaar Number</th>
                    )}
                    {showActionsColumn && <th className="col-actions">Actions</th>}
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student, index) => (
                      <tr
                        key={student._id}
                        className={
                          canView ? "student-clickable-row" : ""
                        }
                        onClick={
                          canView
                            ? () => openViewModal(student)
                            : undefined
                        }
                      >
                        <td className="col-serial">
                          <span className="serial-number">
                            {index + 1}
                          </span>
                        </td>

                        {showStudentColumn && (
                          <td className="col-student">
                            <div className="student-profile-cell">
                              <div className="student-avatar">
                                {student.studentName
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  "S"}
                              </div>

                              <div className="student-name-cell">
                                {visibleFields.has("studentName") && (
                                  <strong>
                                    {
                                      student.studentName
                                    }
                                  </strong>
                                )}

                                {visibleFields.has("parentName") && (
                                  <span>
                                    Parent:{" "}
                                    {
                                      student.parentName
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        )}

                        {visibleFields.has("rollNo") && (
                          <td className="col-rollno">
                            <span className="roll-number-badge">
                              {student.rollNo || "-"}
                            </span>
                          </td>
                        )}

                        {visibleFields.has("course") && (
                          <td className="col-course">
                            <span className="course-badge">
                              {
                                student.course
                              }
                            </span>
                          </td>
                        )}

                        {visibleFields.has("gender") && (
                          <td className="col-gender">
                            {student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : "-"}
                          </td>
                        )}

                        {visibleFields.has("phone") && (
                          <td className="col-phone">
                            {student.phone}
                          </td>
                        )}

                        {visibleFields.has("idproof") && (
                          <td className="col-aadhaar">
                            <span className="aadhaar-table-value">
                              {student.idproof || "-"}
                            </span>
                          </td>
                        )}

                        {showActionsColumn && (
                          <td className="col-actions">
                            <div className="student-actions">
                              {canView && (
                                <button
                                  type="button"
                                  title="View Student"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openViewModal(student);
                                  }}
                                >
                                  <FiEye />
                                </button>
                              )}

                              {canEdit && (
                                <button
                                  type="button"
                                  title="Edit Student"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEditModal(student);
                                  }}
                                >
                                  <FiEdit2 />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  title="Delete Student"
                                  className="delete-btn"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openDeleteModal(student);
                                  }}
                                >
                                  <FiTrash2 />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      

      {showSetupModal && (
        <div className="student-modal-overlay">
          <div className="student-modal setup-modal">
            <div className="student-modal-header">
              <div className="modal-heading-content">
                <span className="modal-icon">
                  <FiSettings />
                </span>

                <div>
                  <h2>Student Setup</h2>
                  <p>
                    Manage courses and batches used in Add Student
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowSetupModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="setup-modal-body">
              <section className="setup-section">
                <div className="setup-section-heading">
                  <div>
                    <h3>Courses</h3>
                    <p>Add the courses available in the institute</p>
                  </div>
                </div>

                {canAddCourse && (
                  <div className="setup-add-row">
                    <input
                      type="text"
                      value={newCourseName}
                      onChange={(event) =>
                        setNewCourseName(event.target.value)
                      }
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
                      className="setup-add-btn"
                      onClick={handleAddCourse}
                      disabled={isSetupSaving}
                    >
                      <FiPlus /> Add Course
                    </button>
                  </div>
                )}

                <div className="setup-items">
                  {academicCourses.length === 0 ? (
                    <div className="setup-empty">
                      No courses added yet
                    </div>
                  ) : (
                    academicCourses.map((course) => (
                      <div
                        className="setup-item"
                        key={course._id}
                      >
                        <div>
                          <strong>{course.courseName}</strong>
                          <span>Course</span>
                        </div>

                        {canDeleteCourse && (
                          <button
                            type="button"
                            className="setup-delete-btn"
                            onClick={() =>
                              handleDeleteCourse(course._id)
                            }
                            title="Delete course"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="setup-section">
                <div className="setup-section-heading">
                  <div>
                    <h3>Batches</h3>
                    <p>
                      Add batch name with normal AM/PM timing
                    </p>
                  </div>
                </div>

                {canAddBatch && (
                  <div className="setup-batch-grid">
                    <input
                      type="text"
                      name="batchName"
                      value={newBatch.batchName}
                      onChange={handleBatchChange}
                      placeholder="Batch name - Morning"
                    />

                    <input
                      type="text"
                      name="startTime"
                      value={newBatch.startTime}
                      onChange={handleBatchChange}
                      placeholder="Start - 10:00 AM"
                    />

                    <input
                      type="text"
                      name="endTime"
                      value={newBatch.endTime}
                      onChange={handleBatchChange}
                      placeholder="End - 11:00 AM"
                    />

                    <button
                      type="button"
                      className="setup-add-btn"
                      onClick={handleAddBatch}
                      disabled={isSetupSaving}
                    >
                      <FiPlus /> Add Batch
                    </button>
                  </div>
                )}

                <div className="setup-items">
                  {academicBatches.length === 0 ? (
                    <div className="setup-empty">
                      No batches added yet
                    </div>
                  ) : (
                    academicBatches.map((batch) => (
                      <div
                        className="setup-item"
                        key={batch._id}
                      >
                        <div>
                          <strong>
                            {formatBatchLabel(batch)}
                          </strong>
                          <span>Batch & Timing</span>
                        </div>

                        {canDeleteBatch && (
                          <button
                            type="button"
                            className="setup-delete-btn"
                            onClick={() =>
                              handleDeleteBatch(batch._id)
                            }
                            title="Delete batch"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>


              <div className="setup-modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowSetupModal(false)}
                  disabled={isSetupSaving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-btn setup-save-btn"
                  onClick={handleSetupSave}
                  disabled={isSetupSaving}
                >
                  <FiSave />
                  {isSetupSaving ? "Saving..." : "Save"}
                </button>
              </div>            </div>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="student-modal-overlay">
          <div className="student-modal bulk-upload-modal">
            <div className="student-modal-header">
              <div className="modal-heading-content">
                <span className="modal-icon">
                  <FiUpload />
                </span>

                <div>
                  <h2>Bulk Upload Students</h2>
                  <p>
                    {bulkStep === "select" &&
                      "Import multiple students from an Excel or CSV file"}
                    {bulkStep === "preview" &&
                      "Review the rows found in your file before importing"}
                    {bulkStep === "summary" && "Import finished"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeBulkModal}
                aria-label="Close bulk upload"
              >
                <FiX />
              </button>
            </div>

            <div className="bulk-upload-body">
              {bulkStep === "select" && (
                <div className="bulk-upload-select-step">
                  <div className="bulk-upload-template-row">
                    <span>
                      Use the sample template so your columns match what we
                      expect (Student Name, Roll No, Parent Name, Date of
                      Birth, Gender, Phone, Course, Aadhaar Number are
                      required — Course and Batch must already exist in
                      Setup).
                    </span>

                    <button
                      type="button"
                      className="secondary-btn bulk-template-btn"
                      onClick={handleDownloadTemplate}
                    >
                      <FiDownload />
                      Sample Template
                    </button>
                  </div>

                  <label className="bulk-upload-dropzone" htmlFor="bulk-upload-file">
                    <FiUpload />
                    <strong>
                      {bulkFile ? bulkFile.name : "Click to select a file"}
                    </strong>
                    <span>.xlsx or .csv, up to 5 MB</span>
                  </label>

                  <input
                    id="bulk-upload-file"
                    ref={bulkFileInputRef}
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleBulkFileChange}
                    hidden
                  />

                  {bulkFile && (
                    <div className="bulk-upload-file-chip">
                      <FiFileText />
                      <span>
                        {bulkFile.name} (
                        {(bulkFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                      <button
                        type="button"
                        onClick={clearBulkFile}
                        aria-label="Remove selected file"
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {bulkStep === "preview" && bulkPreview && (
                <div className="bulk-upload-preview-step">
                  <div className="bulk-upload-summary-row">
                    <button
                      type="button"
                      className={`bulk-summary-pill valid ${
                        bulkPreviewTab === "valid" ? "active" : ""
                      }`}
                      onClick={() => setBulkPreviewTab("valid")}
                    >
                      <FiCheckCircle />
                      <strong>{bulkPreview.summary.valid}</strong>
                      <span>Valid</span>
                    </button>

                    <button
                      type="button"
                      className={`bulk-summary-pill duplicate ${
                        bulkPreviewTab === "duplicate" ? "active" : ""
                      }`}
                      onClick={() => setBulkPreviewTab("duplicate")}
                    >
                      <FiAlertTriangle />
                      <strong>{bulkPreview.summary.duplicate}</strong>
                      <span>Duplicate</span>
                    </button>

                    <button
                      type="button"
                      className={`bulk-summary-pill invalid ${
                        bulkPreviewTab === "invalid" ? "active" : ""
                      }`}
                      onClick={() => setBulkPreviewTab("invalid")}
                    >
                      <FiXCircle />
                      <strong>{bulkPreview.summary.invalid}</strong>
                      <span>Invalid</span>
                    </button>
                  </div>

                  <div className="bulk-upload-table-wrapper">
                    <table className="bulk-upload-table">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Student</th>
                          <th>Roll No</th>
                          <th>Course</th>
                          <th>Phone</th>
                          {bulkPreviewTab !== "valid" && <th>Reason</th>}
                        </tr>
                      </thead>

                      <tbody>
                        {bulkPreview.rows.filter(
                          (row) => row.status === bulkPreviewTab
                        ).length === 0 ? (
                          <tr>
                            <td
                              colSpan={bulkPreviewTab !== "valid" ? 6 : 5}
                              className="bulk-upload-empty-cell"
                            >
                              No {bulkPreviewTab} rows
                            </td>
                          </tr>
                        ) : (
                          bulkPreview.rows
                            .filter((row) => row.status === bulkPreviewTab)
                            .map((row) => (
                              <tr key={row.rowNumber}>
                                <td>{row.rowNumber}</td>
                                <td>{row.data.studentName || "-"}</td>
                                <td>{row.data.rollNo || "-"}</td>
                                <td>{row.data.course || "-"}</td>
                                <td>{row.data.phone || "-"}</td>
                                {bulkPreviewTab !== "valid" && (
                                  <td className="bulk-upload-reason-cell">
                                    {row.reasons.join("; ")}
                                  </td>
                                )}
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bulkStep === "summary" && bulkImportResult && (
                <div className="bulk-upload-summary-step">
                  <div className="bulk-upload-summary-row">
                    <div className="bulk-summary-pill valid static">
                      <FiCheckCircle />
                      <strong>{bulkImportResult.importedCount}</strong>
                      <span>Imported</span>
                    </div>

                    <div className="bulk-summary-pill invalid static">
                      <FiXCircle />
                      <strong>{bulkImportResult.failedCount}</strong>
                      <span>Failed</span>
                    </div>
                  </div>

                  {bulkImportResult.failedCount > 0 && (
                    <div className="bulk-upload-table-wrapper">
                      <table className="bulk-upload-table">
                        <thead>
                          <tr>
                            <th>Row</th>
                            <th>Student</th>
                            <th>Roll No</th>
                            <th>Reason</th>
                          </tr>
                        </thead>

                        <tbody>
                          {bulkImportResult.results
                            .filter((result) => result.status === "failed")
                            .map((result, index) => (
                              <tr key={`${result.rowNumber}-${index}`}>
                                <td>{result.rowNumber ?? "-"}</td>
                                <td>{result.studentName || "-"}</td>
                                <td>{result.rollNo || "-"}</td>
                                <td className="bulk-upload-reason-cell">
                                  {result.reason || "-"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bulk-upload-actions">
              {bulkStep === "select" && (
                <>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={closeBulkModal}
                    disabled={isBulkPreviewing}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleBulkPreview}
                    disabled={!bulkFile || isBulkPreviewing}
                  >
                    {isBulkPreviewing ? "Reading file..." : "Upload & Preview"}
                  </button>
                </>
              )}

              {bulkStep === "preview" && (
                <>
                  <button
                    type="button"
                    className="secondary-btn bulk-back-btn"
                    onClick={() => setBulkStep("select")}
                    disabled={isBulkImporting}
                  >
                    <FiArrowLeft />
                    Back
                  </button>

                  {getBulkErrorRows().length > 0 && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={handleDownloadErrorCsv}
                      disabled={isBulkImporting}
                    >
                      <FiDownload />
                      Download Error CSV
                    </button>
                  )}

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleBulkImport}
                    disabled={
                      isBulkImporting ||
                      !bulkPreview ||
                      bulkPreview.summary.valid === 0
                    }
                  >
                    {isBulkImporting
                      ? "Importing..."
                      : `Import Valid Students (${bulkPreview?.summary.valid || 0})`}
                  </button>
                </>
              )}

              {bulkStep === "summary" && (
                <>
                  {getBulkErrorRows().length > 0 && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={handleDownloadErrorCsv}
                    >
                      <FiDownload />
                      Download Error CSV
                    </button>
                  )}

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={closeBulkModal}
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="student-modal-overlay student-form-overlay">
          <div className="student-modal form-modal student-admission-modal">
            <div className="student-admission-header">
              <div className="student-admission-title">
                <div className="student-admission-icon">
                  {editingStudent ? <FiEdit2 /> : <FiPlus />}
                </div>

                <div>
                  <span>
                    {editingStudent
                      ? "UPDATE STUDENT"
                      : "NEW ADMISSION"}
                  </span>

                  <h2>
                    {editingStudent
                      ? "Edit Student Details"
                      : "Add New Student"}
                  </h2>

                  <p>
                    {editingStudent
                      ? "Update personal, contact and academic information."
                      : "Create a complete student profile for SK Learnings."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close-btn student-admission-close"
                onClick={closeFormModal}
                aria-label="Close student form"
              >
                <FiX />
              </button>
            </div>

            <form
              className="student-form student-admission-form"
              onSubmit={handleSubmit}
              noValidate
            >
              {submitError && (
                <div
                  className="student-submit-error"
                  role="alert"
                >
                  {submitError}
                </div>
              )}

              <section className="student-form-panel">
                <div className="student-form-panel-heading">
                  <div className="student-form-panel-icon">
                    <FiUser />
                  </div>

                  <div>
                    <h3>Personal Information</h3>
                    <p>
                      Student identity and parent details
                    </p>
                  </div>
                </div>

                <div className="form-grid student-admission-grid">
                  <div className="student-form-group">
                    <label>
                      Student Name <span>*</span>
                    </label>

                    <input
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleChange}
                      placeholder="Enter student name"
                      required
                      className={
                        formErrors.studentName
                          ? "input-error"
                          : ""
                      }
                    />

                    {formErrors.studentName && (
                      <small className="form-error-text">
                        {formErrors.studentName}
                      </small>
                    )}
                  </div>

                  <div className="student-form-group">
                    <label>
                      Roll Number <span>*</span>
                    </label>

                    <input
                      name="rollNo"
                      value={formData.rollNo}
                      onChange={handleChange}
                      placeholder="Example: SK-LN-001"
                      required
                      className={
                        formErrors.rollNo
                          ? "input-error"
                          : ""
                      }
                    />

                    {formErrors.rollNo && (
                      <small className="form-error-text">
                        {formErrors.rollNo}
                      </small>
                    )}
                  </div>

                  <div className="student-form-group">
                    <label>
                      Date of Birth <span>*</span>
                    </label>

                    <div className="student-date-field">
                      <FiCalendar />

                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        max={new Date()
                          .toISOString()
                          .split("T")[0]}
                        required
                        className={
                          formErrors.dateOfBirth
                            ? "input-error"
                            : ""
                        }
                      />
                    </div>

                    {formErrors.dateOfBirth && (
                      <small className="form-error-text">
                        {formErrors.dateOfBirth}
                      </small>
                    )}
                  </div>

                  <div className="student-form-group">
                    <label>
                      Gender <span>*</span>
                    </label>

                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      className={formErrors.gender ? "input-error" : ""}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="others">Others</option>
                    </select>

                    {formErrors.gender && (
                      <small className="form-error-text">
                        {formErrors.gender}
                      </small>
                    )}
                  </div>

                  <div className="student-form-group">
                    <label>
                      Parent / Guardian Name <span>*</span>
                    </label>

                    <input
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleChange}
                      placeholder="Enter parent or guardian name"
                      required
                      className={
                        formErrors.parentName
                          ? "input-error"
                          : ""
                      }
                    />

                    {formErrors.parentName && (
                      <small className="form-error-text">
                        {formErrors.parentName}
                      </small>
                    )}
                  </div>

                  <div className="student-form-group">
                    <label>
                      Aadhaar Number <span>*</span>
                    </label>

                    <input
                      name="idproof"
                      maxLength="14"
                      inputMode="numeric"
                      value={formData.idproof}
                      onChange={handleChange}
                      placeholder="1234 5678 9878"
                      required
                      className={
                        formErrors.idproof
                          ? "input-error"
                          : ""
                      }
                    />

                    {formErrors.idproof && (
                      <small className="form-error-text">
                        {formErrors.idproof}
                      </small>
                    )}
                  </div>

                  <div className="student-form-group">
                    <label>School Name</label>

                    <input
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleChange}
                      placeholder="Enter school name"
                    />
                  </div>
                </div>
              </section>

              <section className="student-form-panel">
                <div className="student-form-panel-heading">
                  <div className="student-form-panel-icon">
                    <FiPhone />
                  </div>

                  <div>
                    <h3>Contact Information</h3>
                    <p>
                      Parent phone and communication details
                    </p>
                  </div>
                </div>

                <div className="form-grid student-admission-grid">
                  <div className="student-form-group">
                    <label>
                      Parent Phone <span>*</span>
                    </label>

                    <input
                      name="phone"
                      maxLength="11"
                      inputMode="numeric"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="98789 89789"
                      required
                      className={
                        formErrors.phone
                          ? "input-error"
                          : ""
                      }
                    />

                    {formErrors.phone && (
                      <small className="form-error-text">
                        {formErrors.phone}
                      </small>
                    )}
                  </div>

                  <div className="student-form-group">
                    <label>Alternate Number</label>

                    <input
                      name="alternatePhone"
                      maxLength="11"
                      inputMode="numeric"
                      value={formData.alternatePhone}
                      onChange={handleChange}
                      placeholder="98789 89789"
                      className={
                        formErrors.alternatePhone
                          ? "input-error"
                          : ""
                      }
                    />

                    {formErrors.alternatePhone && (
                      <small className="form-error-text">
                        {formErrors.alternatePhone}
                      </small>
                    )}
                  </div>

                  <div className="student-form-group full-width">
                    <label>Email Address</label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="student@email.com"
                      className={
                        formErrors.email
                          ? "input-error"
                          : ""
                      }
                    />

                    {formErrors.email && (
                      <small className="form-error-text">
                        {formErrors.email}
                      </small>
                    )}
                  </div>
                </div>
              </section>

              <section className="student-form-panel">
                <div className="student-form-panel-heading">
                  <div className="student-form-panel-icon">
                    <FaGraduationCap />
                  </div>

                  <div>
                    <h3>Academic Information</h3>
                    <p>
                      Course, batch and learning details
                    </p>
                  </div>
                </div>

                <div className="form-grid student-admission-grid">
                  <div className="student-form-group">
                    <label>
                      Course <span>*</span>
                    </label>

                    <select
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      required
                      className={
                        formErrors.course
                          ? "input-error"
                          : ""
                      }
                    >
                      <option value="">
                        Select course
                      </option>

                      {academicCourses.map((course) => (
                        <option
                          key={course._id}
                          value={course.courseName}
                        >
                          {course.courseName}
                        </option>
                      ))}
                    </select>

                    {formErrors.course && (
                      <small className="form-error-text">
                        {formErrors.course}
                      </small>
                    )}
                  </div>

                  <div className="student-form-group">
                    <label>Batch</label>

                    <select
                      name="batch"
                      value={formData.batch}
                      onChange={handleChange}
                    >
                      <option value="">
                        Select batch
                      </option>

                      {academicBatches.map((batch) => {
                        const label =
                          formatBatchLabel(batch);

                        return (
                          <option
                            key={batch._id}
                            value={label}
                          >
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="student-form-group full-width">
                    <label>Residential Address</label>

                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter full residential address"
                      rows="3"
                    />
                  </div>
                </div>
              </section>

              <div className="student-form-actions student-admission-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeFormModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={isSaving}
                >
                  <FiSave />

                  {isSaving
                    ? "Saving..."
                    : editingStudent
                      ? "Update Student"
                      : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedStudent && (
        <div className="student-modal-overlay student-profile-overlay">
          <div className="student-profile-modal">
            <div className="student-profile-hero">
              <button
                type="button"
                className="student-profile-close"
                onClick={closeViewModal}
                aria-label="Close student details"
              >
                <FiX />
              </button>

              <div className="student-profile-brand-row">
                <div className="student-profile-brand">
                 

                  <div>
                    <span>THE SK LEARNINGS</span>
                    <small>STUDENT PROFILE</small>
                  </div>
                </div>

                <div className="student-profile-status">
                  <span />
                  Active Student
                </div>
              </div>

              <div className="student-profile-main">
                <div className="student-profile-avatar-large">
                  {selectedStudent.studentName
                    ?.charAt(0)
                    ?.toUpperCase() || "S"}
                </div>

                <div className="student-profile-identity">
                  {visibleFields.has("studentName") ? (
                    <>
                      <small>STUDENT NAME</small>
                      <h2>{selectedStudent.studentName}</h2>
                    </>
                  ) : (
                    <h2>Student Profile</h2>
                  )}

                  <div className="student-profile-chip-row">
                    {visibleFields.has("course") && (
                      <span>
                        <FiBookOpen />
                        {selectedStudent.course || "No Course"}
                      </span>
                    )}

                    {visibleFields.has("batch") && (
                      <span>
                        <FiUsers />
                        {selectedStudent.batch || "No Batch"}
                      </span>
                    )}
                  </div>
                </div>

                {visibleFields.has("rollNo") && (
                  <div className="student-profile-roll-card">
                    <small>ROLL NO</small>
                    <strong>{selectedStudent.rollNo || "-"}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="student-profile-content">
              {(visibleFields.has("parentName") ||
                visibleFields.has("dateOfBirth") ||
                visibleFields.has("gender") ||
                visibleFields.has("phone") ||
                visibleFields.has("alternatePhone") ||
                visibleFields.has("email")) && (
                <section className="student-profile-section">
                  <div className="student-profile-section-title">
                    <span className="student-profile-section-icon">
                      <FiUser />
                    </span>

                    <div>
                      <h3>Parent & Contact</h3>
                      <p>Primary student contact information</p>
                    </div>
                  </div>

                  <div className="student-profile-info-grid">
                    {visibleFields.has("parentName") && (
                      <ProfileDetail
                        label="Parent Name"
                        value={selectedStudent.parentName || "-"}
                      />
                    )}

                    {visibleFields.has("dateOfBirth") && (
                      <ProfileDetail
                        label="Date of Birth"
                        value={formatDate(selectedStudent.dateOfBirth)}
                        icon={<FiCalendar />}
                      />
                    )}

                    {visibleFields.has("gender") && (
                      <ProfileDetail
                        label="Gender"
                        value={selectedStudent.gender ? selectedStudent.gender.charAt(0).toUpperCase() + selectedStudent.gender.slice(1) : "-"}
                        icon={<FiUser />}
                      />
                    )}

                    {visibleFields.has("phone") && (
                      <ProfileDetail
                        label="Parent Phone"
                        value={selectedStudent.phone || "-"}
                        icon={<FiPhone />}
                      />
                    )}

                    {visibleFields.has("alternatePhone") && (
                      <ProfileDetail
                        label="Alternate Number"
                        value={selectedStudent.alternatePhone || "-"}
                        icon={<FiPhone />}
                      />
                    )}

                    {visibleFields.has("email") && (
                      <ProfileDetail
                        label="Email Address"
                        value={selectedStudent.email || "-"}
                        icon={<FiMail />}
                      />
                    )}
                  </div>
                </section>
              )}

              {(visibleFields.has("course") ||
                visibleFields.has("batch") ||
                visibleFields.has("schoolName") ||
                visibleFields.has("idproof")) && (
                <section className="student-profile-section">
                  <div className="student-profile-section-title">
                    <span className="student-profile-section-icon">
                      <FaGraduationCap />
                    </span>

                    <div>
                      <h3>Academic & Identity</h3>
                      <p>Education and identification details</p>
                    </div>
                  </div>

                  <div className="student-profile-info-grid">
                    {visibleFields.has("course") && (
                      <ProfileDetail
                        label="Course"
                        value={selectedStudent.course || "-"}
                        icon={<FiBookOpen />}
                      />
                    )}

                    {visibleFields.has("batch") && (
                      <ProfileDetail
                        label="Batch"
                        value={selectedStudent.batch || "-"}
                        icon={<FiUsers />}
                      />
                    )}

                    {visibleFields.has("schoolName") && (
                      <ProfileDetail
                        label="School Name"
                        value={selectedStudent.schoolName || "-"}
                      />
                    )}

                    {visibleFields.has("idproof") && (
                      <ProfileDetail
                        label="Aadhaar Number"
                        value={selectedStudent.idproof || "-"}
                        icon={<FiCreditCard />}
                      />
                    )}
                  </div>
                </section>
              )}

              {visibleFields.has("address") && (
                <section className="student-profile-address-card">
                  <div className="student-profile-address-icon">
                    <FiMapPin />
                  </div>

                  <div>
                    <span>RESIDENTIAL ADDRESS</span>
                    <p>{selectedStudent.address || "-"}</p>
                  </div>
                </section>
              )}
            </div>

            <div className="student-profile-footer">
              <span>THE SK LEARNINGS</span>
              <small>Private Educational Services</small>
            </div>
          </div>
        </div>
      )}

      

      {showDeleteModal &&
        selectedStudent && (
          <div className="student-modal-overlay">
            <div className="student-modal delete-modal">
              <div className="delete-icon">
                <FiTrash2 />
              </div>

              <h2>
                Delete Student?
              </h2>

              <p>
                Are you sure you want
                to delete{" "}
                <strong>
                  {
                    selectedStudent.studentName || "this student"
                  }
                </strong>
                ? This student record
                will be removed.
              </p>

              <div className="delete-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setShowDeleteModal(
                      false
                    );

                    setSelectedStudent(
                      null
                    );
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="confirm-delete-btn"
                  onClick={
                    handleDelete
                  }
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

const ProfileDetail = ({
  label,
  value,
  icon,
}) => {
  return (
    <div className="student-profile-detail-row">
      {icon && (
        <span className="student-profile-detail-icon">
          {icon}
        </span>
      )}

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
};

export default Students;
