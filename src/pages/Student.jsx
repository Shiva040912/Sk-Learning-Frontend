import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiEye,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
  FiUsers,
  FiBookOpen,
  FiDollarSign,
  FiClock,
  FiPhone,
  FiMail,
  FiUser,
  FiMapPin,
  FiCreditCard,
} from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";
import toast from "react-hot-toast";

import api from "../services/axios";
import "../styles/students.css";
import logo from "../assets/sk-logo.png";

const initialForm = {
  studentName: "",
  parentName: "",
  phone: "",
  alternatePhone: "",
  email: "",
  course: "",
  idproof: "",
  batch: "",
  schoolName: "",
  address: "",
  totalFee: "",
};

const Students = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] =
    useState("all");

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

  useEffect(() => {
    fetchStudents();
  }, []);

  const courses = useMemo(() => {
    const courseList = students
      .map((student) => student.course)
      .filter(Boolean);

    return [...new Set(courseList)];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !keyword ||
        student.studentName
          ?.toLowerCase()
          .includes(keyword) ||
        student.parentName
          ?.toLowerCase()
          .includes(keyword) ||
        student.phone?.includes(
          search.trim()
        ) ||
        student.course
          ?.toLowerCase()
          .includes(keyword) ||
        student.batch
          ?.toLowerCase()
          .includes(keyword);

      const matchesCourse =
        courseFilter === "all" ||
        student.course === courseFilter;

      return matchesSearch && matchesCourse;
    });
  }, [students, search, courseFilter]);

  const summary = useMemo(() => {
    return students.reduce(
      (result, student) => {
        result.totalStudents += 1;

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
        totalFees: 0,
        totalPaid: 0,
        totalPending: 0,
      }
    );
  }, [students]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData(initialForm);
    setShowFormModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);

    setFormData({
      studentName:
        student.studentName || "",
      parentName:
        student.parentName || "",
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
      totalFee:
        student.totalFee ?? "",
    });

    setShowFormModal(true);
  };

  const openViewModal = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const openDeleteModal = (student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingStudent(null);
    setFormData(initialForm);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedStudent(null);
  };

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.studentName.trim()) {
      toast.error(
        "Student name is required"
      );
      return false;
    }

    if (!formData.parentName.trim()) {
      toast.error(
        "Parent name is required"
      );
      return false;
    }

    if (
      !/^\d{10}$/.test(
        formData.phone.trim()
      )
    ) {
      toast.error(
        "Enter valid 10 digit phone number"
      );
      return false;
    }

    if (
      formData.alternatePhone &&
      !/^\d{10}$/.test(
        formData.alternatePhone.trim()
      )
    ) {
      toast.error(
        "Enter valid alternate phone number"
      );
      return false;
    }

    if (!formData.course.trim()) {
      toast.error("Course is required");
      return false;
    }

    if (!formData.idproof.trim()) {
      toast.error("ID proof is required");
      return false;
    }

    if (
      formData.totalFee === "" ||
      Number(formData.totalFee) < 0
    ) {
      toast.error(
        "Enter valid total fee"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload = {
      studentName:
        formData.studentName.trim(),

      parentName:
        formData.parentName.trim(),

      phone:
        formData.phone.trim(),

      alternatePhone:
        formData.alternatePhone.trim() ||
        undefined,

      email:
        formData.email.trim() ||
        undefined,

      course:
        formData.course.trim(),

      idproof:
        formData.idproof.trim(),

      batch:
        formData.batch.trim() ||
        undefined,

      schoolName:
        formData.schoolName.trim() ||
        undefined,

      address:
        formData.address.trim() ||
        undefined,

      totalFee:
        Number(formData.totalFee),
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
        await api.post(
          "/students",
          payload
        );

        toast.success(
          "Student added successfully"
        );
      }

      closeFormModal();

      await fetchStudents();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to save student"
      );
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

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString(
      "en-IN"
    );

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
      {/* HEADER */}

      <div className="students-header">
        <div className="students-heading">
          <span className="students-eyebrow">
            STUDENT MANAGEMENT
          </span>

          <h1>Students</h1>

          <p>
            Manage student profiles,
            courses and fee information
          </p>
        </div>

        <button
          className="add-student-btn"
          onClick={openAddModal}
        >
          <FiPlus />

          <span>Add Student</span>
        </button>
      </div>

      {/* SUMMARY */}

      <div className="student-summary-grid">
        <div className="student-summary-card">
          <div className="summary-icon">
            <FiUsers />
          </div>

          <div className="summary-content">
            <span>
              Total Students
            </span>

            <strong>
              {summary.totalStudents}
            </strong>

            <small>
              Registered students
            </small>
          </div>
        </div>

        <div className="student-summary-card">
          <div className="summary-icon">
            <FiBookOpen />
          </div>

          <div className="summary-content">
            <span>Courses</span>

            <strong>
              {courses.length}
            </strong>

            <small>
              Active course categories
            </small>
          </div>
        </div>

        <div className="student-summary-card paid-summary">
          <div className="summary-icon">
            <FiDollarSign />
          </div>

          <div className="summary-content">
            <span>
              Fees Collected
            </span>

            <strong>
              ₹
              {formatMoney(
                summary.totalPaid
              )}
            </strong>

            <small>
              Total ₹
              {formatMoney(
                summary.totalFees
              )}
            </small>
          </div>
        </div>

        <div className="student-summary-card pending-summary">
          <div className="summary-icon">
            <FiClock />
          </div>

          <div className="summary-content">
            <span>
              Pending Fees
            </span>

            <strong>
              ₹
              {formatMoney(
                summary.totalPending
              )}
            </strong>

            <small>
              Amount yet to collect
            </small>
          </div>
        </div>
      </div>

      {/* DIRECTORY */}

      <section className="students-list-section">
        <div className="students-list-header">
          <div>
            <h2>
              Student Directory
            </h2>

            <p>
              View and manage all
              registered students
            </p>
          </div>

          <span className="student-result-count">
            {filteredStudents.length}{" "}
            Records
          </span>
        </div>

        <div className="students-toolbar">
          <div className="student-search">
            <FiSearch />

            <input
              type="text"
              placeholder="Search name, phone, course or batch..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            className="course-filter"
            value={courseFilter}
            onChange={(event) =>
              setCourseFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              All Courses
            </option>

            {courses.map(
              (course) => (
                <option
                  key={course}
                  value={course}
                >
                  {course}
                </option>
              )
            )}
          </select>
        </div>

        {/* TABLE */}

        <div className="students-table-card">
          {isLoading ? (
            <div className="students-message">
              <div className="loading-circle" />

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
                    <th>Student</th>
                    <th>Course</th>
                    <th>Phone</th>
                    <th>Total Fee</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student) => (
                      <tr
                        key={student._id}
                      >
                        <td>
                          <div className="student-profile-cell">
                            <div className="student-avatar">
                              {student.studentName
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "S"}
                            </div>

                            <div className="student-name-cell">
                              <strong>
                                {
                                  student.studentName
                                }
                              </strong>

                              <span>
                                Parent:{" "}
                                {
                                  student.parentName
                                }
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="course-badge">
                            {
                              student.course
                            }
                          </span>
                        </td>

                        <td>
                          {student.phone}
                        </td>

                        <td>
                          ₹
                          {formatMoney(
                            student.totalFee
                          )}
                        </td>

                        <td>
                          <span className="paid-amount">
                            ₹
                            {formatMoney(
                              student.paidAmount
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="pending-amount">
                            ₹
                            {formatMoney(
                              student.pendingAmount
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`payment-status ${
                              student.paymentStatus ||
                              "pending"
                            }`}
                          >
                            {student.paymentStatus ||
                              "pending"}
                          </span>
                        </td>

                        <td>
                          <div className="student-actions">
                            <button
                              type="button"
                              title="View Student"
                              onClick={() =>
                                openViewModal(
                                  student
                                )
                              }
                            >
                              <FiEye />
                            </button>

                            <button
                              type="button"
                              title="Edit Student"
                              onClick={() =>
                                openEditModal(
                                  student
                                )
                              }
                            >
                              <FiEdit2 />
                            </button>

                            <button
                              type="button"
                              title="Delete Student"
                              className="delete-btn"
                              onClick={() =>
                                openDeleteModal(
                                  student
                                )
                              }
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ADD / EDIT MODAL */}

      {showFormModal && (
        <div className="student-modal-overlay">
          <div className="student-modal form-modal">
            <div className="student-modal-header">
              <div className="modal-heading-content">
                <span className="modal-icon">
                  <FiUser />
                </span>

                <div>
                  <h2>
                    {editingStudent
                      ? "Edit Student"
                      : "Add Student"}
                  </h2>

                  <p>
                    {editingStudent
                      ? "Update student information"
                      : "Enter student information to create a new record"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeFormModal}
              >
                <FiX />
              </button>
            </div>

            <form
              className="student-form"
              onSubmit={handleSubmit}
            >
              <div className="student-form-section-title">
                Personal Information
              </div>

              <div className="form-grid">
                <div className="student-form-group">
                  <label>
                    Student Name *
                  </label>

                  <input
                    name="studentName"
                    value={
                      formData.studentName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter student name"
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    Parent Name *
                  </label>

                  <input
                    name="parentName"
                    value={
                      formData.parentName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter parent name"
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    Phone Number *
                  </label>

                  <input
                    name="phone"
                    maxLength="10"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="10 digit phone number"
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    Alternate Phone
                  </label>

                  <input
                    name="alternatePhone"
                    maxLength="10"
                    value={
                      formData.alternatePhone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Alternate phone number"
                  />
                </div>

                <div className="student-form-group full-width">
                  <label>
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="student@email.com"
                  />
                </div>
              </div>

              <div className="student-form-section-title">
                Academic Information
              </div>

              <div className="form-grid">
                <div className="student-form-group">
                  <label>
                    Course *
                  </label>

                  <select
                    name="course"
                    value={
                      formData.course
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="">
                      Select course
                    </option>

                    <option value="NEET">
                      NEET
                    </option>

                    <option value="JEE">
                      JEE
                    </option>

                    <option value="FOUNDATION">
                      FOUNDATION
                    </option>

                    <option value="JUNIOR IAS">
                      JUNIOR IAS
                    </option>
                  </select>
                </div>

                <div className="student-form-group">
                  <label>Batch</label>

                  <input
                    name="batch"
                    value={
                      formData.batch
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Morning / Evening"
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    School Name
                  </label>

                  <input
                    name="schoolName"
                    value={
                      formData.schoolName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter school name"
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    ID Proof *
                  </label>

                  <input
                    name="idproof"
                    value={
                      formData.idproof
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Aadhar / ID proof"
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    Total Fee *
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="totalFee"
                    value={
                      formData.totalFee
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter total fee"
                  />
                </div>

                <div className="student-form-group full-width">
                  <label>
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={
                      formData.address
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter student address"
                    rows="3"
                  />
                </div>
              </div>

              <div className="student-form-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={
                    closeFormModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={
                    isSaving
                  }
                >
                  {isSaving
                    ? "Saving..."
                    : editingStudent
                      ? "Update Student"
                      : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================
          STUDENT ID VIEW - NO SCROLL
      ============================================== */}

      {showViewModal &&
        selectedStudent && (
          <div className="student-modal-overlay student-id-overlay">
            <div className="student-id-modal">
              <button
                type="button"
                className="student-id-close"
                onClick={
                  closeViewModal
                }
              >
                <FiX />
              </button>

              <div className="student-id-card">
                {/* TOP */}

                <div className="student-id-top">
                  <div className="student-id-brand">
                    <img
                      src={logo}
                      alt="SK Learnings"
                    />

                    <div>
                      <h3>
                        THE SK LEARNINGS
                      </h3>

                      <p>
                        PRIVATE EDUCATIONAL
                        SERVICES
                      </p>
                    </div>
                  </div>

                  <div className="student-id-document">
                    <FaGraduationCap />

                    <span>
                      STUDENT IDENTITY
                    </span>
                  </div>
                </div>

                {/* PROFILE */}

                <div className="student-id-profile-row">
                  <div className="student-id-photo-wrap">
                    <div className="student-id-photo">
                      {selectedStudent.studentName
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "S"}
                    </div>

                    <span>
                      <i />
                      Active Student
                    </span>
                  </div>

                  <div className="student-id-main-info">
                    <small>
                      STUDENT NAME
                    </small>

                    <h2>
                      {
                        selectedStudent.studentName
                      }
                    </h2>

                    <div className="student-id-course-row">
                      <span>
                        <FiBookOpen />
                        {
                          selectedStudent.course
                        }
                      </span>

                      <span>
                        <FiUsers />
                        {selectedStudent.batch ||
                          "No Batch"}
                      </span>
                    </div>

                    <div className="student-id-number">
                      <span>
                        STUDENT ID
                      </span>

                      <strong>
                        {getStudentId(
                          selectedStudent
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* DETAILS */}

                <div className="student-id-details-grid">
                  <IdDetail
                    icon={<FiUser />}
                    label="Parent Name"
                    value={
                      selectedStudent.parentName
                    }
                  />

                  <IdDetail
                    icon={<FiPhone />}
                    label="Phone Number"
                    value={
                      selectedStudent.phone
                    }
                  />

                  <IdDetail
                    icon={<FiPhone />}
                    label="Alternate Phone"
                    value={
                      selectedStudent.alternatePhone ||
                      "-"
                    }
                  />

                  <IdDetail
                    icon={<FiMail />}
                    label="Email Address"
                    value={
                      selectedStudent.email ||
                      "-"
                    }
                  />

                  <IdDetail
                    icon={
                      <FiBookOpen />
                    }
                    label="School"
                    value={
                      selectedStudent.schoolName ||
                      "-"
                    }
                  />

                  <IdDetail
                    icon={
                      <FiCreditCard />
                    }
                    label="ID Proof"
                    value={
                      selectedStudent.idproof ||
                      "-"
                    }
                  />
                </div>

                {/* FEES */}

                <div className="student-id-fees">
                  <div>
                    <span>
                      Total Fee
                    </span>

                    <strong>
                      ₹
                      {formatMoney(
                        selectedStudent.totalFee
                      )}
                    </strong>
                  </div>

                  <div className="fee-paid">
                    <span>
                      Paid
                    </span>

                    <strong>
                      ₹
                      {formatMoney(
                        selectedStudent.paidAmount
                      )}
                    </strong>
                  </div>

                  <div className="fee-pending">
                    <span>
                      Pending
                    </span>

                    <strong>
                      ₹
                      {formatMoney(
                        selectedStudent.pendingAmount
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong
                      className={`student-id-payment ${
                        selectedStudent.paymentStatus ||
                        "pending"
                      }`}
                    >
                      {selectedStudent.paymentStatus ||
                        "pending"}
                    </strong>
                  </div>
                </div>

                {/* ADDRESS */}

                <div className="student-id-address">
                  <FiMapPin />

                  <div>
                    <span>
                      Residential Address
                    </span>

                    <p>
                      {selectedStudent.address ||
                        "-"}
                    </p>
                  </div>
                </div>

                {/* FOOTER */}

                <div className="student-id-footer">
                  <span>
                    MEDICAL • ENGINEERING •
                    FOUNDATIONS • JUNIOR IAS
                  </span>

                  <strong>
                    THE SK LEARNINGS
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* DELETE */}

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
                    selectedStudent.studentName
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

const IdDetail = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="student-id-detail">
      <div className="student-id-detail-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
};

export default Students;