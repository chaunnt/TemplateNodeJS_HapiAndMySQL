/* Copyright (c) 2022-2023 Reminano */

module.exports = {
  ROLE_NAME: {
    SUPER_ADMIN: 1,
    CSKH: 2,
    OPERATOR: 3,
    TONG_DAILY: 5,
  },
  PERMISSION_NAME: {
    VIEW_ALL_USERS: 'VIEW_ALL_USERS',
    VIEW_USERS: 'VIEW_USERS',
    APPROVE_DEPOSIT: 'APPROVE_DEPOSIT',
    APPROVE_WITHDRAW: 'APPROVE_WITHDRAW',
    VIEW_ALL_DEPOSIT: 'VIEW_ALL_DEPOSIT', //được phép xem toàn bộ giao dịch nạp tiền của toàn hệ thống
    VIEW_TRANSACTION_DEPOSIT_BANK: 'VIEW_TRANSACTION_DEPOSIT_BANK', //được phép xem toàn bộ giao dịch nạp tiền BANK của toàn hệ thống
    VIEW_TRANSACTION_DEPOSIT_USDT: 'VIEW_TRANSACTION_DEPOSIT_USDT', //được phép xem toàn bộ giao dịch nạp tiền USDT của toàn hệ thống
    VIEW_ALL_WITHDRAW: 'VIEW_ALL_WITHDRAW', //được phép xem toàn bộ giao dịch rút tiền của toàn hệ thống
    VIEW_TRANSACTION_WITHDRAW_BANK: 'VIEW_TRANSACTION_WITHDRAW_BANK', //được phép xem toàn bộ giao dịch rút tiền BANK của toàn hệ thống
    VIEW_TRANSACTION_WITHDRAW_USDT: 'VIEW_TRANSACTION_WITHDRAW_USDT', //được phép xem toàn bộ giao dịch rút tiền USDT của toàn hệ thống
  },
};
