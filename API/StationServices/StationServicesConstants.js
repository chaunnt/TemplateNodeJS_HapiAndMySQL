/* Copyright (c) 2023 TORITECH LIMITED 2022 */

module.exports = {
  STATION_SERVICE_ERRORS: {
    DUPLICATE_SERVICE: 'DUPLICATE_SERVICE',
  },
  SERVICE_TYPES: {
    CHECKING_VIOLATION: 1, // Tra cứu phạt nguội
    CREATE_TAG_VETC: 2, // Dán thẻ VETC
    PAY_VIOLATION_FEE: 3, // Đóng phí phạt nguội
    EXTEND_INSURANCE_TNDS: 4, // Gia hạn bảo hiểm TNDS
    PAY_VETC_FEE: 5, // Đóng phí VETC
    EXTEND_ISSURANCE_BODY: 6, //Gia hạn BH thân vỏ,
    REPAIR_SERVICE: 7, //Bảo dưỡng, sửa chữa xe cơ giới,
    INSPECT_CAR: 8, //Đăng kiểm xe cơ giới
    PAY_EPASS_FEE: 9, //Nạp tiền ePass
    HELP_SERVICE: 10, //Cứu hộ xe bị hư hỏng
    CONSULTATION_IMPROVEMENT: 11, // Tư vấn hoán cải
  },
};
