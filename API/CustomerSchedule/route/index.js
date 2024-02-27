/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const CustomerSchedule = require('./CustomerScheduleRoute');

module.exports = [
  // { method: 'POST', path: '/CustomerSchedule/add', config: CustomerSchedule.insert },
  // { method: 'POST', path: '/CustomerSchedule/update', config: CustomerSchedule.updateById },
  { method: 'POST', path: '/CustomerSchedule/cancelSchedule', config: CustomerSchedule.staffCancelSchedule },
  { method: 'POST', path: '/CustomerSchedule/findById', config: CustomerSchedule.findById },
  { method: 'POST', path: '/CustomerSchedule/list', config: CustomerSchedule.getList },
  { method: 'POST', path: '/CustomerSchedule/find', config: CustomerSchedule.find },
  { method: 'POST', path: '/CustomerSchedule/delete', config: CustomerSchedule.deleteById },
  { method: 'POST', path: '/CustomerSchedule/exportExcel', config: CustomerSchedule.exportExcelCustomerSchedule },
  { method: 'POST', path: '/CustomerSchedule/reportTotalByDay', config: CustomerSchedule.reportTotalByDay },
  { method: 'POST', path: '/CustomerSchedule/reportTotalScheduleByStation', config: CustomerSchedule.reportTotalScheduleByStation },
  { method: 'POST', path: '/CustomerSchedule/reportTotalScheduleByStationArea', config: CustomerSchedule.reportTotalScheduleByStationArea },
  { method: 'POST', path: '/CustomerSchedule/reportCustomerSchedule', config: CustomerSchedule.reportCustomerSchedule },
  { method: 'POST', path: '/CustomerSchedule/updateById', config: CustomerSchedule.adminUpdateById },

  { method: 'POST', path: '/CustomerSchedule/user/userCreateConsultant', config: CustomerSchedule.userCreateConsultant },
  { method: 'POST', path: '/CustomerSchedule/user/createSchedule', config: CustomerSchedule.userCreateSchedule },
  { method: 'POST', path: '/CustomerSchedule/user/getListSchedule', config: CustomerSchedule.userGetListSchedule },
  { method: 'POST', path: '/CustomerSchedule/user/cancelSchedule', config: CustomerSchedule.userCancelSchedule },
  { method: 'POST', path: '/CustomerSchedule/user/getDetailSchedule', config: CustomerSchedule.userGetDetailSchedule },
  { method: 'POST', path: '/CustomerSchedule/user/createRoadFeeSchedule', config: CustomerSchedule.userCreateRoadFeeSchedule },
  { method: 'POST', path: '/CustomerSchedule/user/createInspectionFeeSchedule', config: CustomerSchedule.userCreateInspectionFeeSchedule },
  { method: 'POST', path: '/CustomerSchedule/user/createInsuranceFeeSchedule', config: CustomerSchedule.userCreateInsuranceFeeSchedule },

  { method: 'POST', path: '/CustomerSchedule/advanceUser/getDetailSchedule', config: CustomerSchedule.advanceUserGetDetailSchedule },
  { method: 'POST', path: '/CustomerSchedule/advanceUser/update', config: CustomerSchedule.advanceUserUpdateById },
  { method: 'POST', path: '/CustomerSchedule/advanceUser/list', config: CustomerSchedule.advanceUserGetListSchedule },
  { method: 'POST', path: '/CustomerSchedule/advanceUser/cancelSchedule', config: CustomerSchedule.advanceUserCancelSchedule },
  { method: 'POST', path: '/CustomerSchedule/advanceUser/exportExcel', config: CustomerSchedule.advanceUserExportSchedule },
  { method: 'POST', path: '/CustomerSchedule/advanceUser/insertSchedule', config: CustomerSchedule.advanceUserInsertSchedule },
  { method: 'POST', path: '/CustomerSchedule/advanceUser/searchSchedule', config: CustomerSchedule.advanceUserSearchSchedule },
  { method: 'POST', path: '/CustomerSchedule/user/calculateInsurance', config: CustomerSchedule.calculateInsurance },
  { method: 'POST', path: '/CustomerSchedule/user/findByHash', config: CustomerSchedule.getScheduleByHash },
];
