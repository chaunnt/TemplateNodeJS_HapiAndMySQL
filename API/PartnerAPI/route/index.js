/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const PartnerAPI = require('./PartnerAPIRoute');

//Đây là hệ thống API dành cho đối tác bên ngoài sử dụng đến.
//Hệ thống nội bộ của TTDK không sử dụng bất kỳ API nào trong này
module.exports = [
  //Lịch hẹn
  { method: 'POST', path: '/PartnerAPI/CustomerSchedule/user/createSchedule', config: PartnerAPI.userCreateSchedule },
  { method: 'POST', path: '/PartnerAPI/CustomerSchedule/user/getListSchedule', config: PartnerAPI.userGetListSchedule },
  { method: 'POST', path: '/PartnerAPI/CustomerSchedule/user/cancelSchedule', config: PartnerAPI.userCancelSchedule },
  { method: 'POST', path: '/PartnerAPI/CustomerSchedule/user/getDetailSchedule', config: PartnerAPI.userGetDetailSchedule },

  //Thông tin trung tâm
  { method: 'POST', path: '/PartnerAPI/Stations/user/getAllExternal', config: PartnerAPI.userGetAllExternalStation },
  { method: 'POST', path: '/PartnerAPI/Stations/user/getAllStationArea', config: PartnerAPI.userGetAllStationArea },
  { method: 'POST', path: '/PartnerAPI/Stations/user/getDetail', config: PartnerAPI.userGetDetailStation },
  { method: 'POST', path: '/PartnerAPI/Stations/user/getListScheduleDate', config: PartnerAPI.userGetListScheduleDate },
  { method: 'POST', path: '/PartnerAPI/Stations/user/getListScheduleTime', config: PartnerAPI.userGetListScheduleTime },

  //Meta data
  { method: 'POST', path: '/PartnerAPI/SystemConfigurations/getMetaData', config: PartnerAPI.partnerGetMetaData },
];
