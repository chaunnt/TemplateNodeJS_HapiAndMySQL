/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';

const moment = require('moment');
const { isValidValue } = require('../../ApiUtils/utilFunctions');
const { DATE_DISPLAY_FORMAT, DATE_DB_FORMAT } = require('../CustomerRecordConstants');

function fromData(data) {
  let modelData = data;
  if (isValidValue(data.customerRecordCheckDate)) {
    modelData.customerRecordCheckDate = moment(data.customerRecordCheckDate, DATE_DB_FORMAT).format(DATE_DISPLAY_FORMAT);
  } else {
    modelData.customerRecordCheckDate = '';
  }

  if (isValidValue(data.customerRecordCheckExpiredDate)) {
    modelData.customerRecordCheckExpiredDate = moment(data.customerRecordCheckExpiredDate, DATE_DB_FORMAT).format(DATE_DISPLAY_FORMAT);
  } else {
    modelData.customerRecordCheckExpiredDate = '';
  }

  //TODO: get real result later
  modelData.customerRecordEmailNotifyResult = true;
  modelData.customerRecordSMSNotifyResult = true;
  return modelData;
}

module.exports = {
  fromData,
};
