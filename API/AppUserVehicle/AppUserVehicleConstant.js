/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

module.exports = {
  STRICT_MODE: {
    ENABLE: 1,
    DISABLE: 0,
  },
  USER_VEHICLE_ERROR: {
    DUPLICATE_VEHICLE: 'DUPLICATE_VEHICLE', //Biển số xe đã được đăng ký (biển số của chính user)
    DUPLICATE_IDENTITY: 'DUPLICATE_IDENTITY', //Biển số xe đã được đăng ký (biển số đẫ được người khác đăng ký)
    VEHICLE_NOT_FOUND: 'VEHICLE_NOT_FOUND', //Không tìm thấy thông tin phương tiện
    INVALID_PLATE_NUMBER: 'INVALID_PLATE_NUMBER', //Biển số xe không hợp lệ
    MAX_OWNER_VEHICLE: 'MAX_OWNER_VEHICLE', //Vượt quá số lượng xe cho phép
    MAX_LIMIT_ACCESS: 'MAX_LIMIT_ACCESS',
    INVALID_INPUT: 'INVALID_INPUT',
    NO_DATA: 'NO_DATA',
    INVALID_VEHICLE_CERTIFICATE: 'INVALID_VEHICLE_CERTIFICATE', //Số seri GCN không trùng khớp với BSX
    WRONG_VEHICLE_TYPE: 'WRONG_VEHICLE_TYPE', //Sai loại phương tiện trong giấy đăng kiểm
    INVALID_VEHICLE_EXPIRATION_DATE: 'INVALID_VEHICLE_EXPIRATION_DATE', // ngay het han khong hop le
    WRONG_SUB_CATEGORY: 'WRONG_SUB_CATEGORY', //Phân loại xe không đúng
  },
  VERIFICATION_STATUS: {
    NOT_VERIFIED: 0,
    VERIFIED: 1,
  },
  VERIFICATION_STATUS: {
    NOT_VERIFIED: 0, //Chưa kiểm tra
    VERIFIED: 1, //Đã kiểm tra + có dữ liệu
    VERIFIED_BUT_NO_DATA: -1, //Đã kiểm tra nhưng không có dữ liệu
    VERIFIED_BUT_WRONG_EXPIRE_DATE: -2, //Đã kiểm tra nhưng sai ngày hết hạn
    VERIFIED_BUT_WRONG_VEHICLE_TYPE: -10, //Đã kiểm tra nhưng sai loai phuong tien
    VERIFIED_BUT_ERROR: -3, //Đã kiểm tra nhưng thất bại
    NOT_VALID_SERIAL: -20,
  },
  VEHICLE_PLATE_TYPE: {
    WHITE: 'WHITE', //Trắng
    YELLOW: 'YELLOW', //Vàng
    BLUE: 'BLUE', //Xanh
    RED: 'RED', //Đỏ
  },
  VEHICLE_TYPE: {
    CAR: 1,
    OTHER: 10,
    RO_MOOC: 20,
  },
  VEHICLE_SUB_TYPE: {
    CAR: 1, //'Xe ô tô con',
    OTHER: 10, //'Xe bán tải, phương tiện khác',
    XE_KHACH: 11, //'Xe khách'
    XE_TAI: 12, //'Xe tải'
    XE_TAI_DOAN: 13, //'Đoàn ô tô (ô tô đầu kéo + sơ mi rơ mooc)',
    XE_BAN_TAI: 14, //'Xe bán tải
    RO_MOOC: 20, //label: 'Rơ moóc và sơ mi rơ moóc',
  },
  VEHICLE_SUB_CATEGORY: {
    OTO_4CHO: 1001, //Ô tô 4 chỗ
    OTO_5CHO: 1002, //Ô tô 5 chỗ
    OTO_6CHO: 1003, //Ô tô 6 chỗ
    OTO_7CHO: 1004, //Ô tô 7 chỗ
    OTO_8CHO: 1005, //Ô tô 8 chỗ
    OTO_9CHO: 1006, //Ô tô 9 chỗ
    OTO_10CHO: 1007, //Ô tô 10 chỗ
    OTO_11CHO: 1008, //Ô tô 11 chỗ
    OTO_12CHO: 1009, //Ô tô 12 chỗ
    OTO_13CHO: 1010, //Ô tô 13 chỗ
    OTO_14CHO: 1011, //Ô tô 14 chỗ
    OTO_15CHO: 1012, //Ô tô 15 chỗ
    OTO_16CHO: 1013, //Ô tô 16 chỗ
    OTO_17CHO: 1014, //Ô tô 17 chỗ
    OTO_18CHO: 1015, //Ô tô 18 chỗ
    OTO_19CHO: 1016, //Ô tô 19 chỗ
    OTO_20CHO: 1017, //Ô tô 20 chỗ
    OTO_21CHO: 1018, //Ô tô 21 chỗ
    OTO_22CHO: 1019, //Ô tô 22 chỗ
    OTO_23CHO: 1020, //Ô tô 23 chỗ
    OTO_24CHO: 1021, //Ô tô 24 chỗ
    OTO_25CHO: 1022, //Ô tô 25 chỗ
    OTO_29CHO: 1023, //Ô tô 29 chỗ
    OTO_45CHO: 1024, //Ô tô 45 chỗ
    OTO_52CHO: 1025, //Ô tô 52 chỗ
    XE_BAN_TAI: 2001, //- Xe bán tải (20)
    XE_TAI_DUOI_1TAN: 2002, //- Xe tải dưới 1 tấn (21)
    XE_TAI_DUOI_2TAN: 2003, //- Xe tải 1-1.9 tấn
    XE_TAI_DUOI_3TAN: 2004, //- Xe tải 2-2.9 tấn
    XE_TAI_DUOI_4TAN: 2005, //- Xe tải 3-3.9 tấn
    XE_TAI_DUOI_5TAN: 2006, //- Xe tải 4-4.9 tấn
    XE_TAI_DUOI_6TAN: 2007, //- Xe tải 5-5.9 tấn
    XE_TAI_DUOI_7TAN: 2008, //- Xe tải 6-6.9 tấn
    XE_TAI_DUOI_8TAN: 2009, //- Xe tải 7-7.9 tấn
    XE_TAI_DUOI_9TAN: 2010, //- Xe tải 8-8.9 tấn
    XE_TAI_DUOI_10TAN: 2011, //- Xe tải 9-9.9 tấn
    XE_TAI_DUOI_11TAN: 2012, //- Xe tải 10-10.9 tấn
    XE_TAI_DUOI_12TAN: 2013, //- Xe tải 11-11.9 tấn
    XE_TAI_DUOI_13TAN: 2014, //- Xe tải 12-12.9 tấn
    XE_TAI_DUOI_14TAN: 2015, //- Xe tải 13-13.9 tấn
    XE_TAI_DUOI_15TAN: 2016, //- Xe tải 14-14.9 tấn
    XE_TAI_DUOI_16TAN: 2017, //- Xe tải 16-16.9 tấn
    XE_TAI_DUOI_17TAN: 2018, //- Xe tải 17-17.9 tấn
    XE_TAI_DUOI_18TAN: 2019, //- Xe tải 18-18.9 tấn
    XE_TAI_DUOI_19TAN: 2020, //- Xe tải 19-19.9 tấn
    XE_TAI_DUOI_27TAN: 2021, //- Xe tải 20-26.9 tấn
    XE_TAI_DUOI_40TAN: 2022, //- Xe tải 27-39.9 tấn
    XE_TAI_TREN_40TAN: 2023, //- Xe tải trên 40 tấn
    XE_DAU_KEO_DUOI_19TAN: 2024, //- Xe đầu kéo dưới 19 Tấn
    XE_DAU_KEO_DUOI_27TAN: 2025, //- Xe đầu kéo 19-26.9 Tấn
    XE_DAU_KEO_DUOI_40TAN: 2026, //- Xe đầu kéo 27-39.9 Tấn
    XE_DAU_KEO_TREN_40TAN: 2027, //- Xe đầu kéo trên 40 Tấn
    XE_ROMOOC: 3000, //- Romooc, sơmi romooc (23)
    XE_CHUYENDUNG: 4000, //- Xe chuyên dụng (30)
    XE_BONBANH_CO_DONG_CO: 5000, //- Xe bốn bánh có động cơ (40)
    XE_CUU_THUONG: 6000, //Xe cứu thương
  },
  EQUIP_DASH_CAM_STATUS: {
    HAVE: 1,
    NOT_HAVE: 0,
  },
  EQUIP_CRUISE_CONTROL_DEVICE_STATUS: {
    HAVE: 1,
    NOT_HAVE: 0,
  },
  VEHICLE_EXTENDS: {
    HAVE: 1,
    NOT_HAVE: 0,
  },
  NEW_VEHICLE_CERTIFICATE: '-',
  CRIMINAL: {
    YES: 1,
    NO: 0,
  },
};
