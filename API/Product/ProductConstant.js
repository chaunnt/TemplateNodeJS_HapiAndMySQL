/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

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
  PLACE_ORDER_ERROR: {
    INVALID_WALLET: 'INVALID_WALLET',
    NOT_ENOUGHT_MONEY: 'NOT_ENOUGHT_MONEY',
    NOT_RIGHT: 'SOMETHING_NOT_RIGHT',
  },
  PRODUCT_STATUS: {
    NEW: 'New',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELED: 'Canceled',
  },
  PRODUCT_CHANNEL: {
    TPHCM: 'TPHCM',
    DONG_THAP: 'DONG_THAP',
    CA_MAU: 'CA_MAU',
    BEN_TRE: 'BEN_TRE',
    VUNG_TAU: 'VUNG_TAU',
    BAC_LIEU: 'BAC_LIEU',
    DONG_NAI: 'DONG_NAI',
    CAN_THO: 'CAN_THO',
    SOC_TRANG: 'SOC_TRANG',
    TAY_NINH: 'TAY_NINH',
    AN_GIANG: 'AN_GIANG',
    BINH_THUAN: 'BINH_THUAN',
    VINH_LONG: 'VINH_LONG',
    BINH_DUONG: 'BINH_DUONG',
    TRA_VINH: 'TRA_VINH',
    LONG_AN: 'LONG_AN',
    HAU_GIANG: 'HAU_GIANG',
    BINH_PHUOC: 'BINH_PHUOC',
    LAM_DONG: 'LAM_DONG',
    KIEN_GIANG: 'KIEN_GIANG',
    TIEN_GIANG: 'TIEN_GIANG',
  },
};
