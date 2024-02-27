/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const AppSharingFunction = require('../AppSharingFunction');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');
const { generateHTML } = require('../data/redirectPageTemplate');

async function shareStationNew(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationNewsId = req.params.stationNewsId;
      if (stationNewsId) {
        const newInfo = await AppSharingFunction.getNewsInfo(stationNewsId);
        if (newInfo) {
          const html = await generateHTML(newInfo);
          return resolve(res.response(html).type('text/html'));
        }
        return reject(res.response('Tin tức không tồn tại'));
      } else {
        return reject(res.response('Tin tức không tồn tại'));
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function shareStation(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationCode = req.params.stationCode;
      if (stationCode) {
        const stationInfo = await AppSharingFunction.getStation(stationCode);
        if (stationInfo) {
          const html = await generateHTML(stationInfo);
          return resolve(res.response(html).type('text/html'));
        }
        return reject(res.response('Trạm không tồn tại'));
      } else {
        return reject(res.response('Trạm không tồn tại'));
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  shareStationNew,
  shareStation,
};
