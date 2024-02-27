/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';

module.exports = {
  ORDER_STATUS: {
    NEW: 0, //Chưa xác nhận
    CONFIRMED: 10, //Đã xác nhận
    CANCELED: 20, //Đã hủy
    CLOSED: 30, //Đã đóng
  },
  ORDER_PAYMENT_STATUS: {
    NEW: 'New', // Mới
    PROCESSING: 'Processing', // Tính phí thất bại cần xử lý lại
    PENDING: 'Pending', // Đang trong quá trình xử lý
    FAILED: 'Failed', // Thanh toán thất bại
    SUCCESS: 'Success', // Thanh toán thành công
    CANCELED: 'Canceled', // Đã hủy
  },
  TAX_PERCENT: {
    VAT: 10,
  },
  PRODUCT_DATA: {
    ROAD_FEE: {
      id: 10,
      name: 'Phí đường bộ',
    },
    STAMP_PRINTING_FEE: {
      id: 20,
      name: 'Phí in tem',
    },
    INSURANCE_FEE: {
      id: 30,
      name: 'Phí bảo hiểm',
    },
    ACCREDITATION_FEE: {
      id: 40,
      name: 'Phí kiểm định',
    },
  },
};
