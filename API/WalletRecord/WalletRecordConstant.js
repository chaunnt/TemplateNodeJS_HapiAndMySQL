/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';

module.exports = {
  WALLET_RECORD_TYPE: {
    REFER_BONUS: 'REFER_BONUS', // hoa hồng
    EVENT_BONUS: 'EVENT_BONUS', // thưởng do tham gia 1 hoạt động gì đó (giới thiệu, sự kiện ..v.v)
    ADMIN_BONUS: 'ADMIN_BONUS', // admin thưởng vi lý do gì đó
    EARNED: 'EARNED', // đào được, khai thác được, kiếm được,
    MAKE_PAYMENT: 'MAKE_PAYMENT', // thanh toan tien
    ADMIN_ADJUST: 'ADMIN_ADJUST', //Admin điều chỉnh
    PAYMENT_DEPOSIT: 'PAYMENT_DEPOSIT', //User nạp tiền
    PAYMENT_WITHDRAW: 'PAYMENT_WITHDRAW', //User rút tiền
    PAYMENT_EXCHANGE: 'PAYMENT_EXCHANGE', //User đổi tiền
    DEPOSIT_POINTWALLET: 'DEPOSIT_POINTWALLET', //User nạp tiền ví chính
    WITHDRAW_POINTWALLET: 'WITHDRAW_POINTWALLET', //User rút tiền ví chính
    WITHDRAW_BONUSWALLET: 'WITHDRAW_BONUSWALLET', //User rút tiền ví hoa hồng
    WITHDRAW_REWARDWALLET: 'WITHDRAW_REWARDWALLET', //User rút tiền ví khuyen mai
    WITHDRAW_WINWALLET: 'WITHDRAW_WINWALLET', //User rút tiền ví thưởng
    BONUS_EXCHANGE_POINT: 'BONUS_EXCHANGE_POINT', //chuyển tiền hoa hồng sang ví chínhs
    DEPOSIT_POINTWALLET_FROM_BONUS: 'DEPOSIT_POINTWALLET_FROM_BONUS', // tien nap tu vi hoa hong vao
  },
  PAYMENT_AMOUNT: {
    PAYMENT_AMOUNT_IN: 1, // tien ra
    PAYMENT_AMOUNT_OUT: 1, // tien vao
    PAYMENT_AMOUNT_IN_OUT: 0, // ca hai
  },
};
