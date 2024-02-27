/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

module.exports = {
  GAME_PLAY_CATEGORY: {
    NORMAL: 1,
    FAKE: 2,
    MISSION: 3,
  },
  BET_STATUS: {
    NEW: 'New',
    WAITING: 'Waiting',
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    DELETED: 'Deleted',
    CANCELED: 'Canceled',
  },
  BET_RESULT: {
    WIN: 1,
    LOSE: 0,
    HOA: 2,
  },
  BET_WIN_RATE: {
    BAU_CUA: 0.9,
    XOC_DIA: {
      CHAN: 1,
      LE: 1,
      SAP4: 15,
      NGUA4: 15,
      SAP3NGUA1: 3,
      NGUA3SAP1: 3,
    },
  },
  BET_VALUE: {
    BACARAT: {
      CAI_THANG: 'CAI_THANG',
      CON_THANG: 'CON_THANG',
      HOA: 'HOA',
      CAI_DOI: 'CAI_DOI',
      CON_DOI: 'CON_DOI',
      CON_LONGBAO: 'CON_LONGBAO',
      CAI_LONGBAO: 'CAI_LONGBAO',
    },
    TIGERDRAGON1P: {
      RONG_THANG: 'RONG_THANG',
      HO_THANG: 'HO_THANG',
      HOA: 'HOA',
    },
    BINARYOPTION: {
      TANG: 'TANG',
      GIAM: 'GIAM',
      HOA: 'HOA',
    },
    BAUCUA: {
      NAI: 1,
      BAU: 2,
      GA: 3,
      CA: 4,
      CUA: 5,
      TOM: 6,
    },
    XOCDIA: {
      CHAN: 'CHAN',
      LE: 'LE',
      SAP4: 'SAP4',
      NGUA4: 'NGUA4',
      SAP3NGUA1: 'SAP3NGUA1',
      NGUA3SAP1: 'NGUA3SAP1',
    },
  },
  GAME_VALUE: {
    XOCDIA: {
      SAP4: '1111',
      NGUA4: '0000',
      SAP_NGUA_SAP_NGUA: '1010',
      SAP_SAP_NGUA_NGUA: '1100',
      SAP_NGUA_NGUA_SAP: '1001',
      SAP_SAP_NGUA_SAP: '1101',
      SAP_NGUA_SAP_SAP: '1011',
      NGUA_SAP_NGUA_NGUA: '0100',
      NGUA_NGUA_SAP_NGUA: '0010',
    },
  },
  BET_AMOUNT_MIN: 10000,
  BET_AMOUNT_MAX: 20000000,
  GAME_ID: {
    TIGERDRAGON1P: '001',
    KENO10P: '002',
    XSTT: '003',
    XSST1P: '004',
    BACARAT1P: '005',
    XOCDIA1P: '006',
    BAUCUA1P: '007',
    BINARYOPTION: '008',
    KENO1P: '009',
  },
  BET_TYPE: {
    BINARYOPTION_UPDOWN: 'BINARYOPTION_UPDOWN', //BO mua chẵn / lẽ lên xuống lớn nhỏ
    // BINARYOPTION_UPDOWN_5S: 'BINARYOPTION_UPDOWN_5S', //BO mua chẵn / lẽ lên xuống lớn nhỏ 5s
    BINARYOPTION_UPDOWN_15S: 'BINARYOPTION_UPDOWN_15S', //BO mua chẵn / lẽ lên xuống lớn nhỏ 15s
    // BINARYOPTION_UPDOWN_30S: 'BINARYOPTION_UPDOWN_30S', //BO mua chẵn / lẽ lên xuống lớn nhỏ 30s
    BINARYOPTION_UPDOWN_45S: 'BINARYOPTION_UPDOWN_45S', //BO mua chẵn / lẽ lên xuống lớn nhỏ 45s
    BINARYOPTION_UPDOWN_60S: 'BINARYOPTION_UPDOWN_60S', //BO mua chẵn / lẽ lên xuống lớn nhỏ 60s
    BINARYOPTION_UPDOWN_90S: 'BINARYOPTION_UPDOWN_90S', //BO mua chẵn / lẽ lên xuống lớn nhỏ 45s
    BINARYOPTION_UPDOWN_180S: 'BINARYOPTION_UPDOWN_180S', //BO mua chẵn / lẽ lên xuống lớn nhỏ 45s
    // BINARYOPTION_SPOT: 'BINARYOPTION_SPOT', //BO mua spot
    // BINARYOPTION_FUTURE: 'BINARYOPTION_FUTURE', //BO mua future
    // BAUCUA1P: 'BAUCUA1P', //Bau cua 1 phut
    // TIGERDRAGON1P: 'TIGERDRAGON1P', //Rong ho 1 phut
    // KENO1P: 'KENO1P', //Keno 1 phút
    // KENO10P: 'KENO10P', //Keno 10 phút
    // XSTT_DEFAULT: 'XSTT_DEFAULT', //XSTT theo kết quả đài thông thường 1 tuần / lần
    // XSTT_BAOLO_LO2: 'XSTT_BAOLO_LO2', //- Bao lô:+ Lô 2 số
    // XSTT_BAOLO_LO3: 'XSTT_BAOLO_LO3', //- Bao lô:+ Lô 3 số
    // XSTT_BAOLO_LO4: 'XSTT_BAOLO_LO4', //- Bao lô:+ Lô 4 số
    // XSTT_BAOLO_LO2SODAU: 'XSTT_BAOLO_LO2SODAU', //+ Lô 2 số đầu
    // XSTT_LOXIEN_XIEN2: 'XSTT_LOXIEN_XIEN2', //- Lô xiên:+ Xiên 2
    // XSTT_LOXIEN_XIEN3: 'XSTT_LOXIEN_XIEN3', //- Lô xiên:+ Xiên 3
    // XSTT_LOXIEN_XIEN4: 'XSTT_LOXIEN_XIEN4', //- Lô xiên:+ Xiên 4
    // XSTT_DE_DEDAUGIAINHAT: 'XSTT_DE_DEDAUGIAINHAT', //- Đề: + Đề đầu giải nhất
    // XSTT_DE_DEDACBIET: 'XSTT_DE_DEDACBIET', //- Đề: + Đề đặc biệt
    // XSTT_DE_DEDAUDACBIET: 'XSTT_DE_DEDAUDACBIET', //- Đề: + Đề đầu đặc biệt
    // XSTT_DE_DAU: 'XSTT_DE_DAU', // - Đề đầu (giải 8)
    // XSTT_DE_ĐAUDUOI: 'XSTT_DE_ĐAUDUOI', // - Đề đầu đuôi
    // XSTT_DE_DEGIAI7: 'XSTT_DE_DEGIAI7', //- Đề: + Đề giải 7
    // XSTT_DE_DEGIAINHAT: 'XSTT_DE_DEGIAINHAT', //- Đề: + Đề giải nhất
    // XSTT_DAUDUOI_DAU: 'XSTT_DAUDUOI_DAU', //- Đầu đuôi + Đầu
    // XSTT_DAUDUOI_DUOI: 'XSTT_DAUDUOI_DUOI', //- Đầu đuôi + Đuôi
    // XSTT_3CANG_DAU: 'XSTT_3CANG_DAU', //- 3 Càng + Đầu
    // XSTT_3CANG_DUOI: 'XSTT_3CANG_DUOI', //- 3 Càng + Đuôi
    // XSTT_3CANG_DAUDUOI: 'XSTT_3CANG_DAUDUOI', //- 3 Càng + Đầu Đuôi
    // XSTT_3CANG_GIAINHAT: 'XSTT_3CANG_GIAINHAT', //- 3 Càng + Giải nhất
    // XSTT_3CANG_DACBIET: 'XSTT_3CANG_DACBIET', //- 3 Càng + Đặc biệt
    // XSTT_4CANG_DACBIET: 'XSTT_4CANG_DACBIET', // - 4 Càng đặc biệt
    // XSTT_LOTRUOT_XIEN4: 'XSTT_LOTRUOT_XIEN4', //- Lô trượt + Trượt xiên 4
    // XSTT_LOTRUOT_XIEN8: 'XSTT_LOTRUOT_XIEN8', //- Lô trượt + Trượt xiên 8
    // XSTT_LOTRUOT_XIEN10: 'XSTT_LOTRUOT_XIEN10', //- Lô trượt + Trượt xiên 10
    // XSST1P_DEFAULT: 'XSST1P_DEFAULT', //XSST1P xổ số siêu tốc 1ph / lần
    // XSST1P_BAOLO_LO2: 'XSST1P_BAOLO_LO2', //- Bao lô:+ Lô 2 số
    // XSST1P_BAOLO_LO3: 'XSST1P_BAOLO_LO3', //- Bao lô:+ Lô 3 số
    // XSST1P_BAOLO_LO4: 'XSST1P_BAOLO_LO4', //- Bao lô:+ Lô 4 số
    // XSST1P_BAOLO_LO2SODAU: 'XSST1P_BAOLO_LO2SODAU', //+ Lô 2 số đầu
    // XSST1P_LOXIEN_XIEN2: 'XSST1P_LOXIEN_XIEN2', //- Lô xiên:+ Xiên 2
    // XSST1P_LOXIEN_XIEN3: 'XSST1P_LOXIEN_XIEN3', //- Lô xiên:+ Xiên 3
    // XSST1P_LOXIEN_XIEN4: 'XSST1P_LOXIEN_XIEN4', //- Lô xiên:+ Xiên 4
    // XSST1P_DE_DEDAUGIAINHAT: 'XSST1P_DE_DEDAUGIAINHAT', //- Đề: + Đề đầu giải nhất
    // XSST1P_DE_DEDACBIET: 'XSST1P_DE_DEDACBIET', //- Đề: + Đề đặc biệt
    // XSST1P_DE_DEDAUDACBIET: 'XSST1P_DE_DEDAUDACBIET', //- Đề: + Đề đầu đặc biệt
    // XSST1P_DE_DEGIAI7: 'XSST1P_DE_DEGIAI7', //- Đề: + Đề giải 7
    // XSST1P_DE_DEGIAINHAT: 'XSST1P_DE_DEGIAINHAT', //- Đề: + Đề giải nhất
    // XSST1P_DE_DAU: 'XSST1P_DE_DAU', // - Đề đầu (giải 8)
    // XSST1P_DE_ĐAUDUOI: 'XSST1P_DE_ĐAUDUOI', // - Đề đầu đuôi
    // XSST1P_DAUDUOI_DAU: 'XSST1P_DAUDUOI_DAU', //- Đầu đuôi + Đầu
    // XSST1P_DAUDUOI_DUOI: 'XSST1P_DAUDUOI_DUOI', //- Đầu đuôi + Đuôi
    // XSST1P_3CANG_DAU: 'XSST1P_3CANG_DAU', //- 3 Càng + Đầu
    // XSST1P_3CANG_DUOI: 'XSST1P_3CANG_DUOI', //- 3 Càng + Đuôi
    // XSST1P_3CANG_GIAINHAT: 'XSST1P_3CANG_GIAINHAT', //- 3 Càng + Giải nhất
    // XSST1P_3CANG_DACBIET: 'XSST1P_3CANG_DACBIET', //- 3 Càng + Đặc biệt
    // XSST1P_3CANG_DAUDUOI: 'XSST1P_3CANG_DAUDUOI', //- 3 Càng + Đầu Đuôi
    // XSST1P_4CANG_DACBIET: 'XSST1P_4CANG_DACBIET', // - 4 Càng đặc biệt
    // XSST1P_LOTRUOT_XIEN4: 'XSST1P_LOTRUOT_XIEN4', //- Lô trượt + Trượt xiên 4
    // XSST1P_LOTRUOT_XIEN8: 'XSST1P_LOTRUOT_XIEN8', //- Lô trượt + Trượt xiên 8
    // XSST1P_LOTRUOT_XIEN10: 'XSST1P_LOTRUOT_XIEN10', //- Lô trượt + Trượt xiên 10
    // BACARAT1P: 'BACARAT1P', //bacarat 1 phút
    // XOCDIA1P: 'XOCDIA1P', //xóc dĩa 1 phút
    // BAUCUA1P: 'BAUCUA1P', //bàu cua 1 phút
  },
  GAME_RECORD_UNIT_BO: {
    BTC: 'BTC-USDT',
    // ETH: 'ETH-USDT',
    // BNB: 'BNB-USDT',
    // XRP: 'XRP-USDT',
    // SHIB: 'SHIB-USDT',
    // DOGE: 'DOGE-USDT',
    // PEPE: 'PEPE-USDT',
    // FLOKI: 'FLOKI-USDT',
  },
  GAME_RECORD_UNIT_CRYPTO_IDX: {
    TOPIDX: 'TOP-IDX-USDT',
    TOPMEME: 'TOP-MEME-USDT',
  },
  CRYPTO_IDX_PACKAGE: {
    TOPIDX: ['BTC', 'ETH', 'BNB', 'XRP'],
    TOPMEME: ['SHIB', 'DOGE', 'PEPE', 'FLOKI'],
  },
  PLACE_RECORD_ERROR: {
    SELECTION_NAME_INVALID: 'SELECTION_NAME_INVALID',
    PLACEBET_FAIL: 'PLACEBET_FAIL',
    ERR_BET_AMOUNT_MIN: 'ERR_BET_AMOUNT_MIN',
    ERR_BET_AMOUNT_MAX: 'ERR_BET_AMOUNT_MAX',
  },
  XSTT_PRODUCT_CHANNEL: {
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
  BONUS_RATE: {
    F1: 0.5,
    F2: 0.25,
    F3: 0.125,
    F4: 0.0625,
    F5: 0.03125,
    F6: 0.015625,
  },
};
