/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const moment = require('moment');
const MessageCustomerResourceAccess = require('../resourceAccess/MessageCustomerResourceAccess');

async function deleteOldMessagesDaily() {
  console.info(`autoDeleteOldAPNSMessagesDaily`);
  // Xác định khoảng thời gian 6 tháng trước
  const sixMonthsAgo = moment().subtract(6, 'months').endOf('day').format();

  await _deleteMessageCustomer(sixMonthsAgo);
}

async function _deleteMessageCustomer(endDate) {
  console.info(`autoDeleteMessagesCustomer`);

  let batchSize = 10;

  let skip = 0;
  while (true) {
    // Dah sách msg APNS cách đây hơn 6 tháng
    const msgsCustomer = await MessageCustomerResourceAccess.customSearch({}, skip, batchSize, undefined, endDate);

    if (msgsCustomer && msgsCustomer.length > 0) {
      const deleteMsgs = msgsCustomer.map(msg => _permanentlyDeleteMsgCustomer(msg.messageCustomerId));
      await Promise.all(deleteMsgs);
    } else {
      break;
    }

    skip += batchSize;
  }
}

async function _permanentlyDeleteMsgCustomer(messageCustomerId) {
  await MessageCustomerResourceAccess.permanentlyDelete(messageCustomerId);
}

deleteOldMessagesDaily();

module.exports = {
  deleteOldMessagesDaily,
};
