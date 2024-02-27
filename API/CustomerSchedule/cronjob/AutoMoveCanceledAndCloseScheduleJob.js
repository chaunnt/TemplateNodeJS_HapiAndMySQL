/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const Logger = require('../../../utils/logging');

const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const CustomerScheduleCanceledResourceAccess = require('../resourceAccess/CustomerScheduleCanceledResourceAccess');
const CustomerScheduleClosedResourceAccess = require('../resourceAccess/CustomerScheduleClosedResourceAccess');

const { SCHEDULE_STATUS } = require('../CustomerScheduleConstants');
const { reportToTelegram } = require('../../../ThirdParty/TelegramBot/TelegramBotFunctions');

async function moveScheduleToNewTable() {
  Logger.info('MOVE CANCEL AND CLOSE SCHEDULE JOB');
  const promiseList = await _splitToBunchOfPromises();

  for (let promise of promiseList) {
    await Promise.all(promise);
  }
  Logger.info('MOVE CANCEL AND CLOSE SCHEDULE JOB DONE');
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];
  const scheduleStatusList = [SCHEDULE_STATUS.CANCELED, SCHEDULE_STATUS.CLOSED];

  let skip = 0;
  while (true) {
    const recordList = await CustomerScheduleResourceAccess.customSearch({ CustomerScheduleStatus: scheduleStatusList }, skip, limit);
    if (recordList && recordList.length > 0) {
      const promiseBunch = recordList.map(schedule => {
        return new Promise(async resolve => {
          let insertResult;
          // save record to another table
          if (schedule.CustomerScheduleStatus === SCHEDULE_STATUS.CANCELED) {
            insertResult = CustomerScheduleCanceledResourceAccess.insert(schedule);
          } else if (schedule.CustomerScheduleStatus == SCHEDULE_STATUS.CLOSED) {
            insertResult = CustomerScheduleClosedResourceAccess.insert(schedule);
          }

          if (insertResult) {
            //tam thoi khoan hay xoa,
            //de khi he thong on dinh, chay ok het thi hay xoa
            // await CustomerScheduleResourceAccess.permanentlyDelete(schedule.customerScheduleId);
            Logger.info(`MOVED RECORD ${schedule.customerScheduleId}`);
          } else {
            reportToTelegram(`moveScheduleToNewTable failed ${schedule.customerScheduleId}`);
          }
          resolve(true);
        });
      });
      result.push(promiseBunch);
    } else {
      break;
    }
    skip += limit;
  }

  return result;
}

moveScheduleToNewTable();

module.exports = {
  moveScheduleToNewTable,
};
