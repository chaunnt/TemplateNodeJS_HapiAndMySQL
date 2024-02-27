/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
// const StationsResource = require('../../Stations/resourceAccess/StationsResourceAccess');
// const CustomerMessageEmailProcess = require('./CustomerMessageEmailJob');
// const CustomerMessageSMSProcess = require('./CustomerMessageSMSJob');
const GenerateMessageProcess = require('./GenerateCustomerMessage');
const CustomerMessageNotificationJob = require('./CustomerMessageNotificationJob');
const Logger = require('../../../utils/logging');

async function systemAutoGenerateMessage() {
  Logger.info(`systemAutoGenerateMessage`);
  let promiseList = [];

  //tao ra message cho tung customer tu group message
  const promiseGenerateMessage = new Promise(async (resolve, reject) => {
    let result = await GenerateMessageProcess.generateCustomerMessageFromGroupMessage();
    resolve(result);
  });
  promiseList.push(promiseGenerateMessage);

  // //gui message email cho tung customer
  // const promiseEmail = new Promise(async (resolve, reject) => {
  //   let result = await CustomerMessageEmailProcess.sendMessageEmailToCustomer(station);
  //   resolve(result);
  // });
  // promiseList.push(promiseEmail);

  // //gui message sms cho tung customer
  // const promiseSMS = new Promise(async (resolve, reject) => {
  //   let result = await CustomerMessageSMSProcess.sendMessageSMSToCustomer(station);
  //   resolve(result);
  // });
  // promiseList.push(promiseSMS);

  //gui notification cho tung customer
  const promiseNoti = new Promise(async (resolve, reject) => {
    let result = await CustomerMessageNotificationJob.sendNotificationToUser();
    resolve(result);
  });
  promiseList.push(promiseNoti);

  Promise.all(promiseList).then(values => {
    Logger.info(`systemAutoGenerateMessage response ${values}`);
  });
}

module.exports = {
  systemAutoGenerateMessage,
};
