/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const GameBetRecordsResourceAccess = require('../resourceAccess/GameBetRecordsResourceAccess');

async function getList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let gameBetRecordData = await GameBetRecordsResourceAccess.find(filter);
      if (gameBetRecordData && gameBetRecordData.length > 0) {
        resolve(gameBetRecordData);
      } else {
        resolve([]);
      }
    } catch (e) {
      console.error(`error get list:`, e);
      reject('failed');
    }
  });
}

module.exports = {
  getList,
};
