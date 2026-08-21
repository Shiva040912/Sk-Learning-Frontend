import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiLock,
  FiShield,
} from "react-icons/fi";

import api from "../services/axios";

import logo from "../assets/sk-logo.png";
import gpayLogo from "../assets/Gpay.png";
import phonePeLogo from "../assets/phonepay.png";
import paytmLogo from "../assets/paytm.PNG";

import "../styles/payfees.css";

const PayFees = () => {
  const { studentId } = useParams();

  const cleanStudentId = String(
    studentId || "",
  )
    .replace(/\{\{1\}\}/g, "")
    .trim();

  const [paymentData, setPaymentData] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingApp, setOpeningApp] = useState("");

  /*
   * ======================================================
   * LOAD PUBLIC STUDENT PAYMENT DETAILS
   * ======================================================
   */

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

  /*
   * ======================================================
   * DATA
   * ======================================================
   */

  const student = paymentData?.student || {};
  const payment = paymentData?.payment || {};

  const paymentCompleted =
    String(
      student.paymentStatus || "",
    ).toLowerCase() === "paid";

  const pendingAmount = Number(
    student.paymentAmount || 0,
  );

  /*
   * ======================================================
   * DUE DATE
   * ======================================================
   */

  const formattedDueDate = useMemo(() => {
    if (!payment.feeDueDate) {
      return "-";
    }

    const date = new Date(
      payment.feeDueDate,
    );

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  }, [payment.feeDueDate]);

  /*
   * ======================================================
   * AMOUNT INPUT
   * ======================================================
   */

  const handleAmountChange = (event) => {
    const value = event.target.value;

    if (value === "") {
      setAmount("");
      setError("");
      return;
    }

    /*
     * Only number + maximum 2 decimals
     */
    if (!/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }

    setAmount(value);
    setError("");
  };

  /*
   * ======================================================
   * VALIDATE PAYMENT
   * ======================================================
   */

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

    /*
     * Prevent over payment when pending
     * amount is available.
     */

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

  /*
   * ======================================================
   * CREATE UPI PARAMETERS
   * ======================================================
   */

  const getUpiQuery = () => {
    const enteredAmount = Number(
      amount,
    );

    const params = new URLSearchParams();

    params.set(
      "pa",
      payment.upiId,
    );

    params.set(
      "pn",
      payment.receiverName,
    );

    params.set(
      "am",
      enteredAmount.toFixed(2),
    );

    params.set(
      "cu",
      "INR",
    );

    params.set(
      "tn",
      `SK Learnings Fee - ${
        student.studentName ||
        student.rollNo ||
        "Student"
      }`,
    );

    return params.toString();
  };

  /*
   * ======================================================
   * OPEN UPI APP
   * ======================================================
   */

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

  /*
   * ======================================================
   * LOADING
   * ======================================================
   */

  if (loading) {
    return (
      <div className="public-payment-page">
        <div className="payment-loading">
          <img
            src={logo}
            alt="SK Learnings"
          />

          <div className="payment-loader" />

          <strong>
            Loading payment details
          </strong>

          <span>
            Please wait...
          </span>
        </div>
      </div>
    );
  }

  /*
   * ======================================================
   * ERROR
   * ======================================================
   */

  if (!paymentData) {
    return (
      <div className="public-payment-page">
        <div className="payment-error-page">
          <div className="payment-error-icon">
            <FiShield />
          </div>

          <h2>
            Payment Link Unavailable
          </h2>

          <p>
            {error ||
              "Unable to load payment details."}
          </p>
        </div>
      </div>
    );
  }

  /*
   * ======================================================
   * PAGE
   * ======================================================
   */

  return (
    <div className="public-payment-page">
      {/* HEADER */}

      <header className="public-payment-header">
        <div className="public-brand">
          <img
            src={logo}
            alt="The SK Learnings"
          />

          <div className="public-brand-text">
            <strong>
              THE SK LEARNINGS
            </strong>

            <span>
              Private Educational Services
            </span>
          </div>
        </div>

        <div className="secure-badge">
          <FiLock />

          <span>
            Secure
          </span>
        </div>
      </header>

      {/* CONTENT */}

      <main className="public-payment-content">
        {/* INTRO */}

        <section className="payment-intro">
          <span className="payment-eyebrow">
            FEE PAYMENT
          </span>

          <h1>
            {paymentCompleted
              ? "Payment Completed"
              : "Complete Payment"}
          </h1>

          <p>
            {paymentCompleted
              ? "The fee payment for this student has already been completed."
              : "Verify the student details and continue using your preferred UPI app or scan the payment QR."}
          </p>
        </section>

        {/* STUDENT DETAILS */}

        <section className="student-payment-card">
          <div className="student-payment-heading">
            <div>
              <span>
                PAYMENT FOR
              </span>

              <h2>
                {student.studentName ||
                  "-"}
              </h2>
            </div>

            <div className="student-payment-icon">
              <FiCreditCard />
            </div>
          </div>

          <div className="student-info-grid">
            <div className="student-info-item">
              <span>
                Roll Number
              </span>

              <strong>
                {student.rollNo ||
                  "-"}
              </strong>
            </div>

            <div className="student-info-item">
              <span>
                Course
              </span>

              <strong>
                {student.course ||
                  "-"}
              </strong>
            </div>

            <div className="student-info-item">
              <span>
                Batch
              </span>

              <strong>
                {student.batch ||
                  "-"}
              </strong>
            </div>

            <div className="student-info-item">
              <span>
                Due Date
              </span>

              <strong className="student-due-date">
                <FiCalendar />

                {formattedDueDate}
              </strong>
            </div>
          </div>
        </section>

        {/* ALREADY PAID */}

        {paymentCompleted ? (
          <section className="payment-completed">
            <div className="completed-icon">
              <FiCheckCircle />
            </div>

            <h2>
              Payment Completed
            </h2>

            <p>
              No further fee payment is
              required for this student.
            </p>

            <div className="completed-student">
              <span>
                Student
              </span>

              <strong>
                {student.studentName}
              </strong>
            </div>
          </section>
        ) : (
          <>
            {/* PAYMENT SECTION */}

            <section className="upi-payment-card">
              <div className="upi-card-heading">
                <div>
                  <span>
                    PAYMENT METHOD
                  </span>

                  <h2>
                    Pay using UPI
                  </h2>
                </div>

                <FiShield />
              </div>

              {/* AMOUNT */}

              <div className="amount-section">
                <label
                  htmlFor="paymentAmount"
                >
                  Enter Amount
                </label>

                <div className="amount-input-wrapper">
                  <span>
                    ₹
                  </span>

                  <input
                    id="paymentAmount"
                    type="text"
                    inputMode="decimal"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={
                      handleAmountChange
                    }
                    autoComplete="off"
                  />
                </div>

                <p>
                  Enter the amount you
                  want to pay now.
                </p>
              </div>

              {/* ERROR */}

              {error && (
                <div className="payment-inline-error">
                  {error}
                </div>
              )}

              {/* UPI APPS */}

              <div className="upi-app-buttons">
                <button
                  type="button"
                  className="upi-app-button"
                  onClick={() =>
                    openPaymentApp(
                      "gpay",
                    )
                  }
                >
                  <img
                    src={gpayLogo}
                    alt="Google Pay"
                  />

                  {openingApp ===
                    "gpay" && (
                    <small>
                      Opening...
                    </small>
                  )}
                </button>

                <button
                  type="button"
                  className="upi-app-button"
                  onClick={() =>
                    openPaymentApp(
                      "phonepe",
                    )
                  }
                >
                  <img
                    src={
                      phonePeLogo
                    }
                    alt="PhonePe"
                  />

                  {openingApp ===
                    "phonepe" && (
                    <small>
                      Opening...
                    </small>
                  )}
                </button>

                <button
                  type="button"
                  className="upi-app-button"
                  onClick={() =>
                    openPaymentApp(
                      "paytm",
                    )
                  }
                >
                  <img
                    src={paytmLogo}
                    alt="Paytm"
                  />

                  {openingApp ===
                    "paytm" && (
                    <small>
                      Opening...
                    </small>
                  )}
                </button>
              </div>

              {/* DIVIDER */}

              <div className="scan-divider">
                <span />

                <strong>
                  OR SCAN &amp; PAY
                </strong>

                <span />
              </div>

              {/* QR */}

              <div className="qr-payment-section">
                <h3>
                  Scan using any UPI app
                </h3>

                {payment.upiQrImage ? (
                  <div className="payment-qr-box">
                    <img
                      src={
                        payment.upiQrImage
                      }
                      alt="SK Learnings Payment QR"
                    />
                  </div>
                ) : (
                  <div className="payment-qr-empty">
                    <FiCreditCard />

                    <strong>
                      QR not available
                    </strong>

                    <span>
                      Please contact
                      The SK Learnings
                    </span>
                  </div>
                )}

                <p>
                  Scan the QR and enter
                  the payment amount
                  manually in your UPI
                  app.
                </p>
              </div>
            </section>

            {/* RECEIVER DETAILS */}

            <section className="receiver-details-card">
              <span className="receiver-title">
                PAYMENT RECEIVER
              </span>

              <div className="receiver-detail">
                <span>
                  Receiver Name
                </span>

                <strong>
                  {payment.receiverName ||
                    "Not configured"}
                </strong>
              </div>

              <div className="receiver-detail">
                <span>
                  UPI ID
                </span>

                <strong>
                  {payment.upiId ||
                    "Not configured"}
                </strong>
              </div>

              <div className="receiver-detail">
                <span>
                  Payment Number
                </span>

                <strong>
                  {payment.paymentPhone ||
                    "Not configured"}
                </strong>
              </div>
            </section>
          </>
        )}

        {/* SECURITY */}

        <section className="payment-security">
          <div>
            <FiShield />

            <span>
              Secure UPI
            </span>
          </div>

          <i />

          <div>
            <FiLock />

            <span>
              Protected Payment
            </span>
          </div>
        </section>

        <footer className="payment-footer">
          THE SK LEARNINGS
        </footer>
      </main>
    </div>
  );
};

export default PayFees;