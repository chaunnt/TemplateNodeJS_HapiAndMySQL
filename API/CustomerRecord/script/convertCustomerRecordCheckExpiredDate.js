/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const CustomerRecordResourceAccess = require('../resourceAccess/CustomerRecordResourceAccess');
const moment = require('moment');
const { DATE_DB_FORMAT, DATE_DB_SORT_FORMAT } = require('../CustomerRecordConstants');

async function convertCustomerRecordCheckExpiredDate() {
  console.info(` start convert convertCustomerRecordCheckExpiredDate`);

  let skip = 0;
  let batchSize = 100;
  while (true) {
    let customerRecords = await CustomerRecordResourceAccess.find({}, skip, batchSize);

    if (customerRecords && customerRecords.length > 0) {
      for (let i = 0; i < customerRecords.length; i++) {
        const expiredDate = customerRecords[i].customerRecordCheckExpiredDate;
        // Các định dạng sử dụng trong DB
        const originalFormats = ['DD-MM-YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD', 'YYYYMMDD'];
        const newFormat = DATE_DB_FORMAT;
        const dbFormat = DATE_DB_SORT_FORMAT;

        if (expiredDate) {
          let updateData = {};

          // Covert ngày hết hạn sang định dạng DD/MM/YYYY
          const expiredDateFormated = moment(expiredDate, originalFormats).format(newFormat);

          // Kiểm tra lại ngày hết hạn có đúng định dạng DD/MM/YYYY chưa
          const validDate = moment(expiredDateFormated, newFormat, true);
          if (validDate.isValid()) {
            console.info(`updateAndMoveCustomerRecordCheckExpiredDate ${customerRecords[i].customerRecordId} - ${expiredDate}`);

            const dbFormatexpiredDate = moment(expiredDateFormated, newFormat).format(dbFormat) * 1;

            updateData.customerRecordCheckExpiredDate = expiredDateFormated;
            updateData.customerRecordCheckExpiredDay = dbFormatexpiredDate;
          }

          await CustomerRecordResourceAccess.updateById(customerRecords[i].customerRecordId, updateData);
        }
      }
      skip += batchSize;
    } else {
      break;
    }
  }
  console.info(`finish convert convertCustomerRecordCheckExpiredDate`);
}
convertCustomerRecordCheckExpiredDate();
