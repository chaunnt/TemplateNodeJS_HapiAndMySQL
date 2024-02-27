/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const CustomerReceiptRoute = require('./CustomerReceiptRoute');

module.exports = [
  // { method: 'POST', path: '/CustomerReceipt/insert', config: CustomerReceiptRoute.insert },
  { method: 'POST', path: '/CustomerReceipt/find', config: CustomerReceiptRoute.find },
  { method: 'POST', path: '/CustomerReceipt/findById', config: CustomerReceiptRoute.findById },
  // { method: 'POST', path: '/CustomerReceipt/updateById', config: CustomerReceiptRoute.updateById },
  // { method: 'POST', path: '/CustomerReceipt/deleteById', config: CustomerReceiptRoute.deleteById },
  // { method: 'POST', path: '/CustomerReceipt/exportReceiptToExcel', config: CustomerReceiptRoute.exportReceiptExcel },

  { method: 'POST', path: '/CustomerReceipt/user/userGetList', config: CustomerReceiptRoute.userGetList },
  { method: 'POST', path: '/CustomerReceipt/user/getDetail', config: CustomerReceiptRoute.getDetailById },
  { method: 'POST', path: '/CustomerReceipt/user/getDetailByExternalRef', config: CustomerReceiptRoute.getDetailByExternalRef },
  { method: 'POST', path: '/CustomerReceipt/user/updateById', config: CustomerReceiptRoute.userUpdateById },
  { method: 'POST', path: '/CustomerReceipt/user/userCreate', config: CustomerReceiptRoute.userCreateReceipt },
  { method: 'POST', path: '/CustomerReceipt/user/userGetListOneUser', config: CustomerReceiptRoute.userGetListOneUser },

  { method: 'POST', path: '/CustomerReceipt/advanceUser/updateById', config: CustomerReceiptRoute.advanceUserUpdateById },
  { method: 'POST', path: '/CustomerReceipt/advanceUser/cancelById', config: CustomerReceiptRoute.advanceUserCancelById },
  { method: 'POST', path: '/CustomerReceipt/advanceUser/payById', config: CustomerReceiptRoute.advanceUserPayById },
  { method: 'POST', path: '/CustomerReceipt/advanceUser/getDetailByRef', config: CustomerReceiptRoute.advanceUserGetDetailByRef },
  { method: 'POST', path: '/CustomerReceipt/advanceUser/getDetail', config: CustomerReceiptRoute.advanceUserGetDetail },
  { method: 'POST', path: '/CustomerReceipt/advanceUser/userCreate', config: CustomerReceiptRoute.advanceUserCreateReceipt },
  { method: 'POST', path: '/CustomerReceipt/advanceUser/userGetList', config: CustomerReceiptRoute.advanceUserGetList },
  // { method: 'POST', path: '/CustomerReceipt/advanceUser/exportReceiptToExcel', config: CustomerReceiptRoute.advanceUserExportReceiptExcel },
];
