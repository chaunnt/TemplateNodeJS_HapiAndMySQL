/* Copyright (c) 2024 Reminano */

'use strict';
const { syncStatistical } = require('../StatisticalFunctions');
const moment = require('moment');
const Logger = require('../../../utils/logging');

async function insertStatistical() {
  let yesterday = moment().add(-1, 'day').endOf('day').format();
  Logger.info(`start insertStatistical ${yesterday}`);
  await syncStatistical(undefined, yesterday);
}
insertStatistical();

module.exports = {
  insertStatistical,
};
