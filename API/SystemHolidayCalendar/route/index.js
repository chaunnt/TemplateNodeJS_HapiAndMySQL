/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const SystemHolidayCalendar = require('./SystemHolidayCalendarRoute');

module.exports = [
  { method: 'POST', path: '/SystemHolidayCalendar/insert', config: SystemHolidayCalendar.insert },
  { method: 'POST', path: '/SystemHolidayCalendar/find', config: SystemHolidayCalendar.find },
  { method: 'POST', path: '/SystemHolidayCalendar/findById', config: SystemHolidayCalendar.findById },
  { method: 'POST', path: '/SystemHolidayCalendar/updateById', config: SystemHolidayCalendar.updateById },
  { method: 'POST', path: '/SystemHolidayCalendar/deleteById', config: SystemHolidayCalendar.deleteById },
];
