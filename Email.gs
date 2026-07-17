/*************************************************
 * WiGTyT Receipt System
 * Email.gs
 *************************************************/

/**
 * Sends the generated receipt PDF
 */
function sendReceiptEmail(receipt, customer, products, receiptNumber) {

  // UPDATED: Added Customer Name to the Subject Line
  const subject = "Receipt " + receiptNumber + " - " + customer.name + " - WiGTyT Conversations";

  const body =
`Hello Edwin,
I trust this mail finds you well.
A new receipt has been generated successfully.

SALES DETAILS
Receipt Number: ${receiptNumber}
Customer: ${customer.name}
Address: ${customer.address}
Products Purchased: ${products.items.length}
Grand Total: ${formatCurrency(products.grandTotal)}

PDF Link:
${receipt.pdfUrl}

Regards,
WiGTyT Receipt System™`;

  //--------------------------------------------------
  // Build Email Payload
  //--------------------------------------------------
  const emailOptions = {
    to: CONFIG.EMAIL_TO,       // Primary Admin Email
    subject: subject,
    body: body,
    attachments: [receipt.pdfBlob]
  };

  //--------------------------------------------------
  // Build the CC List (Hardcoded Admins + Customer)
  //--------------------------------------------------
  const ccRecipients = [];

  // 1. Add the hardcoded admin emails from Config.gs
  if (CONFIG.CC_EMAILS && String(CONFIG.CC_EMAILS).trim() !== "") {
    ccRecipients.push(String(CONFIG.CC_EMAILS).trim());
  }

  // 2. Add the customer's email (if it exists and is valid)
  if (customer.email && String(customer.email).trim().includes('@')) {
    ccRecipients.push(String(customer.email).trim());
  }

  // 3. Apply the CC field if we have any recipients
  if (ccRecipients.length > 0) {
    emailOptions.cc = ccRecipients.join(", ");
  }

  //--------------------------------------------------
  // Send Email
  //--------------------------------------------------
  MailApp.sendEmail(emailOptions);

}
