/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const { SERVICE_TYPES } = require('./StationServicesConstants');
const StationServicesResourceAccess = require('./resourceAccess/StationServicesResourceAccess');
const StationView = require('./resourceAccess/StationsView');
const { getDetailWorkingHoursByStationId } = require('../StationWorkingHours/StationWorkingHoursFunction');
const StationDetailPublicModel = require('../Stations/model/StationDetailPublicModel');

async function addDefaultServicesForStations(stationsId) {
  let _defaultStationServices = [
    {
      stationsId: stationsId,
      serviceType: SERVICE_TYPES.CHECKING_VIOLATION,
      servicePrice: 0,
      serviceName: 'Tra cứu phạt nguội',
    },
    {
      stationsId: stationsId,
      serviceType: SERVICE_TYPES.INSPECT_CAR,
      servicePrice: 0,
      serviceName: 'Đăng kiểm xe cơ giới',
    },
  ];
  await StationServicesResourceAccess.insert(_defaultStationServices);
}

async function getStationListByServices(filter, searchText, skip, limit, order) {
  let stations = await StationView.customSearch(filter, searchText, skip, limit, order);

  if (stations && stations.length > 0) {
    for (let i = 0; i < stations.length; i++) {
      stations[i] = StationDetailPublicModel.fromData(stations[i]);
      let stationWokingHours = await getDetailWorkingHoursByStationId(stations[i].stationsId);
      stations[i].stationWorkTimeConfig = stationWokingHours;
      stations[i].shareLink = `${process.env.SHARE_HOST_NAME}/AppSharing/Stations/${stations[i].stationCode}`;
    }

    let stationsCount = await StationView.customCount(filter, searchText, order);
    return { data: stations, total: stationsCount };
  }

  return { data: [], total: 0 };
}

module.exports = {
  addDefaultServicesForStations,
  getStationListByServices,
};
