/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const VehicleProfileResourceAccess = require('./resourceAccess/VehicleProfileResourceAccess');
const VehicleFileResourceAccess = require('./resourceAccess/VehicleFileResourceAccess');
const { checkValidVehicleIdentity } = require('../AppUserVehicle/AppUserVehicleFunctions');
const { VEHICLE_PROFILE_ERROR } = require('./VehicleProfileConstants');
const { isNotEmptyStringValue } = require('../ApiUtils/utilFunctions');

async function addVehicleInfo(vehicleData) {
  if (!checkValidVehicleIdentity(vehicleData.vehiclePlateNumber)) {
    throw VEHICLE_PROFILE_ERROR.INVALID_PLATE_NUMBER;
  }

  // if (vehicleData.certificateSeries && !checkValidSerial(vehicleData.certificateSeries)) {
  //   throw VEHICLE_PROFILE_ERROR.INVALID_VEHICLE_CERTIFICATE;
  // }

  const isExistedPlateNumber = await checkDuplicatePlateNumber(vehicleData.vehiclePlateNumber, vehicleData.vehiclePlateColor);
  if (isExistedPlateNumber) {
    throw VEHICLE_PROFILE_ERROR.EXISTED_PLATE_NUMBER;
  }

  if (isNotEmptyStringValue(vehicleData.engineNumber)) {
    const isExistedEngineNumber = await checkDuplcateEngineNumber(vehicleData.engineNumber);
    if (isExistedEngineNumber) {
      throw VEHICLE_PROFILE_ERROR.EXISTED_ENGINE_NUMBER;
    }
  }

  if (isNotEmptyStringValue(vehicleData.chassisNumber)) {
    const isExistedChassisNumber = await checkDuplcateChassis(vehicleData.chassisNumber);
    if (isExistedChassisNumber) {
      throw VEHICLE_PROFILE_ERROR.EXISTED_CHASSIS_NUMBER;
    }
  }

  if (isNotEmptyStringValue(vehicleData.vehicleRegistrationCode)) {
    const isExistedRegistrationCode = await checkDuplcateRegistrationCode(vehicleData.vehicleRegistrationCode);
    if (isExistedRegistrationCode) {
      throw VEHICLE_PROFILE_ERROR.EXISTED_REGISTRATION_CODE;
    }
  }

  // update vehicle file list
  const fileList = vehicleData.fileList || [];
  delete vehicleData.fileList;

  const result = await VehicleProfileResourceAccess.insert(vehicleData);

  if (result && result[0] > 0) {
    const vehicleProfileId = result[0];
    await updateVehicleFileList(vehicleProfileId, fileList);
  }

  return result;
}

async function updateVehicleInfo(vehicleProfileId, vehicleData, previousRecord) {
  const isNoChange = _checkNoChange(previousRecord, vehicleData);
  if (isNoChange) {
    return true;
  }

  if (vehicleData.vehiclePlateNumber && !checkValidVehicleIdentity(vehicleData.vehiclePlateNumber)) {
    throw VEHICLE_PROFILE_ERROR.INVALID_PLATE_NUMBER;
  }

  // if (vehicleData.certificateSeries && !checkValidSerial(vehicleData.certificateSeries)) {
  //   throw VEHICLE_PROFILE_ERROR.INVALID_VEHICLE_CERTIFICATE;
  // }

  if (vehicleData.vehiclePlateNumber || vehicleData.vehiclePlateColor) {
    const vehiclePlateNumber = vehicleData.vehiclePlateNumber || previousRecord.vehiclePlateNumber;
    const vehiclePlateColor = vehicleData.vehiclePlateColor || previousRecord.vehiclePlateColor;

    const isExistedPlateNumber = await checkDuplicatePlateNumber(vehiclePlateNumber, vehiclePlateColor, vehicleProfileId);
    if (isExistedPlateNumber) {
      throw VEHICLE_PROFILE_ERROR.EXISTED_PLATE_NUMBER;
    }
  }

  if (vehicleData.engineNumber) {
    const isExistedEngineNumber = await checkDuplcateEngineNumber(vehicleData.engineNumber, vehicleProfileId);
    if (isExistedEngineNumber) {
      throw VEHICLE_PROFILE_ERROR.EXISTED_ENGINE_NUMBER;
    }
  }

  if (vehicleData.chassisNumber) {
    const isExistedChassisNumber = await checkDuplcateChassis(vehicleData.chassisNumber, vehicleProfileId);
    if (isExistedChassisNumber) {
      throw VEHICLE_PROFILE_ERROR.EXISTED_CHASSIS_NUMBER;
    }
  }

  if (isNotEmptyStringValue(vehicleData.vehicleRegistrationCode)) {
    const isExistedRegistrationCode = await checkDuplcateRegistrationCode(vehicleData.vehicleRegistrationCode, vehicleProfileId);
    if (isExistedRegistrationCode) {
      throw VEHICLE_PROFILE_ERROR.EXISTED_REGISTRATION_CODE;
    }
  }

  const result = await VehicleProfileResourceAccess.updateById(vehicleProfileId, vehicleData);
  return result;
}

function _checkNoChange(previousData, updateData) {
  let isMatch = true;
  const keys = Object.keys(updateData);
  for (let i = 0; i < keys.length; i++) {
    if (previousData[keys[i]] != updateData[keys[i]]) {
      isMatch = false;
    }
  }
  return isMatch;
}

async function checkDuplicatePlateNumber(plateNumber, vehiclePlateColor, vehicleId) {
  const existedVehicle = await VehicleProfileResourceAccess.find({ vehiclePlateNumber: plateNumber, vehiclePlateColor: vehiclePlateColor }, 0, 1);

  if (existedVehicle && existedVehicle.length > 0) {
    if (!vehicleId) {
      return true;
    }
    return existedVehicle[0].vehicleProfileId !== vehicleId;
  }

  return false;
}

async function checkDuplcateEngineNumber(engineNumber, vehicleId) {
  const existedVehicle = await VehicleProfileResourceAccess.find({ engineNumber: engineNumber }, 0, 1);

  if (existedVehicle && existedVehicle.length > 0) {
    if (!vehicleId) {
      return true;
    }
    return existedVehicle[0].vehicleProfileId !== vehicleId;
  }

  return false;
}

async function checkDuplcateRegistrationCode(registrationCode, vehicleId) {
  const existedVehicle = await VehicleProfileResourceAccess.find({ vehicleRegistrationCode: registrationCode }, 0, 1);

  if (existedVehicle && existedVehicle.length > 0) {
    if (!vehicleId) {
      return true;
    }
    return existedVehicle[0].vehicleProfileId !== vehicleId;
  }

  return false;
}

async function checkDuplcateChassis(chassisNumber, vehicleId) {
  const existedVehicle = await VehicleProfileResourceAccess.find({ chassisNumber: chassisNumber }, 0, 1);

  if (existedVehicle && existedVehicle.length > 0) {
    if (!vehicleId) {
      return true;
    }
    return existedVehicle[0].vehicleProfileId !== vehicleId;
  }

  return false;
}

function checkValidSerial(serial) {
  const regex = /^[A-Z]{2}-\d{7}$/;
  return regex.test(serial);
}

async function getDetailVehicleProfile(id) {
  const vehicleDetail = await VehicleProfileResourceAccess.findById(id);
  if (vehicleDetail) {
    let vehicleFileList = await VehicleFileResourceAccess.find({ vehicleProfileId: id });
    if (vehicleFileList && vehicleFileList.length > 0) {
      vehicleFileList = vehicleFileList.map(file => ({
        vehicleFileId: file.vehicleFileId,
        vehicleFileName: file.vehicleFileName,
        vehicleFileUrl: file.vehicleFileUrl,
        vehicleFileType: file.vehicleFileType,
      }));
      vehicleDetail.fileList = vehicleFileList;
    } else {
      vehicleDetail.fileList = [];
    }
    return vehicleDetail;
  } else {
    return null;
  }
}

async function updateVehicleFileList(vehicleProfileId, vehicleFileList = []) {
  if (vehicleFileList.length === 0) {
    return true;
  }

  const vehicleFiles = (await VehicleFileResourceAccess.find({ vehicleProfileId: vehicleProfileId })) || [];

  const unchangedVehicleFileIds = vehicleFileList.map(vehicleFile => vehicleFile.vehicleFileId);

  const deletdIds = [];
  for (let file of vehicleFiles) {
    if (!unchangedVehicleFileIds.includes(file.vehicleFileId)) {
      deletdIds.push(file.vehicleFileId);
    }
  }

  // insert or update vehicle file
  const promiseList = vehicleFileList.map(vehicleFile => {
    if (vehicleFile.vehicleFileId) {
      // update
      const updateData = {
        vehicleFileName: vehicleFile.vehicleFileName,
      };

      return VehicleFileResourceAccess.updateById(vehicleFile.vehicleFileId, updateData);
    } else {
      // insert
      vehicleFile.vehicleProfileId = vehicleProfileId;
      return VehicleFileResourceAccess.insert(vehicleFile);
    }
  });

  const updateResult = await Promise.all(promiseList);

  const isUpdateSuccess = updateResult.every(result => result);

  // update success then delete
  if (isUpdateSuccess) {
    const deleteResult = await _deleteVehicleFiles(deletdIds);
    const isDeleteSuccess = deleteResult.every(result => result);
    return isDeleteSuccess;
  }

  return isUpdateSuccess;
}

async function _deleteVehicleFiles(vehicleFileListIds) {
  const promiseList = vehicleFileListIds.map(vehicleId => {
    return VehicleFileResourceAccess.deleteById(vehicleId);
  });

  return Promise.all(promiseList);
}

module.exports = {
  addVehicleInfo,
  updateVehicleInfo,
  getDetailVehicleProfile,
  updateVehicleFileList,
};
