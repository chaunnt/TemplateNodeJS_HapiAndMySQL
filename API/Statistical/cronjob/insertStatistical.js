/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const { syncStatistical } = require('../StatisticalFunctions');
const moment = require('moment');
async function insertStatistical() {
  let yesterday = moment().add(-1, 'day').endOf('day').format();
  await syncStatistical(undefined, yesterday);
}

module.exports = {
  insertStatistical,
};
