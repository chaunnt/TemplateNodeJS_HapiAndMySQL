/* Copyright (c) 2023 Reminano */

const IPMonitorRoute = require('../route/IPMonitorRoute');

module.exports = [
  { method: 'POST', path: '/IPMonitor/insert', config: IPMonitorRoute.insert },
  { method: 'POST', path: '/IPMonitor/updateById', config: IPMonitorRoute.updateById },
  { method: 'POST', path: '/IPMonitor/find', config: IPMonitorRoute.find },
  { method: 'POST', path: '/IPMonitor/deleteById', config: IPMonitorRoute.deleteById },
];
