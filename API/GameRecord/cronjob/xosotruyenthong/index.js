/* Copyright (c) 2022-2023 Reminano */

const { CronInstance, executeJob } = require('../../../../ThirdParty/Cronjob/CronInstance');
const Logger = require('../../../../utils/logging');

const GameRecordFunctions = require('../../GameRecordFunctions');
const UpdateGameResult = require('./updateGameResult').updateGameResult;
const moment = require('moment');
const { BET_TYPE, XSTT_PRODUCT_CHANNEL } = require('../../../GamePlayRecords/GamePlayRecordsConstant');

async function startSchedule() {
  Logger.info('startSchedule ', new Date());

  //do not run schedule on DEV environments
  if (process.env.NODE_ENV === 'dev') {
    return;
  }

  // every monday
  CronInstance.schedule('0 7 * * 1', async function () {
    let newSection = moment().format('YYYYMMDD');
    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.CA_MAU}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.TPHCM}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.DONG_THAP}`, BET_TYPE.XSTT_DEFAULT, null, false);
  });

  // every tuesday
  CronInstance.schedule('0 7 * * 2', async function () {
    let newSection = moment().format('YYYYMMDD');
    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.BAC_LIEU}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.BEN_TRE}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.VUNG_TAU}`, BET_TYPE.XSTT_DEFAULT, null, false);
  });

  // every webnesday
  CronInstance.schedule('0 7 * * 3', async function () {
    let newSection = moment().format('YYYYMMDD');
    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.CAN_THO}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.DONG_NAI}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.SOC_TRANG}`, BET_TYPE.XSTT_DEFAULT, null, false);
  });

  // every thursday
  CronInstance.schedule('0 7 * * 4', async function () {
    let newSection = moment().format('YYYYMMDD');
    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.AN_GIANG}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.BINH_THUAN}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.TAY_NINH}`, BET_TYPE.XSTT_DEFAULT, null, false);
  });

  // every friday
  CronInstance.schedule('0 7 * * 5', async function () {
    let newSection = moment().format('YYYYMMDD');
    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.BINH_DUONG}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.TRA_VINH}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.VINH_LONG}`, BET_TYPE.XSTT_DEFAULT, null, false);
  });

  // every saturday
  CronInstance.schedule('0 7 * * 6', async function () {
    let newSection = moment().format('YYYYMMDD');
    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.TPHCM}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.BINH_PHUOC}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.HAU_GIANG}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.LONG_AN}`, BET_TYPE.XSTT_DEFAULT, null, false);
  });

  // every sunday
  CronInstance.schedule('0 7 * * 7', async function () {
    let newSection = moment().format('YYYYMMDD');
    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.KIEN_GIANG}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.LAM_DONG}`, BET_TYPE.XSTT_DEFAULT, null, false);

    await GameRecordFunctions.addNewGameRecord(`${newSection}_${XSTT_PRODUCT_CHANNEL.TIEN_GIANG}`, BET_TYPE.XSTT_DEFAULT, null, false);
  });

  // update Game result
  // every 15 minutes every monday 16h-23h
  CronInstance.schedule('*/15 16-23 * * 1', async function () {
    let newSection = moment().format('YYYYMMDD');
    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.CA_MAU}`);
    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.TPHCM}`);
    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.DONG_THAP}`);
  });

  // every 15 minutes every tuesday 16h-23h
  CronInstance.schedule('*/15 16-23 * * 2', async function () {
    let newSection = moment().format('YYYYMMDD');
    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.BAC_LIEU}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.BEN_TRE}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.VUNG_TAU}`);
  });

  // every 15 minutes every webnesday 16h-23h
  CronInstance.schedule('*/15 16-23 * * 3', async function () {
    let newSection = moment().format('YYYYMMDD');
    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.CAN_THO}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.DONG_NAI}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.SOC_TRANG}`);
  });

  // every 15 minutes every thursday 16h-23h
  CronInstance.schedule('*/15 16-23 * * 4', async function () {
    let newSection = moment().format('YYYYMMDD');
    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.AN_GIANG}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.BINH_THUAN}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.TAY_NINH}`);
  });

  // every 15 minutes every friday
  CronInstance.schedule('*/15 16-23 * * 5', async function () {
    let newSection = moment().format('YYYYMMDD');
    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.BINH_DUONG}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.TRA_VINH}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.VINH_LONG}`);
  });

  // every 15 minutes every saturday 16h-23h
  CronInstance.schedule('*/15 16-23 * * 6', async function () {
    let newSection = moment().format('YYYYMMDD');
    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.TPHCM}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.BINH_PHUOC}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.HAU_GIANG}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.LONG_AN}`);
  });

  // every 15 minutes every sunday 16h-23h
  CronInstance.schedule('*/15 16-23 * * 7', async function () {
    let newSection = moment().format('YYYYMMDD');
    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.KIEN_GIANG}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.LAM_DONG}`);

    await UpdateGameResult(`${newSection}_${XSTT_PRODUCT_CHANNEL.TIEN_GIANG}`);
  });
}

module.exports = {
  startSchedule,
};
