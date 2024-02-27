/* Copyright (c) 2022-2023 Reminano */

const Logger = require('../../../utils/logging');

async function startGameRecordSchedule() {
  Logger.info('Start Game Record Schedule: ', new Date());

  //do not run schedule on DEV environments
  if (process.env.NODE_ENV === 'dev') {
    return;
  }

  // require('./bacarat').startSchedule();
  // require('./baucua').startSchedule();
  require('./binaryoption').startSchedule();
  // require('./kenosieutoc').startSchedule();
  // require('./rongho').startSchedule();
  // require('./xocdia').startSchedule();
  // require('./xososieutoc').startSchedule();
  // require('./xosotruyenthong').startSchedule();
}

module.exports = {
  startGameRecordSchedule,
};
