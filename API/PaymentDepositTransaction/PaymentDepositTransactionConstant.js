/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

module.exports = {
  DEPOSIT_TRX_STATUS: {
    NEW: 'New',
    WAITING: 'Waiting',
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    DELETED: 'Deleted',
    CANCELED: 'Canceled',
  },
  DEPOSIT_TRX_CATEGORY: {
    BANK: 'ATM/BANK',
    USDT: 'USDT',
    FROM_BONUS: 'FROM_BONUS',
    BLOCKCHAIN: 'BLOCKCHAIN',
    MOMO_QR: 'MOMO_QR',
    ZALO_QR: 'ZALO_QR',
    VIETTEL_QR: 'VIETTEL_QR',
  },
  DEPOSIT_TRX_UNIT: {
    VND: 'VND',
    USDT: 'USDT',
  },
  DEPOSIT_TRX_TYPE: {
    USER_DEPOSIT: 'USER_DEPOSIT',
    ADMIN_DEPOSIT: 'ADMIN_DEPOSIT',
    AUTO_DEPOSIT: 'AUTO_DEPOSIT',
  },
  DEPOSIT_ERROR: {
    NO_BANK_ACCOUNT_INFORMATION: 'NO_BANK_ACCOUNT_INFORMATION', //'No bank account information',
    NOT_ENOUGH_DEPOSIT_AMOUNT: 'NOT_ENOUGH_DEPOSIT_AMOUNT', //'minumun deposit amount is 100000VND',
    DEPOSIT_PENDING: 'DEPOSIT_PENDING',
    DUPLICATE_TRANSACTION_ID: 'DUPLICATE_TRANSACTION_ID',
  },
  IS_USER_DEPOSIT: {
    COMPLETED: 1,
    CANCEL: 0,
  },
  MINIMUM_DEPOSIT_AMOUNT: 100000,
};
