/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

module.exports = {
  GAME_RECORD_STATUS: {
    NEW: 'New',
    WAITING: 'Waiting',
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    DELETED: 'Deleted',
    CANCELED: 'Canceled',
  },
  GAME_RECORD_TYPE: {
    SINGLE: 'SINGLE',
    BATCH: 'BATCH',
  },
  GAME_RATIO: {
    'TONG;3': 207.36,
    'TONG;4': 69.12,
    'TONG;5': 34.56,
    'TONG;6': 20.74,
    'TONG;7': 13.83,
    'TONG;8': 9.88,
    'TONG;9': 8.3,
    'TONG;10': 7.68,
    'TONG;11': 7.68,
    'TONG;12': 8.3,
    'TONG;13': 9.88,
    'TONG;14': 13.83,
    'TONG;15': 20.74,
    'TONG;16': 34.56,
    'TONG;17': 69.12,
    'TONG;18': 207.36,
    'TONG;LON': 1.92,
    'TONG;NHO': 1.92,
    'TONG;LE': 1.92,
    'TONG;CHAN': 1.92,
    '2SOTRUNGCAP': 13.83,
    '2SOTRUNGCAPSO': 69.12,
    '3SOTRUNGDUYNHAT': 207.36,
    '3SOMIENLAGIONGNHAU': 34.56,
    '3SOLIENTIEP': 8.64,
    '3SOTRUNGKHACNHAU': 34.56,
    '2SOTRUNGKHACNHAU': 6.91,
    XANH: 2,
    DO: 1.5,
    TIM: 1.5,
    LON: 1.5,
    NHO: 1.5,
  },
  GAME_RESULT: {
    G8: 'G8',
    G7: 'G7',
    G6: 'G6',
    G5: 'G5',
    G4: 'G4',
    G3: 'G3',
    G2: 'G2',
    G1: 'G1',
    GDB: 'GDB',
    GPDB: 'GPDB',
    GKK: 'GKK',
  },
  KENO_RESULT: {
    // bảng giá cho 10.000đ, lấy giá trị nhân cho 10.000
    // keno cơ bản
    //chọn bao nhiêu số - trúng bao nhiêu số
    BASIC_1_1: 2,
    BASIC_2_2: 9,
    BASIC_3_2: 2,
    BASIC_3_3: 20,
    BASIC_4_2: 1,
    BASIC_4_3: 5,
    BASIC_4_4: 40,
    BASIC_5_3: 1,
    BASIC_5_4: 15,
    BASIC_5_5: 440,
    BASIC_6_3: 1,
    BASIC_6_4: 4,
    BASIC_6_5: 45,
    BASIC_6_6: 1250,
    BASIC_7_3: 1,
    BASIC_7_4: 2,
    BASIC_7_5: 10,
    BASIC_7_6: 120,
    BASIC_7_7: 4000,
    BASIC_8_0: 1,
    BASIC_8_4: 1,
    BASIC_8_5: 5,
    BASIC_8_6: 50,
    BASIC_8_7: 500,
    BASIC_8_8: 20000,
    BASIC_9_0: 1,
    BASIC_9_4: 1,
    BASIC_9_5: 3,
    BASIC_9_6: 15,
    BASIC_9_7: 150,
    BASIC_9_8: 1200,
    BASIC_9_9: 80000,
    BASIC_10_0: 1,
    BASIC_10_5: 2,
    BASIC_10_6: 8,
    BASIC_10_7: 71,
    BASIC_10_8: 800,
    BASIC_10_9: 15000,
    BASIC_10_10: 200000,
    // keno lớn nhỏ
    BIGSMALL_BIG_13: 2.6,
    BIGSMALL_BIG_11_12: 1,
    BIGSMALL_10_10: 2.6,
    BIGSMALL_SMALL_11_12: 1,
    BIGSMALL_SMALL_13: 2.6,
    // keno chẵn lẽ
    EVENODD_EVEN_15: 20,
    EVENODD_EVEN_13_14: 4,
    EVENODD_EVEN_11_12: 2,
    EVENODD_10_10: 2,
    EVENODD_ODD_11_12: 2,
    EVENODD_ODD_13_14: 4,
    EVENODD_ODD_15: 20,
  },
  XOSOSIEUTOC_RESULT: {
    // bảng giá cho 10.000đ, lấy giá trị nhân cho 10.000
    G8: 10,
    G7: 20,
    G6: 40,
    G5: 100,
    G4: 300,
    G3: 1000,
    G2: 1500,
    G1: 3000,
    GDB: 200000,
    GAU: 5000,
    GKK: 600,
  },
  GAME_SECTION_TIME_DISPLAY_FORMAT: 'YYYYMMDDHHmmss',
  GAME_SECTION_START_TIME: '20230101',
};
