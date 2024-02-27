/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const { _getDefaultBookingConfig } = require('../resourceAccess/StationsResourceAccess');
const StationsResourceAccess = require('../resourceAccess/StationsResourceAccess');
const { STATION_TYPE, STATION_STATUS } = require('../StationsConstants');
const StationsManager = require('../../Stations/manager/StationsManager');

async function seedStationsHelpService() {
  const { HELPSERVICE_STATIONS } = require('../data/HelpServiceStation');
  const { STATIONS_AREA } = require('../data/StationsArea');

  const stationList = HELPSERVICE_STATIONS;
  const areaData = STATIONS_AREA;
  const codeChar = 'CH';

  // Tạo một đối tượng để theo dõi số thứ tự trạm cho mỗi khu vực
  const stationCountByArea = {};

  function _generateStationCode(areaCode) {
    // Lấy số thứ tự trạm cho khu vực hiện tại hoặc thiết lập nếu chưa tồn tại
    if (!stationCountByArea[areaCode]) {
      stationCountByArea[areaCode] = 1;
    } else {
      stationCountByArea[areaCode]++;
    }

    // Định dạng số thứ tự thành chuỗi hai chữ số (VD: 01, 02, ...)
    const formattedCount = stationCountByArea[areaCode].toString().padStart(2, '0');

    // Tạo mã trạm dựa trên areaCode và số thứ tự
    const stationCode = `${codeChar}${areaCode}${formattedCount}A`;

    return stationCode;
  }

  // Sử dụng hàm _generateStationCode để tạo mã trạm cho mỗi trạm trong stationList
  stationList.forEach(station => {
    const areaCode = areaData.find(area => area.value === station.stationArea).code;
    station.stationCode = _generateStationCode(areaCode);
  });

  for (let i = 0; i < stationList.length; i++) {
    const _station = stationList[i];

    let _existingStation = await StationsResourceAccess.find({
      stationCode: _station.stationCode,
    });
    if (_existingStation && _existingStation.length > 0) {
      console.info(`update station ${_station.stationCode}`);
      let _updateDate = {
        stationArea: _station.stationArea,
        stationsName: _station.stationsName,
      };
      if (_existingStation[0].stationBookingConfig) {
        _existingStation[0].stationBookingConfig = JSON.parse(_existingStation[0].stationBookingConfig);
        let _totalSmallCar = 0;
        let _totalOtherVehicle = 0;
        for (let i = 0; i < _existingStation[0].stationBookingConfig.length; i++) {
          _existingStation[0].stationBookingConfig[i].limitOtherVehicle = _existingStation[0].stationBookingConfig[i].limitSmallCar * 1;
          _totalSmallCar += _existingStation[0].stationBookingConfig[i].limitSmallCar * 1;
          _totalOtherVehicle += _existingStation[0].stationBookingConfig[i].limitOtherVehicle * 1;
          _totalOtherVehicle += _existingStation[0].stationBookingConfig[i].limitRoMooc * 1;
        }
        _updateDate.stationBookingConfig = JSON.stringify(_existingStation[0].stationBookingConfig);
        _updateDate.totalSmallCar = _totalSmallCar;
        _updateDate.totalOtherVehicle = _totalOtherVehicle;
        _updateDate.totalRoMooc = _totalOtherVehicle;
      }
      _updateDate.stationStatus = STATION_STATUS.ACTIVE;

      await StationsResourceAccess.updateById(_existingStation[0].stationsId, _updateDate);
      continue;
    }

    let _newStationData = {
      stationsName: _station.stationsName,
      stationCode: _station.stationCode,
      stationsAddress: _station.stationsAddress,
      stationsHotline: _station.stationsHotline,
      // stationsFax: _station.stationsFax,
      stationsEmail: _station.stationsEmail,
      stationsManager: _station.stationsManagerName,
      stationsManagerPhone: _station.stationsManagerPhone,
      stationType: STATION_TYPE.HELPSERVICE,
      stationMapSource: _station.stationMapSource,
      stationBookingConfig: _getDefaultBookingConfig(),
      stationArea: _station.stationArea,
      stationStatus: STATION_STATUS.ACTIVE,
    };

    await StationsManager.insert({
      payload: {
        ..._newStationData,
      },
    });
  }
}

async function seedDatabase() {
  console.info('seedDatabase');
  await seedStationsHelpService();
  console.info('seeding done');
}

seedDatabase();
