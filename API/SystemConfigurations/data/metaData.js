/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const { SCHEDULE_TYPE } = require('../../CustomerSchedule/CustomerScheduleConstants');
const { STATION_TYPE } = require('../../Stations/StationsConstants');
const { VEHICLE_TYPE } = require('../../AppUserVehicle/AppUserVehicleConstant');
const { APP_USER_CATEGORY } = require('../../AppUsers/AppUsersConstant');
const { SERVICE_TYPES } = require('../../StationServices/StationServicesConstants');
const { DOCUMENT_CATEGORY } = require('../../StationDocument/StationDocumentConstants');
const { SETTING } = require('../../Common/CommonConstant');
const { NEWS_CATEGORY } = require('../../StationNewsCategory/data/seedingData');

module.exports = {
  META_DATA: {
    STATION_NEWS_CATEGORY: NEWS_CATEGORY,

    SCHEDULE_TYPE: {
      VEHICLE_INSPECTION: {
        scheduleTypeName: 'Đăng kiểm xe cũ',
        scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
        scheduleTypeEnable: SETTING.ENABLE,
        price: 0,
        requireScheduleStation: SETTING.ENABLE,
        requireScheduleDate: SETTING.ENABLE,
        requireScheduleTime: SETTING.ENABLE,
      },
      NEW_VEHICLE_INSPECTION: {
        scheduleTypeName: 'Đăng kiểm lần đầu',
        scheduleType: SCHEDULE_TYPE.NEW_VEHICLE_INSPECTION,
        scheduleTypeEnable: SETTING.ENABLE,
        price: 0,
        requireScheduleStation: SETTING.ENABLE,
        requireScheduleDate: SETTING.ENABLE,
        requireScheduleTime: SETTING.ENABLE,
      },
      REGISTER_NEW_VEHICLE: {
        scheduleTypeName: 'Nộp hồ sơ xe mới',
        scheduleType: SCHEDULE_TYPE.REGISTER_NEW_VEHICLE,
        scheduleTypeEnable: SETTING.ENABLE,
        price: 0,
        requireScheduleStation: SETTING.ENABLE,
        requireScheduleDate: SETTING.ENABLE,
        requireScheduleTime: SETTING.ENABLE,
      },
      CHANGE_REGISTATION: {
        scheduleTypeName: 'Thay đổi thông tin xe',
        scheduleType: SCHEDULE_TYPE.CHANGE_REGISTATION,
        scheduleTypeEnable: SETTING.ENABLE,
        price: 0,
        requireScheduleStation: SETTING.ENABLE,
        requireScheduleDate: SETTING.ENABLE,
        requireScheduleTime: SETTING.ENABLE,
      },
      // PAY_ROAD_FEE: {
      //   scheduleTypeName: 'Thanh toán phí đường bộ',
      //   scheduleType: SCHEDULE_TYPE.PAY_ROAD_FEE,
      //   scheduleTypeEnable: SETTING.ENABLE,
      //   price: 0,
      // },
      // PAY_INSURRANCE_FEE: {
      //   scheduleTypeName: 'Thanh toán phí bảo hiểm',
      //   scheduleType: SCHEDULE_TYPE.PAY_INSURRANCE_FEE,
      //   scheduleTypeEnable: SETTING.ENABLE,
      //   price: 0,
      // },
      VEHICLE_INSPECTION_CONSULTATION: {
        scheduleTypeName: 'Tư vấn đăng kiểm xe',
        scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION_CONSULTATION,
        scheduleTypeEnable: SETTING.ENABLE,
        price: 100000,
        requireScheduleStation: SETTING.DISABLE,
        requireScheduleDate: SETTING.DISABLE,
        requireScheduleTime: SETTING.DISABLE,
      },
      TRAFFIC_FINE_CONSULTATION: {
        scheduleTypeName: 'Tư vấn xử lý phạt nguội',
        scheduleType: SCHEDULE_TYPE.TRAFFIC_FINE_CONSULTATION,
        scheduleTypeEnable: SETTING.ENABLE,
        price: 100000,
        requireScheduleStation: SETTING.DISABLE,
        requireScheduleDate: SETTING.DISABLE,
        requireScheduleTime: SETTING.DISABLE,
      },
      CONSULTANT_MAINTENANCE: {
        scheduleTypeName: 'Tư vấn bảo dưỡng xe',
        scheduleType: SCHEDULE_TYPE.CONSULTANT_MAINTENANCE,
        scheduleTypeEnable: SETTING.ENABLE,
        price: 100000,
        requireScheduleStation: SETTING.DISABLE,
        requireScheduleDate: SETTING.DISABLE,
        requireScheduleTime: SETTING.DISABLE,
      },
      CONSULTANT_INSURANCE: {
        scheduleTypeName: 'Tư vấn bảo hiểm xe',
        scheduleType: SCHEDULE_TYPE.CONSULTANT_INSURANCE,
        scheduleTypeEnable: SETTING.ENABLE,
        price: 100000,
        requireScheduleStation: SETTING.DISABLE,
        requireScheduleDate: SETTING.DISABLE,
        requireScheduleTime: SETTING.DISABLE,
      },
      CONSULTANT_RENOVATION: {
        scheduleTypeName: 'Tư vấn cải tạo xe',
        scheduleType: SCHEDULE_TYPE.CONSULTANT_RENOVATION,
        scheduleTypeEnable: SETTING.ENABLE,
        price: 100000,
        requireScheduleStation: SETTING.DISABLE,
        requireScheduleDate: SETTING.DISABLE,
        requireScheduleTime: SETTING.DISABLE,
      },
      LOST_REGISTRATION_PAPER: {
        scheduleTypeName: 'Mất giấy đăng kiểm',
        scheduleType: SCHEDULE_TYPE.LOST_REGISTRATION_PAPER,
        scheduleTypeEnable: SETTING.ENABLE,
        price: 0,
        requireScheduleStation: SETTING.ENABLE,
        requireScheduleDate: SETTING.ENABLE,
        requireScheduleTime: SETTING.ENABLE,
      },
      REISSUE_INSPECTION_STICKER: {
        scheduleTypeName: 'Cấp lại tem đăng kiểm',
        scheduleType: SCHEDULE_TYPE.REISSUE_INSPECTION_STICKER,
        scheduleTypeEnable: SETTING.ENABLE,
        price: 0,
        requireScheduleStation: SETTING.ENABLE,
        requireScheduleDate: SETTING.ENABLE,
        requireScheduleTime: SETTING.ENABLE,
      },
    },

    STATION_TYPE: STATION_TYPE,

    VEHICLE_TYPE: VEHICLE_TYPE,

    APP_USER_CATEGORY: APP_USER_CATEGORY,

    SERVICE_TYPES: SERVICE_TYPES,

    DOCUMENT_CATEGORY: DOCUMENT_CATEGORY,
  },
};
