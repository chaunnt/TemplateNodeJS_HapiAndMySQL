/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

module.exports = {
  PAYMENT_TYPE: {
    ATM_BANK: 0,
    CREDIT_DEBIT: 1,
    ONLINE: 2,
    CRYPTO: 3,
  },
  MAX_LIMITED_PAYMENT_METHOD_BANK: 2,
  MAX_LIMITED_PAYMENT_METHOD_USDT: 2,
  PAYMENT_METHOD_ERROR: {
    MAX_LIMITED_PAYMENT_METHOD_BANK: 'MAX_LIMITED_PAYMENT_METHOD_BANK', //Vượt quá số lượng tài khoản ngân hàng
    MAX_LIMITED_PAYMENT_METHOD_USDT: 'MAX_LIMITED_PAYMENT_METHOD_USDT', //Vượt quá số lượng tài khoản tiền ảo
    INVALID_PAYMENT_METHOD_BANK_DATA: 'INVALID_PAYMENT_METHOD_BANK_DATA', //Tài khoản ngân hàng không đúng
    MAX_LIMITED_PAYMENT_METHOD: 'MAX_LIMITED_PAYMENT_METHOD', //Vượt quá số lượng tài khoản
  },
};
