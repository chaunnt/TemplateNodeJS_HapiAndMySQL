/* Copyright (c) 2023 TORITECH LIMITED 2022 */

module.exports = {
  VEHICLE_PROFILE_ERROR: {
    DUPLICATE_VEHICLE: 'DUPLICATE_VEHICLE', //Biển số xe đã được đăng ký
    VEHICLE_NOT_FOUND: 'VEHICLE_NOT_FOUND', //Không tìm thấy thông tin phương tiện
    INVALID_PLATE_NUMBER: 'INVALID_PLATE_NUMBER', //Biển số xe không hợp lệ
    EXISTED_PLATE_NUMBER: 'EXISTED_PLATE_NUMBER', //Biển số xe bi trùng
    EXISTED_ENGINE_NUMBER: 'EXISTED_ENGINE_NUMBER', // Trùng số máy
    EXISTED_REGISTRATION_CODE: 'EXISTED_REGISTRATION_CODE', // Trùng số quản lý
    EXISTED_CHASSIS_NUMBER: 'EXISTED_CHASSIS_NUMBER', // Trùng số khung
    INVALID_VEHICLE_CERTIFICATE: 'INVALID_VEHICLE_CERTIFICATE', // Số seri GCN không hop le
    WRONG_VEHICLE_TYPE: 'WRONG_VEHICLE_TYPE', // Sai loại phương tiện trong giấy đăng kiểm
    INVALID_VEHICLE_EXPIRATION_DATE: 'INVALID_VEHICLE_EXPIRATION_DATE', // Ngay het han khong hop le
  },
  VEHICLE_FILE_TYPE: {
    IMAGE: 1,
    DOCUMENT: 2,
  },
  VEHICLE_FUEL_TYPE: {
    GASOLINE: 1,
    OIL: 2,
  },
};
