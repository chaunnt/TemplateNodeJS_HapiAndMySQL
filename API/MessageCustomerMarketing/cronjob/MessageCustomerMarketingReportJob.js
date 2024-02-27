/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Logger = require('../../../utils/logging');
const moment = require('moment');

const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const MessageTemplateResourceAccess = require('../../MessageTemplate/resourceAccess/MessageTemplateResourceAccess');
const RoleUserView = require('../../AppUsers/resourceAccess/RoleUserView');

const { SCHEDULE_STATUS } = require('../../CustomerSchedule/CustomerScheduleConstants');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { STATION_TYPE } = require('../../Stations/StationsConstants');
const { APP_USER_ROLE } = require('../../AppUserRole/AppUserRoleConstant');
const { TEMPLATE_ID } = require('../../MessageTemplate/MessageTemplateConstant');

const UtilsFunction = require('../../ApiUtils/utilFunctions');
const { sendMessageByZNSOfSystem } = require('../../ZaloNotificationService/ZNSSystemFunction');

async function notifyStationReportToAllStations() {
  console.info('NOTIFICATION TO ALL STATION STARTED');

  let stationsList = await StationsResourceAccess.find({ stationType: STATION_TYPE.EXTERNAL }, undefined, undefined);
  if (stationsList && stationsList.length > 0) {
    let promiseList = [];
    for (let i = 0; i < stationsList.length; i++) {
      const station = stationsList[i];
      const promise = await _sendReportMessageToDirector(station);
      promiseList.push(promise);
    }
    await UtilsFunction.executeBatchPromise(promiseList);
  }

  //Sau khi đã thực hiện xong thì gửi qua Zalo Admin để đảm bảo hệ thống "ổn định"
  let _daySchedule = moment().format('YYYYMMDD');
  const _totalScheduleToday = await CustomerScheduleResourceAccess.customCount({
    CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED],
    daySchedule: _daySchedule,
  });
  let _workingDay = moment().format('DD/MM/YYYY');
  let messageTemplateData = {
    stationsName: 'Trung tâm quản lý TTDK',
    workingDay: _workingDay,
    totalScheduleToday: _totalScheduleToday,
  };

  const template = await MessageTemplateResourceAccess.findById(TEMPLATE_ID.REPORT_DAILY_2);
  const templateId = template.messageZNSTemplateId;

  let _resultReport;
  _resultReport = await sendMessageByZNSOfSystem('0343902960', templateId, messageTemplateData);

  console.info(_resultReport);
  console.info('NOTIFICATION TO ALL STATION SUCCESSFUL');

  process.exit();
}

async function _sendReportMessageToDirector(station) {
  return new Promise(async (resolve, reject) => {
    //Skip TEST station
    if (station.stationsId === 0) {
      Logger.info(`station empty ${station.stationsId} `);
      resolve('OK');
      return;
    }

    let today = moment().format('YYYYMMDD');
    const totalScheduleToday = await CustomerScheduleResourceAccess.customCount({
      CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED],
      daySchedule: today,
      stationsId: station.stationsId,
    });

    // Nếu sô lịch < 5 thì không cần báo cáo
    if (totalScheduleToday > 4) {
      today = moment(today, 'YYYYMMDD').format('DD/MM/YYYY');
      let messageTemplateData = {
        stationsName: station.stationsName,
        workingDay: today,
        totalScheduleToday: totalScheduleToday,
      };

      const template = await MessageTemplateResourceAccess.findById(TEMPLATE_ID.REPORT_DAILY_2);
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
            directorPhoneNumber = directorPhoneNumber.split('_')[0];
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
            deputyDirectorPhoneNumber = deputyDirectorPhoneNumber.split('_')[0];
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
notifyStationReportToAllStations();

module.exports = {
  notifyStationReportToAllStations,
};
