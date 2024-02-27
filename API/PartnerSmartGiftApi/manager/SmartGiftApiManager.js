/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Logger = require('../../../utils/logging');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { getSmartGiftToken } = require('../../../ThirdParty/SmartGift/ZNSSmartGiftFunction');

async function getSmartGiftAccessToken(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _accessToken = getSmartGiftToken();
      resolve(_accessToken);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  getSmartGiftAccessToken,
};
