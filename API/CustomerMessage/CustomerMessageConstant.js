/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

module.exports = {
  MESSAGE_CATEGORY: {
    SMS: 'SMS',
    EMAIL: 'Email',
    ZNS: 'ZNS',
    APNS: 'APNS',
    SMSSPAM: 'SMSSPAM',
    AUTOCALL: 'AUTOCALL',
  },
  MESSAGE_STATUS: {
    NEW: 'New',
    SENDING: 'Sending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELED: 'Canceled',
    WAITING: 'Waiting',
  },
  MESSAGE_SEND_STATUS: {
    NEW: 'New', //đang chờ
    SENDING: 'Sending', //đang gửi
    COMPLETED: 'Completed', //khách hàng đã nhận
    FAILED: 'Failed', // gửi thất bại
    CANCELED: 'Canceled', // hủy
    SKIP: 'Skip',
  },
  SMS_PROVIDER: {
    VIVAS: 'VIVAS',
    VIETTEL: 'VIETTEL',
    VMG: 'VMG',
  },
  EMAIL_PROVIDER: {
    GMAIL: 'GMAIL',
    CUSTOM: 'CUSTOM',
  },
  MESSAGE_PRICES: {
    SMS: 850,
    EMAIL: 0,
  },
  MESSAGE_ACTION_STATUS: {
    READ: 1,
    UNREAD: 0,
  },
  MESSAGE_REJECT: {
    STATIONS_UNENABLED_SMS: 'STATIONS_UNENABLED_SMS', // Trạm đang tắt tính năng gửi SMS
    STATIONS_UNENABLED_APNS: 'STATIONS_UNENABLED_APNS',
    WRONG_CONFIG: 'WRONG_CONFIG',
    SEND_APNS_FAILED: 'SEND_APNS_FAILED',
    PRICE_NEGATIVE: 'PRICE_NEGATIVE', // giá tiền âm
  },
  MESSAGE_TYPE: {
    VR_VEHICLE_CRIMINAL_WARNING: 1, // Cảnh báo phạt nguội từ cục đăng kiểm
  },
};
