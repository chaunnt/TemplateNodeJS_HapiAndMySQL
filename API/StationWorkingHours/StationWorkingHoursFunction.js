/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const StationWorkingHoursAccess = require('./resourceAccess/StationWorkingHoursAccess');
const { ENABLE_WORKDAY } = require('./StationWorkingHoursConstants');

const defaultData = [
  {
    dateOfWeek: 2,
    startTime: '07:30',
    endTime: '16:30',
    enableWorkDay: ENABLE_WORKDAY.ENABLE,
  },
  {
    dateOfWeek: 3,
    startTime: '07:30',
    endTime: '16:30',
    enableWorkDay: ENABLE_WORKDAY.ENABLE,
  },
  {
    dateOfWeek: 4,
    startTime: '07:30',
    endTime: '16:30',
    enableWorkDay: ENABLE_WORKDAY.ENABLE,
  },
  {
    dateOfWeek: 5,
    startTime: '07:30',
    endTime: '16:30',
    enableWorkDay: ENABLE_WORKDAY.ENABLE,
  },
  {
    dateOfWeek: 6,
    startTime: '07:30',
    endTime: '16:30',
    enableWorkDay: ENABLE_WORKDAY.ENABLE,
  },
  {
    dateOfWeek: 7,
    startTime: '07:30',
    endTime: '11:30',
    enableWorkDay: ENABLE_WORKDAY.ENABLE,
  },
  {
    dateOfWeek: 8, //Sunday
    enableWorkDay: ENABLE_WORKDAY.DISABLE,
  },
];

async function getDetailWorkingHoursByStationId(stationId) {
  // Kiểm tra trạm đã có giờ làm việc trong db chưa
  const stationWokingHoursExisted = await StationWorkingHoursAccess.find({ stationId: stationId });

  // Chưa có thì tạo mới giờ làm việc cho station với các giá trị mặt định
  if (stationWokingHoursExisted.length < 1) {
    //Thêm giờ làm việc của từng thứ trong tuần vào database
    const newWorkingHourEntries = defaultData.map(workingHour => {
      return {
        stationId: stationId,
        dateOfWeek: workingHour.dateOfWeek,
        startTime: workingHour.startTime,
        endTime: workingHour.endTime,
        enableWorkDay: workingHour.enableWorkDay,
      };
    });
    await StationWorkingHoursAccess.insert(newWorkingHourEntries);

    // Lấy worhingHours của trạm vừa mới tạo trả về cho client
    const stationWorkingHours = await StationWorkingHoursAccess.find({ stationId: stationId });

    return stationWorkingHours;
  } else {
    return stationWokingHoursExisted;
  }
}

module.exports = {
  getDetailWorkingHoursByStationId,
};
