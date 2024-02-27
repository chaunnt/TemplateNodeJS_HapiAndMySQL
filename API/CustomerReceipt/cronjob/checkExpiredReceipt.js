/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const CustomerReceiptResourceAccess = require('../resourceAccess/CustomerReceiptResourceAccess');
const { CUSTOMER_RECEIPT_STATUS, PAYMENT_METHOD } = require('../CustomerReceiptConstant');
const OrderResourceAccess = require('../../Order/resourceAccess/OrderResourceAccess');
const { ORDER_PAYMENT_STATUS } = require('../../Order/OrderConstant');

async function checkExpiredReceipt() {
  const expiredReceipt = await CustomerReceiptResourceAccess.find(
    {
      customerReceiptStatus: CUSTOMER_RECEIPT_STATUS.PENDING,
      paymentMethod: PAYMENT_METHOD.MOMO,
    },
    0,
    100,
  );

  for (let i = 0; i < expiredReceipt.length; i++) {
    const _receipt = expiredReceipt[i];
    const NOW = moment();
    const _createdAt = moment(_receipt.createdAt);
    if (NOW.diff(_createdAt, 'minutes') < 10) {
      continue;
    }
    // else -> expired receipt
    await CustomerReceiptResourceAccess.updateById(_receipt.customerReceiptId, {
      customerReceiptStatus: CUSTOMER_RECEIPT_STATUS.CANCELED,
      paymentApproveDate: moment().toDate(),
    });
    await OrderResourceAccess.updateById(_receipt.orderId, { paymentStatus: ORDER_PAYMENT_STATUS.CANCELED, cancelDate: moment().toDate() });
  }
}

checkExpiredReceipt();
