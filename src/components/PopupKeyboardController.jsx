import { useEffect } from "react";

const overlaySelector = [
  ".student-modal-overlay",
  ".user-modal-overlay",
  ".payment-modal-overlay",
  ".invoice-modal-overlay",
].join(",");

const PopupKeyboardController = () => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const overlays = [...document.querySelectorAll(overlaySelector)];
      const overlay = overlays.at(-1);

      if (!overlay) return;

      if (event.key === "Escape") {
        const closeButton = overlay.querySelector(
          '[aria-label*="Close" i], .payment-modal-close, .student-modal-close, .user-modal-close, .invoice-modal-close',
        );
        const cancelButton = [...overlay.querySelectorAll("button")].find(
          (button) => /^(cancel|close)$/i.test(button.textContent.trim()),
        );

        (closeButton || cancelButton)?.click();
        return;
      }

      if (event.key !== "Enter" || event.repeat) return;

      const target = event.target;
      const isFormField = target.matches?.(
        "input, textarea, select, button, [contenteditable='true']",
      );

      // Form fields already receive native Enter-to-submit behaviour.
      if (isFormField && overlay.contains(target)) return;

      const primaryButton = overlay.querySelector(
        ".confirm-delete-btn, .user-confirm-delete, .payment-reverse-confirm-btn, .payment-primary-btn, .primary-btn, button[type='submit']",
      );

      if (primaryButton && !primaryButton.disabled) {
        event.preventDefault();
        primaryButton.click();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
};

export default PopupKeyboardController;
