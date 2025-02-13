/* Copyright (c) 2022 Reminano */

const CustomerMeasureRecord_UserRoute = require('./CustomerMeasureRecord_UserRoute');

module.exports = [
  //Api CustomerSchedule
  {
    method: 'POST',
    path: '/CustomerMeasureRecord/user/getList',
    config: CustomerMeasureRecord_UserRoute.userGetListMeasureRecord,
  },
  {
    method: 'POST',
    path: '/CustomerMeasureRecord/user/getDetail',
    config: CustomerMeasureRecord_UserRoute.userGetDetailMeasureRecordById,
  },
];
