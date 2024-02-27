/* Copyright (c) 2022 Reminano */

const TaskUpdateHistory = require('./TaskUpdateHistoryRoute');

module.exports = [{ method: 'POST', path: '/TaskUpdateHistory/find', config: TaskUpdateHistory.find }];
