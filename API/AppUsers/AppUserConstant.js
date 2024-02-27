/* Copyright (c) 2022-2023 Reminano */

module.exports = {
  USER_VERIFY_INFO_STATUS: {
    NOT_VERIFIED: 0,
    IS_VERIFIED: 1,
    VERIFYING: 2,
    REJECTED: 3,
  },
  USER_SEX: {
    MALE: 0,
    FEMALE: 1,
  },
  USER_TYPE: {
    NOMAL: 0,
    EXPERT: 1,
  },
  USER_REFUND_PLAY: {
    WAITING: 0,
    REFUND: 1,
  },
  USER_STATUS: {
    BLOCKED: 0,
    ACTIVATED: 1,
  },
  USER_BLOCK_ACTION: {
    BLOCK: 5,
    UNBLOCK: 0,
  },
  USER_VERIFY_EMAIL_STATUS: {
    NOT_VERIFIED: 0,
    IS_VERIFIED: 1,
    VERIFYING: 2,
    REJECTED: 3,
  },
  USER_VERIFY_PHONE_NUMBER_STATUS: {
    NOT_VERIFIED: 0,
    IS_VERIFIED: 1,
    VERIFYING: 2,
    REJECTED: 3,
  },
  USER_MEMBER_LEVEL: {
    MEMBER: 'Member',
    AGENCY: 'Agency',
  },
  USER_ERROR: {
    DUPLICATED_USER: 'DUPLICATED_USER', //Trùng tài khoản
    DUPLICATED_USER_EMAIL: 'DUPLICATED_USER_EMAIL', //Trùng email
    DUPLICATED_USER_PHONE: 'DUPLICATED_USER_PHONE', //Trùng số điện thoại
    DUPLICATED_USER_FIRSTNAME: 'DUPLICATED_USER_FIRSTNAME', //Trùng biệt danh
    INVALID_REFER_USER: 'INVALID_REFER_USER', //Mã giới thiệu không đúng
    NOT_AUTHORIZED: 'NOT_AUTHORIZED', //Không có quyền
    USER_LOCKED: 'USER_LOCKED', //Tài khoản bị khóa
    NOT_VERIFIED_EMAIL: 'NOT_VERIFIED_EMAIL', //Chưa xác thực email
    NOT_VERIFIED_PHONE: 'NOT_VERIFIED_PHONE', //Chưa xác thực số điện thoại
    REFER_USER_NOT_FOUND: 'REFER_USER_NOT_FOUND', //Mã giới thiệu không đúng
    OTP_NOT_FOUND: 'OTP_NOT_FOUND', //OTP không đúng
    NOT_UPGRADED: 'NOT_UPGRADED', //Chưa nâng cấp tài khoản
    WITHDRAW_AND_FEE: 'WITHDRAW_AND_FEE', //Rút tiền mất phí
    BALANCE_NOT_ENOUGH: 'BALANCE_NOT_ENOUGH', //Số dư tài khoản không đủ
    WALLET_NOT_FOUND: 'WALLET_NOT_FOUND', //Không tìm thấy ví
    NOT_ALLOWED_DEPOSIT: 'NOT_ALLOWED_DEPOSIT', //Không được phép nạp tiền
    NOT_ALLOWED_WITHDRAW: 'NOT_ALLOWED_WITHDRAW', //Không được phép rút tiền
    BLOCKED_WITHDRAW: 'BLOCKED_WITHDRAW', //Khóa rút tiền
    USER_BLOCKED_WITHDRAW_BANK: 'USER_BLOCKED_WITHDRAW_BANK', //Khóa rút tiền về ngân hàng
    USER_BLOCKED_WITHDRAW_CRYPTO: 'USER_BLOCKED_WITHDRAW_CRYPTO', //KHóa rút tiền về ví điện tử
    LOGIN_FAIL: 'LOGIN_FAIL', //Đăng nhập thất bại
    USER_BLOCKED: 'USER_BLOCKED', //khóa tài khoản login sai quá 5 lần
    USER_NOT_FOUND: 'USER_NOT_FOUND', //Không tìm thấy thông tin người dùng
    FORGOT_PASSWORD_FAIL: 'FORGOT_PASSWORD_FAIL', //Quên mật khẩu thất bại
    MAX_LIMITED_RESET_PASSWORD: 'MAX_LIMITED_RESET_PASSWORD', //Quá số lần cho phép quên mật khẩu
    MAX_LIMITED_RESET_SECONDARY_PASSWORD: 'MAX_LIMITED_RESET_SECONDARY_PASSWORD', //Quá số lần cho phép quên mật khẩu giao dịch
    USER_UPDATE_FAILED: 'USER_UPDATE_FAILED',
    SEARCH_DATE_LIMIT: 'SEARCH_DATE_LIMIT',
  },
  USER_MEMBER_LEVEL: {
    LV0: 'LV0',
    LV1: 'LV1',
    LV2: 'LV2',
    LV3: 'LV3',
    LV4: 'LV4',
    LV5: 'LV5',
    LV6: 'LV6',
    LV7: 'LV7',
    LV8: 'LV8',
    LV9: 'LV9',
    LV10: 'LV10',
  },
  USER_CATEGORY_ID: {
    VIP_USER: 1,
    NORMAL_USER: 0,
  },
  USER_CATEGORY: {
    VIRTUAL_USER: 1,
    NORMAL_USER: 0,
  },
  WITHDRAWAL_REQUEST: {
    ALLOWED: 1,
    NOT_ALLOWED: 0,
  },
  DEPOSIT_REQUEST: {
    ALLOWED: 1,
    NOT_ALLOWED: 0,
  },
  MAX_RESET_PASSWORD_LIMITED: 3,
  IP_ADDRESS_TYPE: {
    REGISTER: 1,
    LOGIN: 2,
    DEPOSIT: 3,
    WITHDRAW: 4,
  },
};
