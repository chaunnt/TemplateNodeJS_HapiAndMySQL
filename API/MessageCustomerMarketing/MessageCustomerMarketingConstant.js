/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

module.exports = {
  MARKETING_MESSAGE_ERROR: {
    LACK_OF_KEY_FOR_TEMPLATE: 'LACK_OF_KEY_FOR_TEMPLATE', //Dữ liệu gửi tin nhắn bị thiếu so với tin mẫu
    DATA_OF_MESSAGE_MISMATCH_WITH_TEMPLATE: 'DATA_OF_MESSAGE_MISMATCH_WITH_TEMPLATE', //Dữ liệu gửi tin nhắn không phù hợp với tin mẫu
    STATIONS_UNENABLED_SMS: 'STATIONS_UNENABLED_SMS', //Trung tâm chưa đăng ký tính năng gửi SMS
    STATIONS_UNENABLED_ZNS: 'STATIONS_UNENABLED_ZNS', //Trung tâm chưa đăng ký tính năng gửi ZNS
    STATIONS_UNENABLED_APNS: 'STATIONS_UNENABLED_APNS', //Trung tâm chưa đăng ký tính năng gửi APNS
    WRONG_CONFIG: 'WRONG_CONFIG',
    SEND_APNS_FAILED: 'SEND_APNS_FAILED',
    SEND_ZNS_FAILED: 'SEND_ZNS_FAILED',
    PRICE_NEGATIVE: 'PRICE_NEGATIVE', // giá tiền âm
    INVALID_TEMPLATE: 'INVALID_TEMPLATE', // Sai mẫu tin nhắn
    INVALID_MESSAGE: 'INVALID_MESSAGE', // tin nhắn không tồn tại
    INVALID_TEMPLATE_ID: 'INVALID_TEMPLATE_ID', // Sai templateID
    UPDATE_FAILED: 'UPDATE_FAILED',
    EXCEED_QUANTITY_MESSAGE: 'EXCEED_QUANTITY_MESSAGE',
    STATION_NOT_FOUND: 'STATION_NOT_FOUND',
    MISSING_DATA: 'MISSING_DATA',
  },
  MARKETING_MESSAGE_CATEGORY: {
    SMS_CSKH: 10,
    ZALO_CSKH: 20,
    APNS: 30,
    EMAIL: 40,
    SMS_PROMOTION: 50,
    ZALO_PROMOTION: 60,
    PHONE_CALL: 70,
  },
  MESSAGE_STATUS: {
    NEW: 'New',
    SENDING: 'Sending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELED: 'Canceled',
    WAITING: 'Waiting',
  },
  MARKETING_MESSAGE_SEND_STATUS: {
    NEW: 1, //Đang chờ
    SENDING: 10, //Đang gửi đi
    COMPLETED: 50, //Hoàn tất
    FAILED: 20, // Gửi thất bại
    CANCELED: 30, // Đã hủy
    SKIP: 40, //Tạm ngưng
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
  MESSAGE_TYPE: {
    VR_VEHICLE_CRIMINAL_WARNING: 1, // Cảnh báo phạt nguội từ cục đăng kiểm
    PROMOTIONAL_NOTIFICATION: 2, // Thông báo khuyến mãi
    NOTIFY_CRIMINAL_WARNING_SCHEDULE: 3, // Thông báo lịch hẹn có xe bị phạt nguội trước khi đăng kiểm
  },
};
