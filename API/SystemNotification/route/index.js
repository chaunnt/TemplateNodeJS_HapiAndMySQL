/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const SystemNotificationRoute = require('./SystemNotificationRoute');

module.exports = [
  { method: 'POST', path: '/SystemNotification/insert', config: SystemNotificationRoute.insert },
  { method: 'POST', path: '/SystemNotification/find', config: SystemNotificationRoute.find },
  { method: 'POST', path: '/SystemNotification/findById', config: SystemNotificationRoute.findById },
  { method: 'POST', path: '/SystemNotification/updateById', config: SystemNotificationRoute.updateById },
  { method: 'POST', path: '/SystemNotification/deleteById', config: SystemNotificationRoute.deleteById },

  { method: 'POST', path: '/SystemNotification/user/getList', config: SystemNotificationRoute.getList },
  { method: 'POST', path: '/SystemNotification/user/getDetailById', config: SystemNotificationRoute.getDetailById },
];
