/* Copyright (c) 2023 TORITECH LIMITED 2022 */
function getParamAttributeByName(paramName) {
  switch (paramName) {
    case 'stationsName':
      return { paramName: paramName, paramLength: 10, paramSample: 'TTDK XCG 7901S', paramType: 'string' };
    case 'stationCode':
      return { paramName: paramName, paramLength: 6, paramSample: '7901S', paramType: 'string' };
    case 'stationsAddress':
      return { paramName: paramName, paramLength: 40, paramSample: '7901S', paramType: 'string' };
    case 'customerRecordPlatenumber':
    case 'vehiclePlateNumber':
      return { paramName: paramName, paramLength: 12, paramSample: '7901S', paramType: 'string' };
    case 'customerRecordCheckExpiredDate':
      return { paramName: paramName, paramLength: 10, paramSample: '7901S', paramType: 'string' };
    case 'stationsHotline':
      return { paramName: paramName, paramLength: 10, paramSample: '7901S', paramType: 'string' };
    case 'dateSchedule':
      return { paramName: paramName, paramLength: 10, paramSample: '7901S', paramType: 'string' };
    case 'newDate':
      return { paramName: paramName, paramLength: 10, paramSample: '7901S', paramType: 'string' };
    case 'reasonCancel':
      return { paramName: paramName, paramLength: 40, paramSample: '7901S', paramType: 'string' };
    case 'startDay':
      return { paramName: paramName, paramLength: 10, paramSample: '7901S', paramType: 'string' };
    case 'minPaymentAmount':
      return { paramName: paramName, paramLength: 10, paramSample: 100000, paramType: 'integer' };
    case 'distance':
      return { paramName: paramName, paramLength: 4, paramSample: 500, paramType: 'integer' };
    case 'distance':
      return { paramName: paramName, paramLength: 4, paramSample: 500, paramType: 'integer' };
    default:
      return { paramName: 'paramName', paramLength: 4, paramSample: 'paramSample', paramType: 'string' };
  }
}
module.exports = {
  TEMPLATE_TYPE: {
    SMS_CSKH: 'SMS_CSKH',
    ZALO_CSKH: 'ZALO_CSKH',
    APNS: 'APNS',
    EMAIL: 'EMAIL',
    SMS_PROMOTION: 'SMS_PROMOTION',
    ZALO_PROMOTION: 'ZALO_PROMOTION',
  },
  getParamAttributeByName,
  TEMPLATE_ID: {
    SMS_CSKH_REMINDER_VEHICLE_INSPECTION_1: 1, // Nhắc đăng kiểm mẫu 1
    SMS_CSKH_REMINDER_VEHICLE_INSPECTION_2: 2, // Nhắc đăng kiểm mẫu 2

    SMS_PROMOTION_INSURANCE_1: 3, // Khuyến mãi bảo hiểm mẫu 1
    SMS_PROMOTION_MAINTENANCE_1: 4, // Khuyến mãi bảo dưỡng xe mẫu 1
    SMS_PROMOTION_REMINDER_MAINTENANCE_1: 5, // Nhắc hẹn bảo dưỡng xe mẫu
    SMS_PROMOTION_MAINTENANCE_1: 6, // Khuyến mãi bảo dưỡng xe mẫu 2
    SMS_PROMOTION_ADVERTISING_MAINTENANCE_1: 7, // Quảng cáo bảo dưỡng xe mẫu 1
    SMS_PROMOTION_ADVERTISING_HELPER_1: 8, // Quảng cáo cứu hộ mẫu 1
    SMS_PROMOTION_HELPER_1: 9, // Khuyến mãi cứu hộ xe mẫu 1

    ZALO_CSKH_REMINDER_VEHICLE_INSPECTION_1: 10, // Nhắc đăng kiểm qua Zalo  mẫu 1
    ZALO_CSKH_REMINDER_VEHICLE_INSPECTION_2: 11, // Nhắc đăng kiểm qua Zalo mẫu 2

    ZALO_PROMOTION_INSURANCE_1: 12, // Khuyến mãi bảo hiểm qua Zalo mẫu 1
    ZALO_PROMOTION_MAINTENANCE_1: 13, // Khuyến mãi bảo dưỡng xe qua Zalo mẫu 1
    ZALO_PROMOTION_REMINDER_MAINTENANCE_1: 14, // Nhắc hẹn bảo dưỡng xe qua Zalo mẫu 1
    ZALO_PROMOTION_MAINTENANCE_2: 15, // Khuyến mãi bảo dưỡng xe qua Zalo mẫu 2
    ZALO_PROMOTION_ADVERTISING_MAINTENANCE_1: 16, // Quảng cáo bảo dưỡng xe qua Zalo mẫu 1
    ZALO_PROMOTION_ADVERTISING_HELPER_1: 17, // Quảng cáo cứu hộ qua Zalo mẫu 1
    ZALO_PROMOTION_HELPER_1: 18, // Khuyến mãi cứu hộ xe qua Zalo mẫu 1

    REPORT_DAILY_1: 19, // Báo cáo tình hình hoạt động trong ngày tại trạm 1
    REPORT_WEEKLY: 20, // Báo cáo tình hình hoạt động trong tuần tại trạm
    REPORT_DAILY_2: 21, // Báo cáo tình hình hoạt động trong ngày tại trạm 2

    STATION_SMS_CSKH_REMINDER_VEHICLE_INSPECTION_3: 22, // Nhắc đăng kiểm mẫu 3
    STATION_SMS_CSKH_REMINDER_VEHICLE_INSPECTION_4: 23, // Nhắc đăng kiểm mẫu 4
    STATION_SMS_CSKH_REMINDER_INSURANCE_TNDS: 24, // Mẫu nhắc gia hạn bảo hiểm TNDS
    STATION_SMS_CSKH_REMINDER_INSURANCE_BHTV: 25, // Mẫu nhắc gia hạn bảo hiểm thân vỏ xe
    STATION_SMS_CSKH_REMINDER_SERVICE_GPS: 26, // Mẫu nhắc gia hạn dịch vụ GPS
  },
};
