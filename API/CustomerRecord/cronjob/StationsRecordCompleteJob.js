/* Copyright (c) 2021-2022 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const CustomerAutoCheckFunction = require('./StationsRecordAutoCheck');

async function autoComplete() {
  await CustomerAutoCheckFunction.autoCompleteProcessForAllStation();
  process.exit();
}
autoComplete();
module.exports = {
  autoComplete,
};
