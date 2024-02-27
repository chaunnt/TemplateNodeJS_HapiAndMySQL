/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const Logger = require('../../../utils/logging');

const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const CustomerScheduleDeletedResourceAccess = require('../resourceAccess/CustomerScheduleDeletedResourceAccess');
const { reportToTelegram } = require('../../../ThirdParty/TelegramBot/TelegramBotFunctions');

async function saveDeletedSchedule() {
  Logger.info('SAVE DELETED SCHEDULE JOB');
  const promiseList = await _splitToBunchOfPromises();

  for (let promise of promiseList) {
    await Promise.all(promise);
  }
  Logger.info('SAVE DELETED SCHEDULE JOB DONE');
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];

  let skip = 0;
  while (true) {
    const recordList = await CustomerScheduleResourceAccess.findDeletedRecord(skip, limit);
    if (recordList && recordList.length > 0) {
      const promiseBunch = recordList.map(schedule => {
        return new Promise(async resolve => {
          // save record to another table
          const insertResult = await CustomerScheduleDeletedResourceAccess.insert(schedule);

          if (insertResult) {
            //chi can move ra cho search cho le, khong can xoa vinh vien.
            //khi nao dam bao moi thu ok thi hay xoa
            // await CustomerScheduleResourceAccess.permanentlyDelete(schedule.customerScheduleId);
            Logger.info(`DELETE RECORD ${schedule.customerScheduleId}`);
          } else {
            reportToTelegram(`saveDeletedSchedule ${schedule.customerScheduleId} ERROR`);
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

saveDeletedSchedule();

module.exports = {
  moveScheduleToNewTable: saveDeletedSchedule,
};
