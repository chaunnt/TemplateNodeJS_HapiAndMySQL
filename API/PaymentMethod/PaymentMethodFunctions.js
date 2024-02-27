/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Logger = require('../../utils/logging');
async function getPublicBankListFromLocal(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let BANK_LIST = JSON.parse(JSON.stringify(require('./data/banklist').BANK_LIST));
      let bank_list = [];
      for (let i = 0; i < BANK_LIST.length; i++) {
        BANK_LIST[i].avatar = BANK_LIST[i].logo;
        if (
          BANK_LIST[i].code != 'CAKE' &&
          BANK_LIST[i].code != 'Ubank' &&
          BANK_LIST[i].code != 'TIMO' &&
          BANK_LIST[i].code != 'VTLMONEY' &&
          BANK_LIST[i].code != 'VNPTMONEY' &&
          BANK_LIST[i].code != 'BAB'
        ) {
          bank_list.push(BANK_LIST[i]);
        }
      }
      resolve(bank_list);
    } catch (e) {
      Logger.error(e);
      resolve([]);
    }
  });
}

function getBankIdFromShortName(shortName) {
  let BANK_LIST = JSON.parse(JSON.stringify(require('./data/banklist').BANK_LIST));
  for (let i = 0; i < BANK_LIST.length; i++) {
    if (BANK_LIST[i].code === shortName) {
      return BANK_LIST[i];
    }
  }
}
module.exports = {
  getPublicBankListFromLocal,
  getBankIdFromShortName,
};
