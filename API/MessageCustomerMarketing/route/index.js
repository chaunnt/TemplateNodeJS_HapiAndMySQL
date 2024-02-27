/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const MessageCustomerMarketing = require('./MessageCustomerMarketingRoute');

module.exports = [
  { method: 'POST', path: '/MessageCustomerMarketing/find', config: MessageCustomerMarketing.find },
  { method: 'POST', path: '/MessageCustomerMarketing/findById', config: MessageCustomerMarketing.findById },
  { method: 'POST', path: '/MessageCustomerMarketing/updateById', config: MessageCustomerMarketing.updateById },
  { method: 'POST', path: '/MessageCustomerMarketing/getReportOfStation', config: MessageCustomerMarketing.getReportOfStation },

  { method: 'POST', path: '/MessageCustomerMarketing/advanceUser/sendTestSMS', config: MessageCustomerMarketing.advanceUserSendSMS },
  { method: 'POST', path: '/MessageCustomerMarketing/advanceUser/sendTestZNS', config: MessageCustomerMarketing.advanceUserSendZNS },
  { method: 'POST', path: '/MessageCustomerMarketing/advanceUser/sendTestEmail', config: MessageCustomerMarketing.advanceUserSendSMS },
  { method: 'POST', path: '/MessageCustomerMarketing/advanceUser/sendTestAPNS', config: MessageCustomerMarketing.advanceUserSendSMS },
  { method: 'POST', path: '/MessageCustomerMarketing/advanceUser/updateById', config: MessageCustomerMarketing.advanceUserUpdateById },
  { method: 'POST', path: '/MessageCustomerMarketing/advanceUser/findById', config: MessageCustomerMarketing.advanceUserGetDetail },
  { method: 'POST', path: '/MessageCustomerMarketing/advanceUser/findTemplates', config: MessageCustomerMarketing.advanceUserFindTemplates },

  { method: 'POST', path: '/MessageCustomerMarketing/advanceUser/cancelSMSMessage', config: MessageCustomerMarketing.advanceUserCancelSMSMessage },

  {
    method: 'POST',
    path: '/MessageCustomerMarketing/advanceUser/sendSMSMessageToCustomerList',
    config: MessageCustomerMarketing.advanceUserSendSMSMessageToCustomerList,
  },
  {
    method: 'POST',
    path: '/MessageCustomerMarketing/advanceUser/sendZNSMessageToCustomerList',
    config: MessageCustomerMarketing.advanceUserSendZNSToCustomerList,
  },
  {
    method: 'POST',
    path: '/MessageCustomerMarketing/advanceUser/sendAPNSMessageToCustomerList',
    config: MessageCustomerMarketing.advanceUserSendMessageToCustomer,
  },
  {
    method: 'POST',
    path: '/MessageCustomerMarketing/advanceUser/sendEmailMessageToCustomerList',
    config: MessageCustomerMarketing.advanceUserSendMessageToCustomer,
  },
  { method: 'POST', path: '/MessageCustomerMarketing/advanceUser/getList', config: MessageCustomerMarketing.advanceUserGetList },
  { method: 'POST', path: '/MessageCustomerMarketing/advanceUser/getReportList', config: MessageCustomerMarketing.advanceUserGetReport },

  { method: 'POST', path: '/MessageCustomerMarketing/robot/receiveVMGResult', config: MessageCustomerMarketing.receiveVMGResult },
  { method: 'POST', path: '/MessageCustomerMarketing/configQuantityMessage', config: MessageCustomerMarketing.configQuantityMessageMarketing },
  { method: 'POST', path: '/MessageCustomerMarketing/getMessageMarketingConfig', config: MessageCustomerMarketing.getMessageMarketingConfig },
  {
    method: 'POST',
    path: '/MessageCustomerMarketing/advanceUser/getMessageMarketingConfig',
    config: MessageCustomerMarketing.advanceUserGetMessageMarketingConfig,
  },
  { method: 'POST', path: '/MessageCustomerMarketing/advanceUser/getFailedMessage', config: MessageCustomerMarketing.advanceUserGetFailedMessage },
];
