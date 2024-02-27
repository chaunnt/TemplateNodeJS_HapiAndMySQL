/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const Logger = require('../../../utils/logging');
const moment = require('moment');

const MessageCustomerMarketingResourceAccess = require('../resourceAccess/MessageCustomerMarketingResourceAccess');
const StationReportResourceAccess = require('../../StationReport/resourceAccess/StationReportResourceAccess');
const MessageTemplateResourceAccess = require('../../MessageTemplate/resourceAccess/MessageTemplateResourceAccess');
const RoleUserView = require('../../AppUsers/resourceAccess/RoleUserView');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');

const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { STATION_TYPE } = require('../../Stations/StationsConstants');
const { APP_USER_ROLE } = require('../../AppUserRole/AppUserRoleConstant');
const { TEMPLATE_ID } = require('../../MessageTemplate/MessageTemplateConstant');
const { MARKETING_MESSAGE_SEND_STATUS } = require('../MessageCustomerMarketingConstant');

const UtilsFunction = require('../../ApiUtils/utilFunctions');
const { sendMessageByZNSOfSystem } = require('../../ZaloNotificationService/ZNSSystemFunction');

async function notifyStationReportWeekToAllStations() {
  let stationsList = await StationsResourceAccess.find({ stationType: STATION_TYPE.EXTERNAL }, undefined, undefined);
  if (stationsList && stationsList.length > 0) {
    let promiseList = [];
    for (let i = 0; i < stationsList.length; i++) {
      const station = stationsList[i];
      const promise = await _sendReportMessageWeekToDirector(station);
      promiseList.push(promise);
    }
    await UtilsFunction.executeBatchPromise(promiseList);
  }
  process.exit();
}

async function _sendReportMessageWeekToDirector(station) {
  return new Promise(async (resolve, reject) => {
    //Skip TEST station
    if (station.stationsId === 0) {
      Logger.info(`station empty ${station.stationsId} `);
      resolve('OK');
      return;
    }
    let totalCompletedSchedule = 0;
    for (let i = 1; i < 7; i++) {
      let workingDay = moment().subtract(i, 'days').format('YYYYMMDD');
      let StationReport = await StationReportResourceAccess.find({
        reportDay: workingDay,
        stationId: station.stationsId,
      });
      if (StationReport && StationReport.length > 0) {
        totalCompletedSchedule += StationReport[0].totalCustomerScheduleClosed;
      }
    }

    if (totalCompletedSchedule > 0) {
      let endDate = moment().endOf('day').format();
      let startDate = moment().subtract(6, 'days').startOf('day').format();
      const totalMessageComplete = await MessageCustomerMarketingResourceAccess.customCount(
        {
          customerStationId: station.stationsId,
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED,
        },
        startDate,
        endDate,
      );
      startDate = moment(startDate).format('DD/MM/YYYY');
      endDate = moment(endDate).format('DD/MM/YYYY');
      let messageTemplateData = {
        stationsName: station.stationsName,
        totalCompletedSchedule: totalCompletedSchedule,
        totalCompletedMarketingMessage: totalMessageComplete,
        startDate,
        endDate,
      };

      const template = await MessageTemplateResourceAccess.findById(TEMPLATE_ID.REPORT_WEEKLY);
      const templateId = template.messageZNSTemplateId;
      let roleUserDirector = await RoleUserView.find({
        appUserRoleId: APP_USER_ROLE.DIRECTOR,
        stationsId: station.stationsId,
      });
      let roleUserDeputyDirector = await RoleUserView.find({
        appUserRoleId: APP_USER_ROLE.DEPUTY_DIRECTOR,
        stationsId: station.stationsId,
      });
      let success = 0;
      let failed = 0;
      if (station.stationsManagerPhone) {
        let sendResult;
        sendResult = await sendMessageByZNSOfSystem(station.stationsManagerPhone, templateId, messageTemplateData);

        if (sendResult && sendResult.error === 0) {
          success++;
        } else if (sendResult && sendResult.error !== 0) {
          console.error(sendResult.message);
          failed++;
        } else {
          console.error(UNKNOWN_ERROR);
          failed++;
        }
      }
      if (roleUserDirector && roleUserDirector.length > 0) {
        for (let i = 0; i < roleUserDirector.length; i++) {
          let directorPhoneNumber = roleUserDirector[i].phoneNumber;
          if (directorPhoneNumber && directorPhoneNumber !== station.stationsManagerPhone) {
            let sendResult;
            sendResult = await sendMessageByZNSOfSystem(directorPhoneNumber, templateId, messageTemplateData);

            if (sendResult && sendResult.error === 0) {
              success++;
            } else if (sendResult && sendResult.error !== 0) {
              console.error(sendResult.message);
              failed++;
            } else {
              console.error(UNKNOWN_ERROR);
              failed++;
            }
          }
        }
      }
      if (roleUserDeputyDirector && roleUserDeputyDirector.length > 0) {
        for (let i = 0; i < roleUserDeputyDirector.length; i++) {
          let deputyDirectorPhoneNumber = roleUserDeputyDirector[i].phoneNumber;
          if (deputyDirectorPhoneNumber && deputyDirectorPhoneNumber !== station.stationsManagerPhone) {
            let sendResult;
            sendResult = await sendMessageByZNSOfSystem(deputyDirectorPhoneNumber, templateId, messageTemplateData);
            if (sendResult && sendResult.error === 0) {
              success++;
            } else if (sendResult && sendResult.error !== 0) {
              console.error(sendResult.message);
              failed++;
            } else {
              console.error(UNKNOWN_ERROR);
              failed++;
            }
          }
        }
      }

      resolve(`success: ${success}, failed: ${failed}`);
    }
    resolve('DONE');
  });
}
notifyStationReportWeekToAllStations();

module.exports = {
  notifyStationReportWeekToAllStations,
};
