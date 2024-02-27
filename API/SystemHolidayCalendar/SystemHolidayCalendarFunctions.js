/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const SystemHolidayCalendarResourceAccess = require('./resourceAccess/SystemHolidayCalendarResourceAccess');
const { DATE_DB_SORT_FORMAT, DATE_DISPLAY_FORMAT } = require('../CustomerRecord/CustomerRecordConstants');
const moment = require('moment');
const { isValidValue } = require('../ApiUtils/utilFunctions');

let RedisInstance;
if (process.env.REDIS_ENABLE * 1 === 1) {
  RedisInstance = require('../../ThirdParty/Redis/RedisInstance');
}

async function getListSystemHolidayCalendar() {
  const REDIS_KEY = `LIST_SYSTEM_HOLIDAY_CALENDAR`;

  if (process.env.REDIS_ENABLE * 1 === 1) {
    let _cacheItem = await RedisInstance.getJson(REDIS_KEY);
    if (isValidValue(_cacheItem)) {
      return _cacheItem;
    }
  }

  // Bắt đầu lấy ngày nghỉ từ hôm qua
  const startDate = moment().subtract(1, 'days').format(DATE_DB_SORT_FORMAT) * 1;

  let dayOffList = await SystemHolidayCalendarResourceAccess.customSearch({}, startDate, undefined);

  if (dayOffList && dayOffList.length > 0) {
    dayOffList = dayOffList.map(item => {
      const date = moment(item.scheduleDayOff, DATE_DB_SORT_FORMAT).format(DATE_DISPLAY_FORMAT);
      return date;
    });
  }

  if (process.env.REDIS_ENABLE * 1 === 1) {
    RedisInstance.setWithExpire(REDIS_KEY, JSON.stringify(dayOffList));
  }

  return dayOffList;
}

module.exports = {
  getListSystemHolidayCalendar,
};
