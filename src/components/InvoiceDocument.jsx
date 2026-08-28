import { forwardRef } from "react";
import { FiCheckCircle } from "react-icons/fi";

import logo from "../assets/sk-logo.png";
import "../styles/invoice-document.css";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

const formatFeeType = (value) => {
  const labels = {
    monthly: "Monthly",
    partial: "Part Payment",
    yearly: "One-Time Payment",
  };

  return labels[value] || "-";
};

const formatPaymentMethod = (value) => {
  const labels = {
    cash: "Cash",
    bank: "Bank",
    upi: "UPI",
    qr: "QR",
  };

  return labels[value] || "-";
};

const InvoiceDocument = forwardRef(
  (
    {
      invoice,
    },
    ref
  ) => {
    const isReceipt =
      invoice.invoiceType ===
      "payment_receipt";

    const business =
      invoice.business || {};

    const student =
      invoice.student || {};

    const fee =
      invoice.fee || {};

    const monthlyInstallments = Array.isArray(fee.monthlyInstallments)
      ? fee.monthlyInstallments
      : [];

    const paymentHistory = Array.isArray(fee.paymentHistory)
      ? fee.paymentHistory
      : [];

    const currentPayableAmount = Number(
      fee.currentPayableAmount ?? invoice.invoiceAmount ?? 0
    );

    const currentInstallmentNumber = Number(
      fee.currentInstallmentNumber || 0
    );

    const totalFee = Number(
      fee.totalFee ||
        invoice.invoiceAmount ||
        0
    );

    const paidAmount = Number(
      invoice.paidAmount || 0
    );

    const pendingAmount = Number(
      invoice.pendingAmount ??
        Math.max(
          0,
          totalFee - paidAmount
        )
    );

    const isFullyPaid =
      isReceipt &&
      (
        invoice.paymentStatus === "paid" ||
        pendingAmount <= 0
      );

    const feePlanText =
      fee.feeType === "monthly"
        ? `${fee.selectedMonths || "-"} monthly installments`
        : fee.feeType === "partial"
          ? "Flexible part payments"
          : "Full fee payment";

    return (
      <div
        ref={ref}
        className={`sk-invoice-document compact-invoice ${
          isReceipt
            ? "receipt-document"
            : "setup-document"
        }`}
      >
        <header className="compact-invoice-header">
          <div className="compact-brand">
            <img
              src={logo}
              alt="The SK Learnings"
            />

            <div>
              <h1>THE SK LEARNINGS</h1>
              <p>PRIVATE EDUCATIONAL SERVICES</p>
              <strong>
                MEDICAL / ENGINEERING / FOUNDATIONS / JUNIOR IAS
              </strong>
            </div>
          </div>

          <div
            className={`compact-document-status ${
              isReceipt
                ? isFullyPaid
                  ? "paid"
                  : "received"
                : "unpaid"
            }`}
          >
            <span>
              {isReceipt
                ? "PAYMENT RECEIPT"
                : "FEE INVOICE"}
            </span>
            <strong>
              {isReceipt
                ? isFullyPaid
                  ? "PAID"
                  : "RECEIVED"
                : "PAYMENT DUE"}
            </strong>
          </div>
        </header>

        <section className="compact-invoice-meta-bar">
          <div>
            <span>Invoice No</span>
            <strong>{invoice.invoiceNumber || "-"}</strong>
          </div>
          <div>
            <span>Invoice Date</span>
            <strong>{formatDate(invoice.invoiceDate)}</strong>
          </div>
          <div>
            <span>
              {isReceipt ? "Payment Date" : "Due Date"}
            </span>
            <strong>
              {formatDate(
                isReceipt
                  ? invoice.paymentDate
                  : invoice.dueDate
              )}
            </strong>
          </div>
          <div>
            <span>Status</span>
            <strong
              className={`compact-status-text ${
                isReceipt
                  ? isFullyPaid
                    ? "paid"
                    : "received"
                  : "unpaid"
              }`}
            >
              {isReceipt
                ? isFullyPaid
                  ? "Paid"
                  : "Part Payment"
                : invoice.paymentStatus === "partial"
                  ? "Part Payment"
                  : "Unpaid"}
            </strong>
          </div>
        </section>

        <section className="compact-party-grid">
          <div className="compact-party-block">
            <div className="compact-section-title">
              Student Details
            </div>
            <div className="compact-detail-grid">
              <CompactDetail label="Student" value={student.studentName} />
              <CompactDetail label="Roll No" value={student.rollNo} />
              <CompactDetail label="Course" value={student.course} />
              <CompactDetail label="Batch" value={student.batch || "-"} />
              <CompactDetail label="Parent" value={student.parentName} />
              <CompactDetail label="Phone" value={student.phone} />
            </div>
          </div>

          <div className="compact-party-block">
            <div className="compact-section-title">
              Invoice From
            </div>
            <div className="compact-detail-grid business-grid">
              <CompactDetail label="Owner" value={business.ownerName || "-"} />
              <CompactDetail label="GST No" value={business.gstNumber || "-"} />
              <CompactDetail label="Address" value={business.address || "-"} wide />
            </div>
          </div>
        </section>

        <section className="compact-fee-section">
          <div className="compact-section-title">
            {isReceipt ? "Payment Summary" : "Fee Details"}
          </div>

          <div className="compact-fee-table">
            <div className="compact-fee-head">
              <span>Description</span>
              <span>Fee Type</span>
              <span>Total</span>
              <span>Paid</span>
              <span>Pending</span>
            </div>

            <div className="compact-fee-row">
              <div>
                <strong>{student.course || "Course Fee"}</strong>
                <span>{feePlanText}</span>
              </div>
              <strong>{formatFeeType(fee.feeType)}</strong>
              <strong>₹{formatMoney(totalFee)}</strong>
              <strong>₹{formatMoney(isReceipt ? paidAmount : 0)}</strong>
              <strong>₹{formatMoney(pendingAmount)}</strong>
            </div>
          </div>

          {isReceipt && (
            <div className="compact-payment-meta">
              <div>
                <span>This Payment</span>
                <strong>₹{formatMoney(invoice.invoiceAmount)}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>{formatPaymentMethod(invoice.paymentMethod)}</strong>
              </div>
              <div>
                <span>Remaining Balance</span>
                <strong>₹{formatMoney(pendingAmount)}</strong>
              </div>
            </div>
          )}
          {false &&
            monthlyInstallments.length > 0 && (
              <div className="compact-installment-block">
                <div className="compact-installment-heading">
                  <div>
                    <strong>Monthly Installment Schedule</strong>
                    <span>
                      {monthlyInstallments.filter(
                        (item) => item.status === "paid"
                      ).length}{" "}
                      / {monthlyInstallments.length} paid
                    </span>
                  </div>

                  <div className="compact-current-payable">
                    <span>
                      {currentInstallmentNumber > 0
                        ? `Current • Month ${currentInstallmentNumber}`
                        : "Current Payable"}
                    </span>
                    <strong>
                      ₹{formatMoney(currentPayableAmount)}
                    </strong>
                  </div>
                </div>

                <div className="compact-installment-table">
                  <div className="compact-installment-head">
                    <span>Month</span>
                    <span>Amount</span>
                    <span>Status</span>
                    <span>Paid Date</span>
                  </div>

                  {monthlyInstallments.map((installment) => (
                    <div
                      key={installment.installmentNumber}
                      className={`compact-installment-row ${
                        installment.status === "paid"
                          ? "paid"
                          : Number(installment.installmentNumber) ===
                              currentInstallmentNumber
                            ? "current"
                            : ""
                      }`}
                    >
                      <span>Month {installment.installmentNumber}</span>
                      <strong>₹{formatMoney(installment.amount)}</strong>
                      <span
                        className={`compact-installment-status ${
                          installment.status === "paid" ? "paid" : "unpaid"
                        }`}
                      >
                        {installment.status === "paid" ? "Paid" : "Unpaid"}
                      </span>
                      <span>{formatDate(installment.paidAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {fee.feeType === "partial" && paymentHistory.length > 0 && (
            <div className="compact-installment-block">
              <div className="compact-installment-heading">
                <div>
                  <strong>Part Payment History</strong>
                  <span>{paymentHistory.length} transactions</span>
                </div>

                <div className="compact-current-payable">
                  <span>Remaining Balance</span>
                  <strong>₹{formatMoney(pendingAmount)}</strong>
                </div>
              </div>

              <div className="compact-installment-table">
                <div className="compact-partial-history-head">
                  <span>Payment</span>
                  <span>Amount</span>
                  <span>Date</span>
                  <span>Method</span>
                </div>

                {paymentHistory.map((item, index) => (
                  <div
                    key={`${item.paymentDate}-${index}`}
                    className="compact-partial-history-row"
                  >
                    <span>Payment {index + 1}</span>
                    <strong>₹{formatMoney(item.amount)}</strong>
                    <span>{formatDate(item.paymentDate)}</span>
                    <span>{formatPaymentMethod(item.paymentMethod)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {!isReceipt ? (
          <section className="compact-payment-area">
            <div className="compact-qr-panel">
              <div>
                <span className="compact-section-title">Scan & Pay</span>
                <p>Scan the QR using any supported UPI app.</p>
              </div>

              {business.qrCode ? (
                <img src={business.qrCode} alt="Payment QR Code" />
              ) : (
                <div className="compact-qr-missing">
                  QR not configured
                </div>
              )}
            </div>

            <div className="compact-instructions">
              <div className="compact-section-title">
                Payment Instructions
              </div>
              <ol>
                <li>Scan the QR code and complete the fee payment.</li>
                <li>Share the payment screenshot in WhatsApp for verification.</li>
                <li>After verification, the payment receipt will be generated.</li>
              </ol>

              {business.invoiceTerms && (
                <p>
                  <strong>Terms:</strong>{" "}
                  {business.invoiceTerms}
                </p>
              )}
            </div>

            <div className="compact-total-box">
              <span>Amount Payable</span>
              <strong>₹{formatMoney(invoice.invoiceAmount)}</strong>
            </div>
          </section>
        ) : (
          <section className="compact-paid-section">
            <div className="compact-paid-badge">
              <FiCheckCircle />
              <div>
                <span>PAYMENT RECEIVED</span>
                <strong>₹{formatMoney(invoice.invoiceAmount)}</strong>
                <p>Payment has been recorded successfully.</p>
              </div>
            </div>

            {pendingAmount > 0 ? (
              <div className="compact-balance-box">
                <span>Remaining Balance</span>
                <strong>₹{formatMoney(pendingAmount)}</strong>
                <p>Continue payments as per the selected fee plan.</p>
              </div>
            ) : (
              <div className="compact-balance-box completed">
                <span>Fee Status</span>
                <strong>FULLY PAID</strong>
                <p>No pending balance for this fee setup.</p>
              </div>
            )}
          </section>
        )}

        <footer className="compact-invoice-footer">
          <div>
            <strong>
              {business.invoiceFooter ||
                "Thank you for choosing The SK Learnings"}
            </strong>
            <span>{business.address || ""}</span>
          </div>
          <div className="compact-footer-brand">
            THE SK LEARNINGS
          </div>
        </footer>
      </div>
    );
  }
);

InvoiceDocument.displayName = "InvoiceDocument";

const CompactDetail = ({
  label,
  value,
  wide = false,
}) => (
  <div className={`compact-detail ${wide ? "wide" : ""}`}>
    <span>{label}</span>
    <strong>{value || "-"}</strong>
  </div>
);

export default InvoiceDocument;