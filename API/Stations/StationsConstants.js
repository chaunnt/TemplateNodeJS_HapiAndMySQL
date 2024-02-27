/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

module.exports = {
  STATION_STATUS: {
    ACTIVE: 1,
    BLOCK: 0,
  },
  AVAILABLE_STATUS: {
    UNAVAILABLE: 0,
    AVAILABLE: 1,
    DEFAULT: 2,
  },
  STATION_TYPE: {
    EXTERNAL: 1, //Trung tâm đăng kiểm
    INTERNAL: 2, //Nội bộ TTDK
    GARAGE: 3, //Garage
    HELPSERVICE: 4, //cứu hộ
    INSURANCE: 5, // Đơn vị Bảo hiểm
    CONSULTING: 6, // Đơn vị tư vấn
    AFFILIATE: 7, // Đơn vị liên kết
    ADVERTISING: 8, // Đơn vị quảng cáo
    COOPERATIVE: 9, // Hợp tác xã
    USED_VEHICLES_DEALERSHIP: 10, // Đơn vị mua bán xe cũ
    SPARE_PARTS_DEALERSHIP: 11, // Mua bán phụ tùng ô tô
    PARKING_LOT: 12, // Bãi giữ xe
    VEHICLE_MODIFICATION: 13, // Đơn vị cải tạo xe
    DRIVING_SCHOOL: 14, // Trường học lái xe
    CHAUFFEUR_SERVICE: 15, // Dịch vụ lái xe hộ
    PARTS_MANUFACTURING_CONSULTANCY: 16, // Tư vấn sản xuất phụ tùng xe
    DRIVER_HEALTH: 17, //  Khám sức khoẻ lái xe
  },
  STATION_CONTACT_STATUS: {
    NEW: 1, //Mới
    PROCESSING: 10, //Đang xử lý
    PENDING: 20, //Chưa hoàn tất hợp đồng
    COMPLETED: 30, //Đã hoàn tất hợp đồng
    CANCELED: 40, //Không ký hợp đồng
    DESTROYED: 50, //Đã huỷ hợp đồng
  },
  VERIFY_STATUS: {
    // Chưa đăng ký với bộ công thương
    NOT_REGISTER: 0,

    // Đã đăng ký với bộ công thương
    REGISTER: 1,

    // Đã đăng ký và được xác nhận bởi bộ công thương
    VERIFY: 2,
  },
  STATION_ERROR: {
    INVALID_STATION: 'INVALID_STATION', //không tìm thấy trạm
    WRONG_BOOKING_CONFIG: 'WRONG_BOOKING_CONFIG', //Tìm lịch hẹn không phù hợp
    DUPICATE_STATION_CODE: 'DUPICATE_STATION_CODE', //Trùng stationCode
  },
  BOOKING_STATUS: {
    AVAILABLE: 1,
    FULL: 0,
  },
  BOOKING_ENABLE: 1,
  BOOKING_ON_CURRENT_DATE: {
    ENABLE: 1,
    DISABLE: 0,
  },
  BOOKING_OVER_LIMIT: {
    ENABLE: 1,
    DISABLE: 0,
  },
  AUTO_CONFIRM_SCHEDULE: {
    ENABLE: 1,
    DISABLE: 0,
  },
  BOOKING_MIXTURE_SCHEDULE: {
    ENABLE: 1,
    DISABLE: 0,
  },
  PAYMENT_TYPES: {
    CASH: 1, // Thanh toán bằng tiền mặt
    BANK_TRANSFER: 2, // Chuyển tiền qua tài khoản ngân hàng
    VNPAY_PERSONAL: 3, // Chuyển tiền qua VNPAY
    CREDIT_CARD: 4, // Thanh toán bằng thẻ tín dụng
    MOMO_PERSONAL: 5, // Chuyển tiền qua MoMo
    ATM_TRANSFER: 6, // Thanh toán bằng thẻ nội địa (ATM)
    MOMO_BUSINESS: 7, // Thanh toán qua MoMo
  },
  SETTING_STATUS: {
    ENABLE: 1,
    DISABLE: 0,
  },
  AREA_PERMISSION: {
    ALL_AREA: 'ALL',
    NO_AREA: undefined,
  },
  TYPE_PERMISSION: {
    ALL_STATION_TYPE: 'ALL',
    NO_AREA: undefined,
  },
};
