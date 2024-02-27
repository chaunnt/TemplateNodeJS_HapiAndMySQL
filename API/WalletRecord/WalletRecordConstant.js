/* Copyright (c) 2022-2024 Reminano */

'use strict';

module.exports = {
  WALLET_RECORD_TYPE: {
    REFER_BONUS: 'REFER_BONUS', // Thưởng hoa hồng
    EVENT_BONUS: 'EVENT_BONUS', // Thưởng sự kiện
    ADMIN_ADJUST: 'ADMIN_ADJUST', //Admin điều chỉnh
    ADMIN_ADJUST_ADD: 'ADMIN_ADJUST_ADD', //Admin tặng tiền
    ADMIN_ADJUST_SUBTRACT: 'ADMIN_ADJUST_SUBTRACT', //Admin giảm tiền
    DEPOSIT_POINTWALLET: 'DEPOSIT_POINTWALLET', //Nạp tiền ví chính
    WITHDRAW_FEE: 'WITHDRAW_FEE', //Phí rút tiền
    WITHDRAW_POINTWALLET: 'WITHDRAW_POINTWALLET', //Rút tiền ví chính
    WITHDRAW_BONUSWALLET: 'WITHDRAW_BONUSWALLET', //Rút tiền hoa hồng
    WITHDRAW_REWARDWALLET: 'WITHDRAW_REWARDWALLET', //Rút tiền thưởng
    WITHDRAW_WINWALLET: 'WITHDRAW_WINWALLET', //Rút tiền thắng
    REFUND: 'REFUND', //Hoàn tiền
    ENOUGH_PLAYROUND_REFUND: 'ENOUGH_PLAYROUND_REFUND', //Hoàn tiền
    PLAY_GAME: 'PLAY_GAME', //Sử dụng tiền,
    PLAY_GAME_MISSION: 'PLAY_GAME_MISSION', //Sử dụng tiền chơi nhiệm vụ,
    PLAY_WIN: 'PLAY_WIN', //Thắng cược
    PLAY_MISSION_WIN: 'PLAY_MISSION_WIN', //Thắng cược nhiệm vụ
    MAKE_PAYMENT: 'MAKE_PAYMENT', //Thanh toán,
    BONUS_EXCHANGE_POINT: 'BONUS_EXCHANGE_POINT', //Chuyển tiền đến ví chính
    USER_UPGRADE: 'USER_UPGRADE', // nâng cấp quyền đại lý
    MISSON_COMPLETED: 'MISSON_COMPLETED', //Hoàn thành nhiệm vụ
    MISSON_REFERRAL_COMPLETED: 'MISSON_REFERRAL_COMPLETED', //Hoa hồng F1 hoàn thành nhiệm vụ
  },
  PAYMENT_AMOUNT: {
    PAYMENT_AMOUNT_IN: 1, // tien ra
    PAYMENT_AMOUNT_OUT: 2, // tien vao
    PAYMENT_AMOUNT_IN_OUT: 0, // ca hai
  },
};
