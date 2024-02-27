/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

module.exports = {
  WITHDRAW_TRX_STATUS: {
    NEW: 'New',
    WAITING: 'Waiting',
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    DELETED: 'Deleted',
    CANCELED: 'Canceled',
  },
  WITHDRAW_TRX_CATEGORY: {
    BANK: 'ATM/BANK',
    USDT: 'USDT',
    DIRECT_REWARD: 'DIRECT_REWARD', // cong tien truc tiep
  },
  WITHDRAW_TRX_UNIT: {
    VND: 'VND',
    USDT: 'USDT',
  },
  WITHDRAW_TRX_TYPE: {
    USER_WITHDRAW: 'USER_WITHDRAW',
    ADMIN_WITHDRAW: 'ADMIN_WITHDRAW',
    AUTO_WITHDRAW: 'AUTO_WITHDRAW',
  },
  INVALID: {
    INVALID_PAYMENTNOTE: undefined,
    INVALID_WALLET: undefined,
    INVALID_BANKINFOMATION: undefined,
  },
  WITHDRAW_TRX_QUOTA: {
    DAY: 3,
  },
  WITHDRAW_ERROR: {
    NOT_ENOUGH_TIME: 'NOT_ENOUGH_TIME',
    LIMIT_MAX_WITHDRAW: 'LIMIT_MAX_WITHDRAW',
    LIMIT_MIN_OR_MAX_WITHDRAW: 'LIMIT_MIN_OR_MAX_WITHDRAW',
  },
  MIN_WITHDRAW: {
    POINT_VND: 110000,
    POINT_USDT: 10,
  },
};
