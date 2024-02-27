/* Copyright (c) 2022 Reminano */

const CustomerVisitRecord = require('./CustomerVisitRecordRoute');

module.exports = [
  { method: 'POST', path: '/CustomerVisitRecord/insert', config: CustomerVisitRecord.insert },
  { method: 'POST', path: '/CustomerVisitRecord/find', config: CustomerVisitRecord.find },
  { method: 'POST', path: '/CustomerVisitRecord/findById', config: CustomerVisitRecord.findById },
  { method: 'POST', path: '/CustomerVisitRecord/updateById', config: CustomerVisitRecord.updateById },
  { method: 'POST', path: '/CustomerVisitRecord/deleteById', config: CustomerVisitRecord.deleteById },
];
