/* Copyright (c) 2023-2024 Reminano */

const SystemIP = require('./SystemIPRoute');

module.exports = [
  { method: 'POST', path: '/SystemIP/insert', config: SystemIP.insert },
  { method: 'POST', path: '/SystemIP/find', config: SystemIP.find },
  { method: 'POST', path: '/SystemIP/findById', config: SystemIP.findById },
  { method: 'POST', path: '/SystemIP/updateById', config: SystemIP.updateById },
  { method: 'POST', path: '/SystemIP/deleteById', config: SystemIP.deleteById },
];
