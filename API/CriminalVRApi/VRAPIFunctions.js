const { doubleCheckLicensePlate } = require('../../ThirdParty/VRORGAPI/VRORGFunctions');
const { VEHICLE_PLATE_TYPE } = require('../AppUserVehicle/AppUserVehicleConstant');

async function fetchVehicleDataFromVrAPI(vehicleIdentity, certificateSeries, vehiclePlateColor) {
  let _vehiclePlateColorChar = undefined;
  if (vehiclePlateColor === VEHICLE_PLATE_TYPE.BLUE) {
    _vehiclePlateColorChar = 'X';
  }

  const _dataFromVr = await doubleCheckLicensePlate(vehicleIdentity, certificateSeries, vehiclePlateColor);
  let _vehicleDataFromVr = _dataFromVr ? _dataFromVr.data : undefined;
  if (_vehicleDataFromVr) {
    return _vehicleDataFromVr;
  } else {
    if (_dataFromVr && _dataFromVr.error) {
      const HAS_ERROR = 1;
      const VRVehicleLogResourceAccess = require('../SystemAppLogChangeVehicle/resourceAccess/VRVehicleLogResourceAccess');
      await VRVehicleLogResourceAccess.insert({
        vehicleIdentity: vehicleIdentity,
        certificateSeries: certificateSeries,
        vrError: _dataFromVr.error,
        hasError: HAS_ERROR,
      });
    }
  }
  return undefined;
}

module.exports = {
  fetchVehicleDataFromVrAPI,
};
