/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

module.exports = {
  BOOK_VIEW_STATUS: {
    NORMAL: 0,
    HOT: 1,
  },
  BOOK_UPDATE_STATUS: {
    UPDATING: 0,
    COMPLETE: 1,
  },
  SCHEDULE_STATUS: {
    NEW: 0, //Chưa xác nhận
    CONFIRMED: 10, //Đã xác nhận
    CANCELED: 20, //Đã hủy
    CLOSED: 30, //Đã đóng
  },
  SCHEDULE_ERROR: {
    INVALID_STATION: 'INVALID_STATION', //Thiếu thông tin trạm
    INVALID_BOOKING_CONFIG: 'INVALID_BOOKING_CONFIG', //Lịch hẹn đã đầy
    BOOKING_MAX_LIMITED_BY_CONFIG: 'BOOKING_MAX_LIMITED_BY_CONFIG', //Lịch hẹn không được vượt giới hạn
    BOOKING_MAX_LIMITED: 'BOOKING_MAX_LIMITED', //Lịch hẹn đạt số lượng tối đa
    UNCONFIRMED_BOOKING_EXISTED: 'UNCONFIRMED_BOOKING_EXISTED', //Có lịch hẹn chưa được xác nhận, không được đặt thêm
    INVALID_DATE: 'INVALID_DATE', //Ngày hẹn không hợp lệ
    BLOCK_USER_BOOKING_SCHEDULE: 'BLOCK_USER_BOOKING_SCHEDULE', //Người dùng bị khóa đặt lịch
    BOOKING_ON_DAY_OFF: 'BOOKING_ON_DAY_OFF', //Ngày hẹn là ngày nghỉ (không làm việc)
    BOOKING_ON_SUNDAY: 'BOOKING_ON_SUNDAY', //Ngày hẹn là chủ nhật (không làm việc)
    INVALID_PLATE_NUMBER: 'INVALID_PLATE_NUMBER', // Biển số xe không hợp lệ
    INVALID_REQUEST: 'INVALID_REQUEST', //Đặt lịch thất bại
    MAX_LIMIT_SCHEDULE_BY_USER: 'MAX_LIMIT_SCHEDULE_BY_USER', //Số lượng lịch hẹn của người dùng quá giới hạn
    MAX_LIMIT_SCHEDULE_BY_PHONE: 'MAX_LIMIT_SCHEDULE_BY_PHONE', //Số lượng lịch hẹn của số điện thoại quá giới hạn
    MAX_LIMIT_SCHEDULE_BY_PLATE_NUMBER: 'MAX_LIMIT_SCHEDULE_BY_PLATE_NUMBER', //Số lượng lịch hẹn của biển số xe quá giới hạn
    ALREADY_CANCEL: 'ALREADY_CANCEL', //Lịch hẹn đã hủy trước đó
    CONFIRMED_BY_STATION_STAFF: 'CONFIRMED_BY_STATION_STAFF', //Đã được trung tâm xác nhận
    EARLY_BOOKING: 'EARLY_BOOKING', // đặt lịch hẹn sớm hơn 10 ngày so với hạn GCN
    BLOCK_BOOKING_BY_PHONE: 'BLOCK_BOOKING_BY_PHONE', // chặn đặt lịch cho tài khoản bị khóa
    INVALID_BOOKING_DATE: 'INVALID_BOOKING_DATE', //Ngày hẹn không hợp lệ
    BOOKING_ON_TODAY: 'BOOKING_ON_TODAY', //Đã được trung tâm xác nhận
    MAX_LIMIT_SCHEDULE_BY_VEHICLE_COUNT: 'MAX_LIMIT_SCHEDULE_BY_VEHICLE_COUNT', //BSX có quá nhiều lịch hẹn
    INVALID_CERTIFICATE_SERIES: 'INVALID_CERTIFICATE_SERIES', //Số seri GCN không hợp lệ
    STATION_NOT_ACCEPT_VEHICLE: 'STATION_NOT_ACCEPT_VEHICLE', // Trạm chỉ xử lý xe < 16 chỗ ngồi hoặc < 1.5 tấn
    MISSING_VEHICLE_INFO: 'MISSING_VEHICLE_INFO', //Thiếu thông tin phương tiện
    IP_ADDRESS_NOT_ALLOWED: 'IP_ADDRESS_NOT_ALLOWED', //Địa chỉ IP bị khóa
    INVALID_SCHEDULE_FILTER_DATE: 'INVALID_SCHEDULE_FILTER_DATE', //Không được tìm kiếm quá 30 ngày
    NO_SERVICE_STATION: 'NO_SERVICE_STATION', //Không có trạm nào mở dịch vụ này"
    INVALID_PAST_DATE_ERROR: 'INVALID_PAST_DATE_ERROR', // Ngày không hợp lệ đã ở quá khứ
    STATION_NOT_ACCEPTED_VEHICLE_TYPE: 'STATION_NOT_ACCEPTED_VEHICLE_TYPE', // Trạm không nhận kiểm định loại xe này

    // Đặt lịch qua SMS
    INVALID_API_KEY: 'INVALID_API_KEY', // Api key không hợp lệ
    INVALID_SCHEDULE_DATA: 'INVALID_SCHEDULE_DATA', // Dât không hợp lệ
    ERROR_RECEIVE_SCHEDULE_SMS_DISABLED: 'ERROR_RECEIVE_SCHEDULE_SMS_DISABLED', // Trạm không bật nhận lịch qua SMS
    INVALID_TIME: 'INVALID_TIME', // Không có giờ hẹn phù hợp (trạm không nhận lịch, lịch đã đầy,...)
  },
  LICENSE_PLATE_COLOR: {
    WHITE: 1,
    BLUE: 2,
    YELLOW: 3,
    RED: 4,
  },
  VEHICLE_TYPE: {
    CAR: 1,
    OTHER: 10,
    RO_MOOC: 20,
  },
  SCHEDULE_TIME_STATUS: {
    AVALIABLE: 1,
    FULL: 0,
  },
  SCHEDULE_CACHE_KEYS: {
    SCHEDULE_COUNT_BY_STATION_ID: 'SCHEDULE_COUNT_BY_STATION_ID',
    SCHEDULE_COUNT_BY_USER_ID: 'SCHEDULE_COUNT_BY_USER_ID',
    SCHEDULE_COUNT_BY_PHONE: 'SCHEDULE_COUNT_BY_PHONE',
    SCHEDULE_COUNT_BY_PLATE_NUMBER: 'SCHEDULE_COUNT_BY_PLATE_NUMBER',
    SUCCESS_SCHEDULE_COUNT_BY_STATION: 'successBookingsCount_{stationsId}_{scheduleDate}_{vehicleType}',
  },
  SCHEDULE_TYPE: {
    VEHICLE_INSPECTION: 1, // Đăng kiểm xe cũ
    NEW_VEHICLE_INSPECTION: 2, // đăng kiểm xe mới
    REGISTER_NEW_VEHICLE: 3, // nộp hồ sơ xe mới
    CHANGE_REGISTATION: 4, // Đổi mục đích sử dụng, đổi chủ, đổi thông tin hồ sơ
    // PAY_ROAD_FEE: 5, // Thanh toán phí đường bộ
    // PAY_INSURRANCE_FEE: 6, // Thanh toán phí bảo hiểm
    CONSULTANT_MAINTENANCE: 7, // Đặt lịch tư vấn bảo dưỡng
    CONSULTANT_INSURANCE: 8, // Đặt lịch tư bảo hiểm
    CONSULTANT_RENOVATION: 9, // Đặt lịch tư vấn hoán cải
    LOST_REGISTRATION_PAPER: 10, // Mất giấy đăng kiểm
    REISSUE_INSPECTION_STICKER: 11, // Cấp lại tem đăng kiểm
    VEHICLE_INSPECTION_CONSULTATION: 12, // Tư vấn đăng kiểm xe
    TRAFFIC_FINE_CONSULTATION: 13, // Tư vấn xử lý phạt nguội
  },
  PERFORMER_TYPE: {
    ADMIN: 1, // quan tri vien
    STATION_STAFF: 2, // nhan vien tram
    CUSTOMER: 3, // khach hang
    AUTO: 4, // tu dong
  },
  VEHICLE_TYPES: {
    CAR: 1,
    TRUCK: 2,
    MIX: 3,
  },
  COST_TYPES: {
    NET_COST: 1,
    GROSS_COST: 2,
  },
  FOR_BUSINESS: {
    HAVE: 1,
    NOT_HAVE: 0,
  },
  SCHEDULE_NOTE: {
    INSPECTION_FEE: 'Thanh toán phí đăng kiểm',
    ROAD_FEE: 'Thanh toán phí đường bộ',
    INSURANCE_FEE: 'Thanh toán phí bảo hiểm',
  },
  SET_HOURS: {
    MID_DAY: 12,
  },
  INVALID_PAST_DATE_ERROR: 'INVALID_PAST_DATE_ERROR', // Ngày không hợp lệ đã ở quá khứ
};
