/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';

module.exports = {
  CUSTOMER_RECEIPT_STATUS: {
    NEW: 'New',
    PENDING: 'Pending',
    FAILED: 'Failed',
    SUCCESS: 'Success',
    CANCELED: 'Canceled',
  },
  CUSTOMER_RECEIPT_STATUS_TO_TEXT: {
    NEW: 'Chưa thanh toán',
    PENDING: 'Đang xử lý',
    FAILED: 'Thất bại',
    SUCCESS: 'Thành công',
    CANCELED: 'Đã hủy',
  },
  PAYMENT_METHOD: {
    DIRECT: 'direct', // tiền mặt
    ATM: 'atm', // atm/bank
    VNPAY: 'vnpay', // vnpay
    MOMO: 'momo',
    CREDIT_CARD: 'creditcard', // visa
    DOMESTICCARD: 'domesticcard',
    MOMOBUSINESS: 'momobusiness',
  },
  MAPPING_MOMO_PAYMENT_METHOD_ALLOWANCE_TO_TYPE: {
    momobusiness: 'captureWallet',
    domesticcard: 'payWithATM',
    creditcard: 'payWithCC',
  },
  RECEIPT_ERROR: {
    STATION_DISABLE_PAYMENT: 'STATION_DISABLE_PAYMENT',
    CANCALED_SCHEDULE: 'CANCALED_SCHEDULE',
    PAID_ORDER: 'PAID_ORDER',
    INVALID_ORDER: 'INVALID_ORDER',
    NO_PHONE_NUMBER: 'NO_PHONE_NUMBER',
  },
};
