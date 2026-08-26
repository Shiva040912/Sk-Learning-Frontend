import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import {
  FiCalendar,
  FiCheckCircle,
  FiLock,
  FiShield,
  FiUser,
  FiBookOpen,
  FiClock,
  FiHash,
} from "react-icons/fi";

import api from "../services/axios";

import logo from "../assets/sk-logo.png";
import gpayLogo from "../assets/Gpay.png";
import phonePeLogo from "../assets/phonepay.png";
import paytmLogo from "../assets/paytm.PNG";

import "../styles/payfees.css";

const PayFees = () => {
  const { studentId } = useParams();
  const location = useLocation();

  const cleanStudentId = String(studentId || "")
    .replace(/\{\{1\}\}/g, "")
    .split("?")[0]
    .trim();

  const source = useMemo(() => {
    const params = new URLSearchParams(location.search);

    return String(params.get("source") || "direct")
      .trim()
      .toLowerCase();
  }, [location.search]);

  const [paymentData, setPaymentData] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingApp, setOpeningApp] = useState("");

  useEffect(() => {
    const loadPaymentDetails = async () => {
      if (!cleanStudentId) {
        setError("Invalid payment link");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/payments/public/student/${cleanStudentId}`,
        );

        setPaymentData(response.data);
      } catch (err) {
        console.error(
          "Public payment details error:",
          err?.response?.data || err,
        );

        setError(
          err?.response?.data?.message ||
            "Unable to load payment details",
        );
      } finally {
        setLoading(false);
      }
    };

    loadPaymentDetails();
  }, [cleanStudentId]);

  const student = paymentData?.student || {};
  const payment = paymentData?.payment || {};

  const paymentCompleted =
    String(student.paymentStatus || "").toLowerCase() ===
    "paid";

  const pendingAmount = Number(
    student.paymentAmount || 0,
  );

  const formattedDueDate = useMemo(() => {
    if (!payment.feeDueDate) {
      return "-";
    }

    const date = new Date(payment.feeDueDate);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [payment.feeDueDate]);

  const handleAmountChange = (event) => {
    const value = event.target.value;

    if (value === "") {
      setAmount("");
      setError("");
      return;
    }

    if (!/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }

    setAmount(value);
    setError("");
  };

  const validatePayment = () => {
    const enteredAmount = Number(amount);

    if (!amount.trim()) {
      setError(
        "Please enter the amount you want to pay.",
      );
      return false;
    }

    if (
      !Number.isFinite(enteredAmount) ||
      enteredAmount <= 0
    ) {
      setError(
        "Please enter a valid payment amount.",
      );
      return false;
    }

    if (
      pendingAmount > 0 &&
      enteredAmount > pendingAmount
    ) {
      setError(
        `Amount cannot be greater than ₹${pendingAmount.toLocaleString(
          "en-IN",
        )}.`,
      );

      return false;
    }

    if (!payment.upiId) {
      setError(
        "UPI payment is currently unavailable. Please contact The SK Learnings.",
      );

      return false;
    }

    if (!payment.receiverName) {
      setError(
        "Payment receiver details are not configured.",
      );

      return false;
    }

    setError("");
    return true;
  };

  const getUpiQuery = () => {
    const enteredAmount = Number(amount);

    const params = new URLSearchParams();

    params.set("pa", payment.upiId);
    params.set("pn", payment.receiverName);
    params.set("am", enteredAmount.toFixed(2));
    params.set("cu", "INR");

    params.set(
      "tn",
      `SK Learnings Fee - ${
        student.studentName ||
        student.rollNo ||
        "Student"
      }${
        source === "reminder"
          ? " - Reminder"
          : ""
      }`,
    );

    return params.toString();
  };

  const openPaymentApp = (method) => {
    if (!validatePayment()) {
      return;
    }

    setOpeningApp(method);

    const query = getUpiQuery();

    let url = "";

    if (method === "gpay") {
      url = `tez://upi/pay?${query}`;
    }

    if (method === "phonepe") {
      url = `phonepe://pay?${query}`;
    }

    if (method === "paytm") {
      url = `paytmmp://pay?${query}`;
    }

    if (!url) {
      setOpeningApp("");
      return;
    }

    window.location.href = url;

    setTimeout(() => {
      setOpeningApp("");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="pay-state-page">
        <img
          src={logo}
          alt="SK Learnings"
        />

        <div className="pay-loader" />

        <strong>
          Loading payment details
        </strong>

        <span>
          Please wait...
        </span>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="pay-state-page">
        <div className="pay-error-icon">
          <FiShield />
        </div>

        <strong>
          Payment Link Unavailable
        </strong>

        <span>
          {error ||
            "Unable to load payment details."}
        </span>
      </div>
    );
  }

  return (
    <div className="payment-page">
      {/* HEADER */}

      <header className="payment-header">
        <div className="payment-brand">
          <img
            src={logo}
            alt="The SK Learnings"
          />

          <div className="payment-brand-text">
            <strong>
              THE SK LEARNINGS
            </strong>

            <span>
              Private Educational Services
            </span>
          </div>
        </div>

        <div className="header-secure">
          <FiLock />

          <span>Secure</span>
        </div>
      </header>

      {/* MAIN */}

      <main className="payment-container">
        {/* STUDENT DETAILS */}

        <section className="student-card">
          <div className="student-card-top">
            <div>
              <span className="section-tag">
                PAYMENT FOR
              </span>

              <h1>
                {student.studentName || "-"}
              </h1>
            </div>

            {source === "reminder" && (
              <span className="reminder-tag">
                Fee Reminder
              </span>
            )}
          </div>

          <div className="student-details-row">
            <div className="student-detail">
              <FiHash />

              <div>
                <span>Roll No</span>

                <strong>
                  {student.rollNo || "-"}
                </strong>
              </div>
            </div>

            <div className="student-detail">
              <FiBookOpen />

              <div>
                <span>Course</span>

                <strong>
                  {student.course || "-"}
                </strong>
              </div>
            </div>

            <div className="student-detail">
              <FiClock />

              <div>
                <span>Batch</span>

                <strong>
                  {student.batch || "-"}
                </strong>
              </div>
            </div>

            <div className="student-detail">
              <FiCalendar />

              <div>
                <span>Due Date</span>

                <strong>
                  {formattedDueDate}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {paymentCompleted ? (
          <section className="payment-completed">
            <div className="completed-icon">
              <FiCheckCircle />
            </div>

            <div>
              <strong>
                Payment Completed
              </strong>

              <span>
                No further fee payment is required.
              </span>
            </div>
          </section>
        ) : (
          <>
            {/* PAYMENT */}

            <section className="payment-card">
              <div className="payment-card-title">
                <div>
                  <span className="section-tag">
                    PAYMENT METHOD
                  </span>

                  <h2>
                    Pay using UPI
                  </h2>
                </div>

                <FiShield />
              </div>

              {/* AMOUNT */}

              <div className="amount-box">
                <div className="rupee-box">
                  ₹
                </div>

                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  placeholder="Enter amount"
                  onChange={handleAmountChange}
                  autoComplete="off"
                />

                {pendingAmount > 0 && (
                  <button
                    type="button"
                    className="full-button"
                    onClick={() => {
                      setAmount(
                        String(pendingAmount),
                      );

                      setError("");
                    }}
                  >
                    FULL
                  </button>
                )}
              </div>

              {error && (
                <div className="payment-error">
                  {error}
                </div>
              )}

              {/* QR + APPS */}

              <div className="payment-options">
                {/* QR */}

                <div className="qr-column">
                  <span className="payment-small-title">
                    SCAN &amp; PAY
                  </span>

                  {payment.upiQrImage ? (
                    <div className="qr-box">
                      <img
                        src={payment.upiQrImage}
                        alt="SK Learnings Payment QR"
                      />
                    </div>
                  ) : (
                    <div className="qr-empty">
                      <FiShield />

                      <span>
                        QR unavailable
                      </span>
                    </div>
                  )}
                </div>

                {/* APPS */}

                <div className="upi-column">
                  <span className="payment-small-title">
                    PAY WITH APP
                  </span>

                  <div className="upi-buttons">
                    <button
                      type="button"
                      className="upi-button"
                      aria-label="Google Pay"
                      onClick={() =>
                        openPaymentApp("gpay")
                      }
                    >
                      <img
                        src={gpayLogo}
                        alt="Google Pay"
                      />

                      {openingApp ===
                        "gpay" && (
                        <span className="opening-dot">
                          ...
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      className="upi-button"
                      aria-label="PhonePe"
                      onClick={() =>
                        openPaymentApp(
                          "phonepe",
                        )
                      }
                    >
                      <img
                        src={phonePeLogo}
                        alt="PhonePe"
                      />

                      {openingApp ===
                        "phonepe" && (
                        <span className="opening-dot">
                          ...
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      className="upi-button"
                      aria-label="Paytm"
                      onClick={() =>
                        openPaymentApp("paytm")
                      }
                    >
                      <img
                        src={paytmLogo}
                        alt="Paytm"
                      />

                      {openingApp ===
                        "paytm" && (
                        <span className="opening-dot">
                          ...
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* RECEIVER */}

            <section className="receiver-card">
              <div className="receiver-heading">
                <FiUser />

                <span>
                  PAYMENT RECEIVER
                </span>
              </div>

              <div className="receiver-grid">
                <div>
                  <span>Name</span>

                  <strong>
                    {payment.receiverName ||
                      "Not configured"}
                  </strong>
                </div>

                <div>
                  <span>UPI ID</span>

                  <strong>
                    {payment.upiId ||
                      "Not configured"}
                  </strong>
                </div>

                <div>
                  <span>Number</span>

                  <strong>
                    {payment.paymentPhone ||
                      "Not configured"}
                  </strong>
                </div>
              </div>
            </section>
          </>
        )}

        {/* SECURITY */}

        <section className="security-strip">
          <div>
            <FiShield />

            <span>
              Secure UPI Payment
            </span>
          </div>

          <i />

          <div>
            <FiLock />

            <span>
              Protected Transaction
            </span>
          </div>
        </section>

        {/* FOOTER */}

        <footer className="payment-footer">
          THE SK LEARNINGS
        </footer>
      </main>
    </div>
  );
};

export default PayFees;