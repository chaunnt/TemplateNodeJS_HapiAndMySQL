/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const { lockUser } = require('../../AppUsers/AppUsersFunctions');
const { addMessageCustomer } = require('../../CustomerMessage/CustomerMessageFunctions');
const { cancelUserSchedule } = require('../CustomerScheduleFunctions');
const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const { ReadCSVToJSON } = require('../../../ThirdParty/CSVToJSON/CSVToJSON');

//~~!!!! CẨN THẬN CODE NÀY TRƯỚC KHI MỞ RA CHẠY
async function cancelInvalidScheduleById(customerScheduleId) {
  console.info(`cancelInvalidScheduleById ${customerScheduleId}`);
  let invalidSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

  //khoa tai khoan
  await lockUser(invalidSchedule.appUserId);

  let _reasonTitle = 'Lịch hẹn bị hủy';
  let _reasonContent = 'lịch hẹn bị hủy do nghi ngờ hành vi bất chính';
  try {
    await cancelUserSchedule(invalidSchedule.appUserId, invalidSchedule.customerScheduleId, _reasonContent);
    await addMessageCustomer(_reasonTitle, undefined, _reasonContent, undefined, invalidSchedule.appUserId);
  } catch (error) {
    console.error(error);
  }
}

//we will cancel all spam schedule and lock the account
async function cancelAllInvalidSchedule() {
  console.info(`cancelAllSpamSchedule ${new Date()}`);
  let _listInvalidSchedule = await ReadCSVToJSON(
    '/Users/nexle/qtproject/Kiemdinhoto_StationServer/API/CustomerSchedule/script/data/202306091450_lichhenbatchinh.csv',
  );
  for (let i = 0; i < _listInvalidSchedule.length; i++) {
    const _invalidSchedule = _listInvalidSchedule[i];
    await cancelInvalidScheduleById(_invalidSchedule.customerScheduleId);
  }
  console.info(`cancelAllInvalidSchedule complete ${new Date()}`);
}
cancelAllInvalidSchedule();
