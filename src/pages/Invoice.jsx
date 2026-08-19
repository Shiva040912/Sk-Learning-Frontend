import { useEffect, useMemo, useRef, useState } from "react";

import {
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiFileText,
  FiFilter,
  FiPrinter,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import api from "../services/axios";
import InvoiceDocument from "../components/InvoiceDocument";
import LoadingLogo from "../components/LoadingLogo";

import "../styles/invoice.css";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [feeTypeFilter, setFeeTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const invoiceRef = useRef(null);

  const getErrorMessage = (error, fallback) => {
    const message = error?.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }

    return fallback;
  };

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);

      const response = await api.get("/invoices");

      setInvoices(response.data || []);
    } catch (error) {
      console.error("Invoice load error:", error?.response?.data || error);

      toast.error(getErrorMessage(error, "Failed to load invoices"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

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
      partial: "Partial",
      yearly: "Yearly",
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

  const getInvoiceTypeLabel = (type) =>
    type === "payment_receipt" ? "Payment Receipt" : "Fee Setup";

  const courseOptions = useMemo(() => {
    return [
      ...new Set(
        invoices.map((invoice) => invoice.student?.course).filter(Boolean),
      ),
    ].sort();
  }, [invoices]);

  const batchOptions = useMemo(() => {
    return [
      ...new Set(
        invoices.map((invoice) => invoice.student?.batch).filter(Boolean),
      ),
    ].sort();
  }, [invoices]);

  const searchedInvoices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        !keyword ||
        String(invoice.invoiceNumber || "")
          .toLowerCase()
          .includes(keyword) ||
        String(invoice.student?.studentName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(invoice.student?.rollNo || "")
          .toLowerCase()
          .includes(keyword) ||
        String(invoice.student?.course || "")
          .toLowerCase()
          .includes(keyword) ||
        String(invoice.student?.batch || "")
          .toLowerCase()
          .includes(keyword);

      const matchesCourse =
        courseFilter === "all" || invoice.student?.course === courseFilter;

      const matchesBatch =
        batchFilter === "all" || invoice.student?.batch === batchFilter;

      const matchesFeeType =
        feeTypeFilter === "all" || invoice.fee?.feeType === feeTypeFilter;

      return matchesSearch && matchesCourse && matchesBatch && matchesFeeType;
    });
  }, [invoices, search, courseFilter, batchFilter, feeTypeFilter]);

  const receiptBoard = useMemo(() => {
    const grouped = new Map();

    [...searchedInvoices]
      .sort(
        (a, b) =>
          new Date(b.paymentDate || b.invoiceDate || b.createdAt || 0) -
          new Date(a.paymentDate || a.invoiceDate || a.createdAt || 0),
      )
      .forEach((invoice) => {
        const studentKey = String(
          invoice.studentId ||
            invoice.student?._id ||
            invoice.student?.rollNo ||
            invoice.student?.studentName ||
            invoice._id,
        );

        if (!grouped.has(studentKey)) {
          grouped.set(studentKey, []);
        }

        grouped.get(studentKey).push(invoice);
      });

    const unpaid = [];
    const paid = [];

    grouped.forEach((studentInvoices) => {
      const paidReceipt = studentInvoices.find(
        (invoice) =>
          invoice.invoiceType === "payment_receipt" &&
          invoice.paymentStatus === "paid",
      );

      if (paidReceipt) {
        paid.push(paidReceipt);
        return;
      }

      const openReceipt =
        studentInvoices.find((invoice) => invoice.paymentStatus !== "paid") ||
        studentInvoices[0];

      if (openReceipt) {
        unpaid.push(openReceipt);
      }
    });

    return { unpaid, paid };
  }, [searchedInvoices]);

  const summary = useMemo(() => {
    return {
      total: receiptBoard.unpaid.length + receiptBoard.paid.length,
      unpaid: receiptBoard.unpaid.length,
      paid: receiptBoard.paid.length,
      received: receiptBoard.paid.reduce(
        (total, invoice) =>
          total + Number(invoice.paidAmount || invoice.invoiceAmount || 0),
        0,
      ),
    };
  }, [receiptBoard]);

  const handleClearInvoices = async () => {
    if (!invoices.length || isClearing) return;

    const shouldClear = window.confirm(
      "Clear all invoice and receipt records? This cannot be undone.",
    );

    if (!shouldClear) return;

    try {
      setIsClearing(true);

      const response = await api.delete("/invoices/clear");

      toast.success(
        response.data?.message || "All invoice records cleared successfully",
      );

      setInvoices([]);
      setSelectedInvoice(null);
      setShowInvoiceModal(false);
    } catch (error) {
      console.error("Clear invoices error:", error?.response?.data || error);

      toast.error(getErrorMessage(error, "Failed to clear invoice records"));
    } finally {
      setIsClearing(false);
    }
  };

  const openInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const closeInvoice = () => {
    if (isDownloading) return;

    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !selectedInvoice) {
      return;
    }

    try {
      setIsDownloading(true);

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imageData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;

      const scale = Math.min(
        pageWidth / canvas.width,
        pageHeight / canvas.height,
      );

      const imageWidth = canvas.width * scale;

      const imageHeight = canvas.height * scale;

      const x = (pageWidth - imageWidth) / 2;

      const y = (pageHeight - imageHeight) / 2;

      pdf.addImage(imageData, "PNG", x, y, imageWidth, imageHeight);

      pdf.save(`${selectedInvoice.invoiceNumber}.pdf`);

      toast.success("Invoice PDF downloaded successfully");
    } catch (error) {
      console.error("Invoice PDF error:", error);

      toast.error("Failed to download invoice PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="invoices-page">
      <div className="invoice-summary-grid receipt-summary-grid">
        <SummaryCard label="Total Receipts" value={summary.total} />
        <SummaryCard label="Unpaid / Pending" value={summary.unpaid} />
        <SummaryCard label="Paid Receipts" value={summary.paid} />
        <SummaryCard
          label="Received"
          value={`₹${formatMoney(summary.received)}`}
        />
      </div>

      <div className="receipt-board-toolbar receipt-board-toolbar-inline">
        <div className="invoice-search">
          <FiSearch />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, roll no, invoice no, course or batch..."
          />
        </div>

        <div className="receipt-filter-wrapper">
          <button
            type="button"
            className={`receipt-filter-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters((current) => !current)}
          >
            <FiFilter />
            Filter
            {(courseFilter !== "all" ||
              batchFilter !== "all" ||
              feeTypeFilter !== "all") && (
              <span className="receipt-filter-dot" />
            )}
          </button>

          {showFilters && (
            <div className="receipt-filter-dropdown">
              <div className="receipt-filter-head">
                <strong>Filter Receipts</strong>

                <button
                  type="button"
                  onClick={() => {
                    setCourseFilter("all");
                    setBatchFilter("all");
                    setFeeTypeFilter("all");
                  }}
                >
                  Clear
                </button>
              </div>

              <div className="receipt-filter-field">
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

              <div className="receipt-filter-field">
                <label>Batch</label>

                <select
                  value={batchFilter}
                  onChange={(event) => setBatchFilter(event.target.value)}
                >
                  <option value="all">All Batches</option>

                  {batchOptions.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="receipt-filter-field">
                <label>Fee Type</label>

                <select
                  value={feeTypeFilter}
                  onChange={(event) => setFeeTypeFilter(event.target.value)}
                >
                  <option value="all">All Fee Types</option>
                  <option value="monthly">Monthly</option>
                  <option value="partial">Partial</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="invoice-clear-all-btn toolbar-clear-btn"
          onClick={handleClearInvoices}
          disabled={!invoices.length || isClearing}
        >
          <FiTrash2 />
          {isClearing ? "Clearing..." : "Clear"}
        </button>
      </div>

      {isLoading ? (
        <div className="invoice-board-loading">
          <LoadingLogo />
          <span>Loading receipts...</span>
        </div>
      ) : (
        <section className="receipt-board receipt-board-compact">
          <ReceiptColumn
            title="Unpaid Receipts"
            subtitle="Payment pending or partially paid"
            icon={<FiClock />}
            status="unpaid"
            invoices={receiptBoard.unpaid}
            emptyTitle="No unpaid receipts"
            emptyText="New fee setup receipts will appear here."
            openInvoice={openInvoice}
            formatMoney={formatMoney}
            formatDate={formatDate}
            getInvoiceTypeLabel={getInvoiceTypeLabel}
          />

          <ReceiptColumn
            title="Paid Receipts"
            subtitle="Successfully completed payments"
            icon={<FiCheckCircle />}
            status="paid"
            invoices={receiptBoard.paid}
            emptyTitle="No paid receipts"
            emptyText="Completed payments will move here."
            openInvoice={openInvoice}
            formatMoney={formatMoney}
            formatDate={formatDate}
            getInvoiceTypeLabel={getInvoiceTypeLabel}
          />
        </section>
      )}

      {showInvoiceModal && selectedInvoice && (
        <div className="invoice-modal-overlay">
          <div className="invoice-modal-shell">
            <div className="invoice-modal-actions-bar">
              <div>
                <strong>{selectedInvoice.invoiceNumber}</strong>

                <span>{getInvoiceTypeLabel(selectedInvoice.invoiceType)}</span>
              </div>

              <div className="invoice-modal-buttons">
                <button type="button" onClick={handlePrint}>
                  <FiPrinter />
                  Print
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                >
                  <FiDownload />

                  {isDownloading ? "Downloading..." : "Download PDF"}
                </button>

                <button
                  type="button"
                  className="invoice-close-btn"
                  onClick={closeInvoice}
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="invoice-document-scroll">
              <InvoiceDocument ref={invoiceRef} invoice={selectedInvoice} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReceiptColumn = ({
  title,
  subtitle,
  icon,
  status,
  invoices,
  emptyTitle,
  emptyText,
  openInvoice,
  formatMoney,
}) => {
  return (
    <div className={`receipt-column ${status}`}>
      <div className="receipt-column-header">
        <div className="receipt-column-heading">
          <div className="receipt-column-icon">{icon}</div>

          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </div>

        <span className="receipt-column-count">{invoices.length}</span>
      </div>

      <div className="receipt-list-head">
        <span>Student</span>
        <span>Course</span>
        <span>Amount</span>
        <span>Action</span>
      </div>

      <div className="receipt-column-body">
        {invoices.length === 0 ? (
          <div className="receipt-column-empty">
            <FiFileText />
            <strong>{emptyTitle}</strong>
            <span>{emptyText}</span>
          </div>
        ) : (
          invoices.map((invoice) => {
            const amount =
              status === "paid"
                ? invoice.invoiceAmount || invoice.paidAmount
                : invoice.pendingAmount || invoice.invoiceAmount;

            return (
              <div key={invoice._id} className={`receipt-list-row ${status}`}>
                <div className="receipt-row-student">
                  <div className="receipt-row-avatar">
                    {invoice.student?.studentName?.charAt(0)?.toUpperCase() ||
                      "S"}
                  </div>

                  <div>
                    <strong>{invoice.student?.studentName || "-"}</strong>

                    <span>{invoice.student?.rollNo || "-"}</span>
                  </div>
                </div>

                <div className="receipt-row-course">
                  <strong>{invoice.student?.course || "-"}</strong>

                  <span>{invoice.student?.batch || "-"}</span>
                </div>

                <div className="receipt-row-amount">
                  <strong>₹{formatMoney(amount)}</strong>

                  <span className={`receipt-row-status ${status}`}>
                    {status === "paid"
                      ? "Paid"
                      : invoice.paymentStatus === "partial"
                        ? "Partial"
                        : "Unpaid"}
                  </span>
                </div>

                <button
                  type="button"
                  className="receipt-view-btn"
                  onClick={() => openInvoice(invoice)}
                >
                  <FiEye />
                  View
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value }) => {
  return (
    <div className="invoice-summary-card">
      <div className="invoice-summary-icon">
        <FiFileText />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
};

export default Invoices;
