/* Copyright (c) 2022 Reminano */

const HanetRecordRoute = require('./HanetRecordRoute');

module.exports = [{ method: 'POST', path: '/HanetRecord/customerCheckinHook', config: HanetRecordRoute.customerCheckinHook }];
