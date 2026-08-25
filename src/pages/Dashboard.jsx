import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  FiArrowRight,
  FiCreditCard,
  FiPause,
  FiPlay,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";

import api from "../services/axios";

import "../styles/dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    isTickerPaused,
    setIsTickerPaused,
  ] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/dashboard/summary"
        );

      setDashboard(response.data);
    } catch (err) {
      console.error(
        "Dashboard error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value || 0)
    );
  };

  const courseData = useMemo(
    () =>
      dashboard?.courseWiseStudents ||
      [],
    [dashboard]
  );

  const studentDetailsData = useMemo(
    () =>
      dashboard?.studentDetails || dashboard?.feeStatus || [],
    [dashboard]
  );


  const handleCourseClick = (
    data
  ) => {
    const course =
      data?.activePayload?.[0]
        ?.payload?.course;

    if (!course) {
      return;
    }

    navigate(
      `/students?course=${encodeURIComponent(
        course
      )}`
    );
  };

  const handleStudentClick = (
    student
  ) => {
    navigate(
      `/payments?studentId=${student.studentId}`
    );
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-state">
          <div className="dashboard-spinner" />

          <span>
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-state dashboard-error-state">
          <p>{error}</p>

          <button
            type="button"
            onClick={loadDashboard}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-summary-grid">
        <button
          type="button"
          className="dashboard-summary-card"
          onClick={() =>
            navigate("/students")
          }
        >
          <span className="dashboard-summary-icon">
            <FiUsers />
          </span>

          <span className="dashboard-summary-info">
            <small>
              TOTAL STUDENTS
            </small>

            <strong>
              {dashboard?.totalStudents ||
                0}
            </strong>

            <span>
              Registered students
            </span>
          </span>

          <FiArrowRight className="dashboard-summary-arrow" />
        </button>

        <button
          type="button"
          className="dashboard-summary-card"
          onClick={() =>
            navigate(
              "/payments?period=current-month"
            )
          }
        >
          <span className="dashboard-summary-icon">
            <FiTrendingUp />
          </span>

          <span className="dashboard-summary-info">
            <small>
              THIS MONTH COLLECTION
            </small>

            <strong>
              {formatCurrency(
                dashboard?.thisMonthCollection
              )}
            </strong>

            <span>
              Payments received
            </span>
          </span>

          <FiArrowRight className="dashboard-summary-arrow" />
        </button>

        <button
          type="button"
          className="dashboard-summary-card"
          onClick={() =>
            navigate(
              "/payments?status=pending"
            )
          }
        >
          <span className="dashboard-summary-icon">
            <FiCreditCard />
          </span>

          <span className="dashboard-summary-info">
            <small>
              TOTAL PENDING
            </small>

            <strong>
              {formatCurrency(
                dashboard?.totalPending
              )}
            </strong>

            <span>
              Outstanding fees
            </span>
          </span>

          <FiArrowRight className="dashboard-summary-arrow" />
        </button>
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>
                Course-wise Students
              </h2>

              <p>
                Student distribution by
                course
              </p>
            </div>

            <button
              type="button"
              className="dashboard-view-button"
              onClick={() =>
                navigate("/students")
              }
            >
              View Students
              <FiArrowRight />
            </button>
          </div>

          <div className="dashboard-chart-area">
            {courseData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={courseData}
                  margin={{
                    top: 5,
                    right: 8,
                    left: -20,
                    bottom: 0,
                  }}
                  onClick={
                    handleCourseClick
                  }
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="course"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />

                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    formatter={(
                      value
                    ) => [
                      `${value} Students`,
                      "Students",
                    ]}
                    cursor={{
                      fill: "rgba(255, 184, 0, 0.04)",
                    }}
                    contentStyle={{
                      borderRadius:
                        "8px",
                      border:
                        "1px solid #e1e5eb",
                      fontSize:
                        "11px",
                    }}
                  />

                  <Bar
                    dataKey="count"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                    maxBarSize={42}
                    cursor="pointer"
                  >
                    {courseData.map(
                      (
                        item,
                        index
                      ) => (
                        <Cell
                          key={`${item.course}-${index}`}
                          className="dashboard-chart-bar"
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="dashboard-empty">
                No course data available
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-panel dashboard-fee-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>
                Student Details
              </h2>

              <p>
                Student name, roll number
                and course
              </p>
            </div>

            <button
              type="button"
              className="dashboard-pause-button"
              onClick={() =>
                setIsTickerPaused(
                  (current) =>
                    !current
                )
              }
            >
              {isTickerPaused ? (
                <FiPlay />
              ) : (
                <FiPause />
              )}

              <span>
                {isTickerPaused
                  ? "Resume"
                  : "Pause"}
              </span>
            </button>
          </div>


          <div className="dashboard-fee-header">
            <span>STUDENT</span>
            <span>ROLL NO</span>
            <span>COURSE</span>
          </div>

          <div className="dashboard-ticker-window">
            {studentDetailsData.length >
            0 ? (
              <div
                className={`dashboard-ticker-track ${
                  isTickerPaused
                    ? "paused"
                    : ""
                }`}
              >
                {[
                  ...studentDetailsData,
                  ...studentDetailsData,
                ].map(
                  (
                    student,
                    index
                  ) => (
                    <button
                      type="button"
                      className="dashboard-fee-row"
                      key={`${student.studentId}-${index}`}
                      onClick={() =>
                        handleStudentClick(
                          student
                        )
                      }
                    >
                      <span className="dashboard-student-cell">
                        <span className="dashboard-student-avatar">
                          {student.studentName
                            ?.charAt(
                              0
                            )
                            ?.toUpperCase() ||
                            "S"}
                        </span>

                        <span className="dashboard-student-text">
                          <strong>
                            {
                              student.studentName
                            }
                          </strong>

                          <small>
                            {
                              student.course
                            }
                          </small>
                        </span>
                      </span>

                      <span className="dashboard-roll">
                        {
                          student.rollNo
                        }
                      </span>

                      <span className="dashboard-course">
                        {student.course || "-"}
                      </span>
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className="dashboard-empty">
                No student details available
              </div>
            )}
          </div>

          <button
            type="button"
            className="dashboard-payment-link"
            onClick={() =>
              navigate("/payments")
            }
          >
            <span>
              View student details
            </span>

            <FiArrowRight />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;