/************************************************** WiGTyT Receipt System* Main.gs *************************************************/

/**
 * Triggered automatically when a Google Form is submitted.
 */
function onFormSubmit(e) {

  try {

    const sheet = e.range.getSheet();
    const row = e.range.getRow();

    // Read header row
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Read submitted row
    const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

    //--------------------------------------------------
    // Customer Details
    //--------------------------------------------------

    const customer = {

      name: getValue(headers, rowData, "Customer Name"),

      address: getValue(headers, rowData, "Address")

    };

    //--------------------------------------------------
    // Receipt Number
    //--------------------------------------------------

    const receiptNumber = getNextReceiptNumber();

    //--------------------------------------------------
    // Products
    //--------------------------------------------------

    const products = getProductsFromSubmission(headers, rowData);

    if (products.items.length === 0) {

      throw new Error("No products were selected.");

    }

    //--------------------------------------------------
    // Generate Receipt
    //--------------------------------------------------

    const receipt = createReceipt(

      customer,

      products,

      receiptNumber

    );

    //--------------------------------------------------
    // Email PDF
    //--------------------------------------------------

    sendReceiptEmail(

      receipt,

      customer,

      products,

      receiptNumber

    );

    //--------------------------------------------------
    // Save receipt details to spreadsheet
    //--------------------------------------------------

    updateReceiptLog(

      sheet,

      row,

      receiptNumber,

      receipt.pdfUrl,

      products.grandTotal

    );

    Logger.log("Receipt created successfully.");

  }

  catch(error){

    Logger.log(error);

    MailApp.sendEmail({

      to: CONFIG.EMAIL_TO,

      subject: "Receipt Generation Failed",

      body:
      "An error occurred.\n\n" +

      error.toString()

    });

  }

}

/**
 * Returns a value from a row using
 * the column header.
 */
function getValue(headers, rowData, headerName){

  const index = headers.indexOf(headerName);

  if(index == -1){

    return "";

  }

  return rowData[index];

}

/**
 * Writes receipt details back
 * to the response sheet.
 */
function updateReceiptLog(

    sheet,

    row,

    receiptNumber,

    pdfUrl,

    total

){

  const headers = sheet.getRange(1,1,1,sheet.getLastColumn())
                       .getValues()[0];

  let receiptCol = headers.indexOf("Receipt Number");

  let pdfCol = headers.indexOf("Receipt PDF");

  let totalCol = headers.indexOf("Grand Total");

  //--------------------------------------------------
  // Create missing columns automatically
  //--------------------------------------------------

  if(receiptCol==-1){

      receiptCol=headers.length;

      sheet.getRange(1,receiptCol+1)

      .setValue("Receipt Number");

  }

  if(pdfCol==-1){

      pdfCol=Math.max(headers.length,receiptCol+1);

      sheet.getRange(1,pdfCol+1)

      .setValue("Receipt PDF");

  }

  if(totalCol==-1){

      totalCol=Math.max(headers.length,pdfCol+1);

      sheet.getRange(1,totalCol+1)

      .setValue("Grand Total");

  }

  sheet.getRange(row,receiptCol+1)

       .setValue(receiptNumber);

  sheet.getRange(row,pdfCol+1)

       .setValue(pdfUrl);

  sheet.getRange(row,totalCol+1)

       .setValue(total);

}
