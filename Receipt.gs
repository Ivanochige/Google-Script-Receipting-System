/*************************************************
 * WiGTyT Receipt System
 * Receipt.gs
 *************************************************/

/**
 * Creates the receipt document
 *
 * @param {Object} customer
 * @param {Object} products
 * @param {String} receiptNumber
 *
 * @return {Object}
 */
function createReceipt(customer, products, receiptNumber) {

  Logger.log("DEBUG: Creating receipt for: '" + customer.name + "', Total: " + products.grandTotal);

  const template = DriveApp.getFileById(CONFIG.TEMPLATE_ID);
  const folder = DriveApp.getFolderById(CONFIG.OUTPUT_FOLDER_ID);

  //--------------------------------------------------
  // Create a "Safe" Customer Name for Filenames
  // Removes special characters and replaces spaces with hyphens
  //--------------------------------------------------
  const safeName = String(customer.name || "Unknown")
                     .replace(/[^a-zA-Z0-9 ]/g, "") 
                     .trim()
                     .replace(/\s+/g, "-");          

  const fileSuffix = safeName ? "-" + safeName : "";

  //--------------------------------------------------
  // Create Copy & Replace Placeholders
  //--------------------------------------------------
  const copy = template.makeCopy("Receipt-" + receiptNumber + fileSuffix, folder);
  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();

  // Replace text placeholders in the document (Case-Insensitive Regex)
  body.replaceText("\\{\\{[Cc]ustomer [Nn]ame\\}\\}", customer.name || "N/A");
  body.replaceText("\\{\\{[Aa]ddress\\}\\}", customer.address || "N/A");
  body.replaceText("\\{\\{[Dd]ate\\}\\}", getToday());
  
  // Handles both {{Total Amount}} and {{Total Cost}}
  body.replaceText("\\{\\{[Tt]otal\\s+(Amount|Cost)\\}\\}", formatCurrency(products.grandTotal));
  body.replaceText("\\{\\{[Gg]rand\\s+(Grand|Total)\\}\\}", formatCurrency(products.grandTotal));
  
  body.replaceText("\\{\\{[Rr]eceipt [Nn]umber\\}\\}", receiptNumber);

  fillReceiptTable(body, products.items);
  doc.saveAndClose();

  //--------------------------------------------------
  // Export PDF
  //--------------------------------------------------
  const pdf = copy.getAs(MimeType.PDF);
  const pdfFile = folder.createFile(pdf);
  
  // The PDF will now be named: Receipt-WGT-000001-John-Doe.pdf
  pdfFile.setName("Receipt-" + receiptNumber + fileSuffix + ".pdf");

  return {
    docId: copy.getId(),
    pdfId: pdfFile.getId(),
    pdfUrl: pdfFile.getUrl(),
    pdfBlob: pdf
  };

}

/**
 * Finds the Products table and fills it by duplicating
 * a formatted template row.
 *
 * Template structure:
 * ----------------------------------------------------
 * | Product | Qty | Price | Total |   <-- Header (row 0)
 * | {{PRODUCT}} | {{QTY}} | {{PRICE}} | {{TOTAL}} | <-- Template row (row 1)
 * ----------------------------------------------------
 */
function fillReceiptTable(body, items) {

  const tables = body.getTables();
  let table = null;

  // Locate the products table
  for (let t = 0; t < tables.length; t++) {

    const candidate = tables[t];

    if (candidate.getNumRows() < 2) continue;

    const header = candidate.getRow(0);

    if (header.getNumCells() < 4) continue;

    const c1 = header.getCell(0).getText().trim().toUpperCase();
    const c2 = header.getCell(1).getText().trim().toUpperCase();
    const c3 = header.getCell(2).getText().trim().toUpperCase();
    const c4 = header.getCell(3).getText().trim().toUpperCase();

    if (
      c1.includes("PRODUCT") &&
      c2.includes("QTY") &&
      (c3.includes("PRICE") || c3.includes("COST")) &&
      c4.includes("TOTAL")
    ) {
      table = candidate;
      break;
    }
  }

  if (!table) {
    throw new Error(
      "Products table could not be found. Ensure headers are Product, Qty, Price/Cost, Total."
    );
  }

  // Keep the formatted template row
  const templateRow = table.getRow(1);

  // Remove all rows below the template row
  while (table.getNumRows() > 2) {
    table.removeRow(2);
  }

  // Populate rows
  items.forEach((item, index) => {

    let row;

    if (index === 0) {
      // Use the existing template row
      row = templateRow;
    } else {
      // Duplicate the template row
      row = table.appendTableRow(templateRow.copy());
    }

    replaceCellText(row.getCell(0), "{{PRODUCT}}", item.product);
    replaceCellText(row.getCell(1), "{{QTY}}", item.quantity.toString());
    replaceCellText(row.getCell(2), "{{PRICE}}", formatCurrency(item.unitPrice));
    replaceCellText(row.getCell(3), "{{TOTAL}}", formatCurrency(item.lineTotal));

  });

  // Remove the template row if there are no items
  if (items.length === 0) {
    table.removeRow(1);
  }
}


/**
 * Replaces placeholder text inside a table cell while
 * preserving formatting.
 */
function replaceCellText(cell, placeholder, value) {

  const text = cell.editAsText();

  const found = text.findText(placeholder);

  if (found) {
    text.deleteText(found.getStartOffset(), found.getEndOffsetInclusive());
    text.insertText(found.getStartOffset(), value);
  } else {
    text.setText(value);
  }
}
