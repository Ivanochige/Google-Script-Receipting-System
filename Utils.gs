/*************************************************
 * Utils.gs
 *************************************************/

/**
 * Returns next receipt number
 * Example:
 * WGT-000001
 */
function getNextReceiptNumber() {

  const props = PropertiesService.getScriptProperties();

  let lastNumber = props.getProperty("LAST_RECEIPT_NO");

  if (!lastNumber) {
    lastNumber = 0;
  }

  lastNumber = Number(lastNumber) + 1;

  props.setProperty("LAST_RECEIPT_NO", lastNumber);

  return CONFIG.RECEIPT_PREFIX +
         ("000000" + lastNumber).slice(-6);

}


/**
 * Format Currency
 */
function formatCurrency(value){

  return CONFIG.CURRENCY + " " +

  Number(value).toLocaleString("en-US",{
      minimumFractionDigits:0
  });

}


/**
 * Today's Date
 */
function getToday(){

  return Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "dd/MM/yyyy"
  );

}
