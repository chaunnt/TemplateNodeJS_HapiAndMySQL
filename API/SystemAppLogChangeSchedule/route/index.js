/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const SystemAppLogChangeSchedule = require('./SystemAppLogChangeScheduleRoute');

module.exports = [
  { method: 'POST', path: '/SystemAppLogChangeSchedule/find', config: SystemAppLogChangeSchedule.find },
  { method: 'POST', path: '/SystemAppLogChangeSchedule/advanceUser/find', config: SystemAppLogChangeSchedule.advanceUserGetList },
];
