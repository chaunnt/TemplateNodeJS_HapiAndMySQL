/* Copyright (c) 2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const AppUserVehicleResourceAccess = require('../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const {
  USER_VEHICLE_ERROR,
  VEHICLE_TYPE,
  VEHICLE_PLATE_TYPE,
  VERIFICATION_STATUS,
  NEW_VEHICLE_CERTIFICATE,
  VEHICLE_SUB_TYPE,
  VEHICLE_SUB_CATEGORY,
  CRIMINAL,
} = require('./AppUserVehicleConstant');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const { APP_USER_CATEGORY } = require('../AppUsers/AppUsersConstant');
const VRORGFunctions = require('../../ThirdParty/VRORGAPI/VRORGFunctions');
const Logger = require('../../utils/logging');
const { isValidValue, checkingValidPlateNumber } = require('../ApiUtils/utilFunctions');
const AppUserVehicleStampAccess = require('../AppUserVehicleStamp/resourceAccess/AppUserVehicleStampAccess');
const { reportToTelegram } = require('../../ThirdParty/TelegramBot/TelegramBotFunctions');
const { LICENSE_PLATE_COLOR } = require('../CustomerSchedule/CustomerScheduleConstants');
const { fetchVehicleDataFromVrAPI } = require('../CriminalVRApi/VRAPIFunctions');

function getVehicleTypeFromVehicleSubType(vehicleSubType) {
  if (vehicleSubType === VEHICLE_SUB_TYPE.CAR) {
    return VEHICLE_TYPE.CAR;
  } else if (vehicleSubType === VEHICLE_SUB_TYPE.RO_MOOC) {
    return VEHICLE_TYPE.RO_MOOC;
  } else {
    return VEHICLE_TYPE.OTHER;
  }
}

const VEHICLE_SUB_CATEGORY_MAPPING = {
  XE_CHO_NGUOI: [
    VEHICLE_SUB_CATEGORY.OTO_4CHO,
    VEHICLE_SUB_CATEGORY.OTO_5CHO,
    VEHICLE_SUB_CATEGORY.OTO_6CHO,
    VEHICLE_SUB_CATEGORY.OTO_7CHO,
    VEHICLE_SUB_CATEGORY.OTO_8CHO,
    VEHICLE_SUB_CATEGORY.OTO_9CHO,
    VEHICLE_SUB_CATEGORY.OTO_10CHO,
    VEHICLE_SUB_CATEGORY.OTO_11CHO,
    VEHICLE_SUB_CATEGORY.OTO_12CHO,
    VEHICLE_SUB_CATEGORY.OTO_13CHO,
    VEHICLE_SUB_CATEGORY.OTO_14CHO,
    VEHICLE_SUB_CATEGORY.OTO_15CHO,
    VEHICLE_SUB_CATEGORY.OTO_16CHO,
    VEHICLE_SUB_CATEGORY.OTO_17CHO,
    VEHICLE_SUB_CATEGORY.OTO_18CHO,
    VEHICLE_SUB_CATEGORY.OTO_19CHO,
    VEHICLE_SUB_CATEGORY.OTO_20CHO,
    VEHICLE_SUB_CATEGORY.OTO_21CHO,
    VEHICLE_SUB_CATEGORY.OTO_22CHO,
    VEHICLE_SUB_CATEGORY.OTO_23CHO,
    VEHICLE_SUB_CATEGORY.OTO_24CHO,
    VEHICLE_SUB_CATEGORY.OTO_25CHO,
    VEHICLE_SUB_CATEGORY.OTO_29CHO,
    VEHICLE_SUB_CATEGORY.OTO_45CHO,
    VEHICLE_SUB_CATEGORY.OTO_52CHO,
  ],
  XE_CHO_HANG: [
    VEHICLE_SUB_CATEGORY.XE_BAN_TAI,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_1TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_2TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_3TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_4TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_5TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_6TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_7TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_8TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_9TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_10TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_11TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_12TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_13TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_14TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_15TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_16TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_17TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_18TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_19TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_27TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_40TAN,
    VEHICLE_SUB_CATEGORY.XE_TAI_TREN_40TAN,
  ],
  XE_DAU_KEO: [
    VEHICLE_SUB_CATEGORY.XE_DAU_KEO_DUOI_19TAN,
    VEHICLE_SUB_CATEGORY.XE_DAU_KEO_DUOI_27TAN,
    VEHICLE_SUB_CATEGORY.XE_DAU_KEO_DUOI_40TAN,
    VEHICLE_SUB_CATEGORY.XE_DAU_KEO_TREN_40TAN,
  ],
  XE_CHUYEN_DUNG: [VEHICLE_SUB_CATEGORY.XE_CHUYENDUNG, VEHICLE_SUB_CATEGORY.XE_CUU_THUONG],
  RO_MOOC: [VEHICLE_SUB_CATEGORY.XE_ROMOOC],
  XE_CO_DONG_CO: [VEHICLE_SUB_CATEGORY.XE_BONBANH_CO_DONG_CO],
};

function getSeatCountBySubCategory(vehicleSubCategory) {
  switch (vehicleSubCategory) {
    case VEHICLE_SUB_CATEGORY.OTO_5CHO:
      return 5;
    case VEHICLE_SUB_CATEGORY.OTO_6CHO:
      return 6;
    case VEHICLE_SUB_CATEGORY.OTO_7CHO:
      return 7;
    case VEHICLE_SUB_CATEGORY.OTO_8CHO:
      return 8;
    case VEHICLE_SUB_CATEGORY.OTO_9CHO:
      return 9;
    case VEHICLE_SUB_CATEGORY.OTO_10CHO:
      return 10;
    case VEHICLE_SUB_CATEGORY.OTO_11CHO:
      return 11;
    case VEHICLE_SUB_CATEGORY.OTO_12CHO:
      return 12;
    case VEHICLE_SUB_CATEGORY.OTO_13CHO:
      return 13;
    case VEHICLE_SUB_CATEGORY.OTO_14CHO:
      return 14;
    case VEHICLE_SUB_CATEGORY.OTO_15CHO:
      return 15;
    case VEHICLE_SUB_CATEGORY.OTO_16CHO:
      return 16;
    case VEHICLE_SUB_CATEGORY.OTO_17CHO:
      return 17;
    case VEHICLE_SUB_CATEGORY.OTO_18CHO:
      return 18;
    case VEHICLE_SUB_CATEGORY.OTO_19CHO:
      return 19;
    case VEHICLE_SUB_CATEGORY.OTO_20CHO:
      return 20;
    case VEHICLE_SUB_CATEGORY.OTO_21CHO:
      return 21;
    case VEHICLE_SUB_CATEGORY.OTO_22CHO:
      return 22;
    case VEHICLE_SUB_CATEGORY.OTO_23CHO:
      return 23;
    case VEHICLE_SUB_CATEGORY.OTO_24CHO:
      return 24;
    case VEHICLE_SUB_CATEGORY.OTO_25CHO:
      return 25;
    case VEHICLE_SUB_CATEGORY.OTO_29CHO:
      return 29;
    case VEHICLE_SUB_CATEGORY.OTO_45CHO:
      return 45;
    case VEHICLE_SUB_CATEGORY.OTO_52CHO:
      return 52;
    default:
      break;
  }
  return null;
}

function getVehicleTotalWeightBySubCategory(vehicleSubCategory) {
  switch (vehicleSubCategory) {
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_1TAN:
      return { min: 1, max: 999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_2TAN:
      return { min: 1000, max: 1999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_3TAN:
      return { min: 2000, max: 2999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_4TAN:
      return { min: 3000, max: 3999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_5TAN:
      return { min: 4000, max: 4999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_6TAN:
      return { min: 5000, max: 5999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_7TAN:
      return { min: 6000, max: 6999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_8TAN:
      return { min: 7000, max: 7999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_9TAN:
      return { min: 8000, max: 8999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_10TAN:
      return { min: 9000, max: 9999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_11TAN:
      return { min: 10000, max: 10999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_12TAN:
      return { min: 11000, max: 11999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_13TAN:
      return { min: 12000, max: 12999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_14TAN:
      return { min: 13000, max: 13999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_15TAN:
      return { min: 14000, max: 14999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_16TAN:
      return { min: 15000, max: 15999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_17TAN:
      return { min: 16000, max: 16999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_18TAN:
      return { min: 17000, max: 17999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_19TAN:
      return { min: 18000, max: 18999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_27TAN:
      return { min: 19000, max: 26999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_DUOI_40TAN:
      return { min: 27000, max: 39999 };
    case VEHICLE_SUB_CATEGORY.XE_TAI_TREN_40TAN:
      return { min: 40000, max: 49999 };

    case VEHICLE_SUB_CATEGORY.XE_DAU_KEO_DUOI_19TAN:
      return { min: 1, max: 18999 };
    case VEHICLE_SUB_CATEGORY.XE_DAU_KEO_DUOI_27TAN:
      return { min: 19000, max: 26999 };
    case VEHICLE_SUB_CATEGORY.XE_DAU_KEO_DUOI_40TAN:
      return { min: 27000, max: 39999 };
    case VEHICLE_SUB_CATEGORY.XE_DAU_KEO_TREN_40TAN:
      return { min: 40000, max: 49999 };
    default:
      break;
  }
  return null;
}

function getVehicleCategoryFromVehicleSubCategory(vehicleSubCategory) {
  if (VEHICLE_SUB_CATEGORY_MAPPING.XE_CHO_NGUOI.indexOf(vehicleSubCategory) >= 0) {
    return VRORGFunctions.VR_VEHICLE_TYPE.XE_CHO_NGUOI;
  }

  if (VEHICLE_SUB_CATEGORY_MAPPING.XE_CHO_HANG.indexOf(vehicleSubCategory) >= 0) {
    return VRORGFunctions.VR_VEHICLE_TYPE.XE_CHO_HANG;
  }

  if (VEHICLE_SUB_CATEGORY_MAPPING.XE_DAU_KEO.indexOf(vehicleSubCategory) >= 0) {
    return VRORGFunctions.VR_VEHICLE_TYPE.XE_DAU_KEO;
  }

  if (VEHICLE_SUB_CATEGORY_MAPPING.RO_MOOC.indexOf(vehicleSubCategory) >= 0) {
    return VRORGFunctions.VR_VEHICLE_TYPE.RO_MOOC;
  }

  if (VEHICLE_SUB_CATEGORY_MAPPING.XE_CHUYEN_DUNG.indexOf(vehicleSubCategory) >= 0) {
    return VRORGFunctions.VR_VEHICLE_TYPE.XE_CHUYEN_DUNG;
  }

  if (VEHICLE_SUB_CATEGORY_MAPPING.XE_CO_DONG_CO.indexOf(vehicleSubCategory) >= 0) {
    return VRORGFunctions.VR_VEHICLE_TYPE.XE_CO_DONG_CO;
  }
}

async function registerVehicleForUser(appUserId, vehicleIdentity, vehicleType) {
  let _newData = {
    appUserId: appUserId,
    vehicleIdentity: vehicleIdentity,
  };

  if (vehicleType) {
    _newData.vehicleType = vehicleType;
  }
  return await AppUserVehicleResourceAccess.insert(_newData);
}

async function checkIfVehicleRegistered(vehicleIdentity, appUserId) {
  let _filter = {
    vehicleIdentity: vehicleIdentity,
    appUserId: appUserId,
  };

  let _existingRegistered = await AppUserVehicleResourceAccess.find(_filter, 0, 1);

  if (_existingRegistered && _existingRegistered.length > 0) {
    const ALREADY_REGISTERED_BEFORE = false;
    return ALREADY_REGISTERED_BEFORE;
  } else {
    const VALID_FOR_NEW_REGISTER = true;
    return VALID_FOR_NEW_REGISTER;
  }
}

async function addNewUserVehicle(userVehicleData, skipCheckingDuplicateVehicle) {
  // gioi han cho tai khoan khach hang binh thuong chi duoc dang ky toi da 5 phuong tien
  const appUser = await AppUsersResourceAccess.findById(userVehicleData.appUserId);
  const MAX_USER_VEHICLE = 5;
  const userVehicleList = await AppUserVehicleResourceAccess.find({ appUserId: userVehicleData.appUserId }, 0, MAX_USER_VEHICLE);
  if (appUser && appUser.appUserCategory !== APP_USER_CATEGORY.COMPANY_ACCOUNT) {
    if (userVehicleList && userVehicleList.length >= MAX_USER_VEHICLE) {
      throw USER_VEHICLE_ERROR.MAX_OWNER_VEHICLE;
    }
  }

  if (userVehicleList && userVehicleList.length > 0) {
    for (let i = 0; i < userVehicleList.length; i++) {
      const _vehicle = userVehicleList[i];
      if (_vehicle.vehicleIdentity === userVehicleData.vehicleIdentity) {
        const DO_NOT_ADD_WITHOUT_RESONSE_ERROR = 1;
        return DO_NOT_ADD_WITHOUT_RESONSE_ERROR;
      }
    }
  }

  const isValidForNewRegister = await checkIfVehicleRegistered(userVehicleData.vehicleIdentity, userVehicleData.appUserId);
  if (!isValidForNewRegister && !skipCheckingDuplicateVehicle) {
    throw USER_VEHICLE_ERROR.DUPLICATE_VEHICLE;
  }

  if (userVehicleData.vehicleSubType) {
    userVehicleData.vehicleType = getVehicleTypeFromVehicleSubType(userVehicleData.vehicleSubType);
  }

  if (userVehicleData.vehicleSubCategory) {
    let _submittingVehicleCategory = getVehicleCategoryFromVehicleSubCategory(userVehicleData.vehicleSubCategory);
    if (userVehicleData.vehicleCategory && userVehicleData.vehicleCategory !== _submittingVehicleCategory) {
      throw USER_VEHICLE_ERROR.WRONG_SUB_CATEGORY;
    }
    let _seatLimit = getSeatCountBySubCategory(userVehicleData.vehicleSubCategory);
    if (isValidValue(_seatLimit)) {
      userVehicleData.vehicleSeatsLimit = _seatLimit;
    }

    let _totalWeight = getVehicleTotalWeightBySubCategory(userVehicleData.vehicleSubCategory);
    if (isValidValue(_totalWeight)) {
      if (userVehicleData.vehicleTotalWeight) {
        if (userVehicleData.vehicleTotalWeight < _totalWeight.min) {
          userVehicleData.vehicleTotalWeight = _totalWeight.min;
        }
        if (userVehicleData.vehicleTotalWeight > _totalWeight.max) {
          userVehicleData.vehicleTotalWeight = _totalWeight.max;
        }
      } else {
        userVehicleData.vehicleTotalWeight = _totalWeight.max;
      }
    }
  }

  const insertResult = await AppUserVehicleResourceAccess.insert(userVehicleData);
  return insertResult;
}

async function saveStampChangeHistory(appUserVehicleId, certificateSeries, vehicleExpiryDate, vehicleIdentity) {
  try {
    //Kiểm tra seri đã tồn tại trong AppUserVehicleStamp
    const stampExisted = await AppUserVehicleStampAccess.find({
      certificateSeries,
    });

    if (certificateSeries && stampExisted && stampExisted.length > 0) {
      await reportToTelegram(`BSX ${vehicleIdentity} bị trùng số seri ${certificateSeries}`);
    } else {
      if (certificateSeries && certificateSeries !== NEW_VEHICLE_CERTIFICATE)
        // Lưu thông tin thay đổi vào cơ sở dữ liệu
        await AppUserVehicleStampAccess.insert({
          appUserVehicleId: appUserVehicleId,
          certificateSeries: certificateSeries,
          vehicleExpiryDate: vehicleExpiryDate,
        });
    }
  } catch (error) {
    Logger.error(error);
    reportToTelegram(error);
  }
}

async function deleteUserVehicleOfAppUser(appUserId) {
  const MAX_COUNT = 500;
  const vehicleList = await AppUserVehicleResourceAccess.find({ appUserId: appUserId }, 0, MAX_COUNT);

  if (vehicleList && vehicleList.length > 0) {
    const promiseList = vehicleList.map(vehicle => AppUserVehicleResourceAccess.deleteById(vehicle.appUserVehicleId));
    await Promise.all(promiseList);
  }
}

function checkValidVehicleIdentity(vehicleIdentity, vehicleType, plateColor) {
  let isValidVehicle = true;

  // Kiểm tra biển số xe có chứa ký tự đặt biệt không
  const validPlateNumber = checkingValidPlateNumber(vehicleIdentity);
  if (!validPlateNumber) {
    return (isValidVehicle = false);
  }

  // checking contain valid serial character
  const specialSerialChar = 'KT,LD,DA,MK,MD,MĐ,TD,TĐ,HC,NG,QT,NN,CV,CD,LB,RM'.split(',');
  const normalSerialChar = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', 'R'];

  const includedNormalSerialChars = normalSerialChar.filter(char => vehicleIdentity.includes(char));
  const includedSpecialSerialChars = specialSerialChar.filter(char => vehicleIdentity.includes(char));
  let serialIndex = -1;

  if (includedSpecialSerialChars.length > 0) {
    if (includedSpecialSerialChars.length !== 1) {
      isValidVehicle = false;
    } else {
      const includedChar = includedSpecialSerialChars[0];
      serialIndex = vehicleIdentity.indexOf(includedChar);
      // check is also contain normal serial characters
      const serialMaxIndex = serialIndex + includedChar.length - 1;
      const isContainRedundantNormalChar = includedNormalSerialChars.some(char => {
        const index = vehicleIdentity.indexOf(char);
        return index < serialIndex || index > serialMaxIndex;
      });

      if (isContainRedundantNormalChar) {
        isValidVehicle = false;
      }
    }
  } else if (includedNormalSerialChars.length !== 1) {
    isValidVehicle = false;
  } else {
    serialIndex = vehicleIdentity.indexOf(includedNormalSerialChars[0]);
  }

  // // checking location number
  // if (serialIndex >= 0) {
  //   const locationNumber = vehicleIdentity.slice(0, serialIndex);
  //   if (Number(locationNumber) < 11 || Number(locationNumber) > 99 || locationNumber.length > 2) {
  //     isValidVehicle = false;
  //   }
  // }

  // // checking plate color match serial character
  // if (plateColor === VEHICLE_PLATE_TYPE.YELLOW && !includedNormalSerialChars) {
  //   return false;
  // }
  // if (plateColor === VEHICLE_PLATE_TYPE.WHITE && !includedNormalSerialChars) {
  //   return false;
  // }

  // checking plate number length
  const MAX_LENGTH = 12;
  const MIN_LENGTH = 6;

  if (vehicleIdentity.length < MIN_LENGTH || vehicleIdentity.length > MAX_LENGTH) {
    isValidVehicle = false;
  }

  return isValidVehicle;
}

//so sanh du lieu cua cuc tra ve voi lai du lieu user nhap len
function compareUserVehicleWithVRData(userVehicle, vrData) {
  if (userVehicle.vehicleType === VEHICLE_TYPE.CAR && vrData.vehicleType !== VRORGFunctions.VR_VEHICLE_TYPE.XE_CHO_NGUOI) {
    if (userVehicle.vehicleSubType !== VEHICLE_SUB_TYPE.XE_KHACH) {
      return USER_VEHICLE_ERROR.WRONG_VEHICLE_TYPE;
    }
  }

  if (userVehicle.vehicleType === VEHICLE_TYPE.RO_MOOC && vrData.vehicleType !== VRORGFunctions.VR_VEHICLE_TYPE.RO_MOOC) {
    return USER_VEHICLE_ERROR.WRONG_VEHICLE_TYPE;
  }

  if (userVehicle.vehicleType !== VEHICLE_TYPE.RO_MOOC && vrData.vehicleType === VRORGFunctions.VR_VEHICLE_TYPE.RO_MOOC) {
    return USER_VEHICLE_ERROR.WRONG_VEHICLE_TYPE;
  }

  //khớp dữ liệu hoàn toàn
  return undefined;
}

async function syncVehicleInfo(vehicle) {
  const updateData = {};

  const regex = /^[A-Z]{2}-\d{7}$/;

  if (regex.test(vehicle.certificateSeries)) {
    if (vehicle.vehicleVerifiedInfo !== VERIFICATION_STATUS.VERIFIED) {
      try {
        let _vehiclePlateColorChar = undefined;
        if (vehicle.vehiclePlateColor === VEHICLE_PLATE_TYPE.BLUE) {
          _vehiclePlateColorChar = 'X';
        }
        console.info(`fetchVehicleDataFromVrAPI syncVehicleInfo ${vehicle.vehicleIdentity}`);
        const _vehicleDataFromVr = await fetchVehicleDataFromVrAPI(vehicle.vehicleIdentity, vehicle.certificateSeries, vehicle.vehiclePlateColor);
        if (_vehicleDataFromVr && _vehicleDataFromVr.certificateExpiration) {
          updateData.vehicleExpiryDate = _vehicleDataFromVr.certificateExpiration;
          updateData.vehicleForBusiness = _vehicleDataFromVr.coKinhDoanhVanTai;
          updateData.vehicleSmall = _vehicleDataFromVr.xeNho;
          updateData.vehicleExtendLicense = _vehicleDataFromVr.extendLicense;
          updateData.vehicleCategory = _vehicleDataFromVr.vehicleType;
          updateData.vehicleCriminal = _vehicleDataFromVr.criminal;

          // neu sai thong tin loai xe thi cap nhat verifiedStatus
          let compareResult = compareUserVehicleWithVRData(data, _vehicleDataFromVr);
          const NO_ERROR = undefined;
          if (compareResult !== NO_ERROR) {
            updateData.vehicleVerifiedInfo = VERIFICATION_STATUS.VERIFIED_BUT_WRONG_VEHICLE_TYPE;
          } else {
            updateData.vehicleVerifiedInfo = VERIFICATION_STATUS.VERIFIED;
          }
        } else {
          updateData.vehicleVerifiedInfo = VERIFICATION_STATUS.NOT_VALID_SERIAL;
        }
      } catch (error) {
        Logger.error(error);
        updateData.vehicleVerifiedInfo = VERIFICATION_STATUS.VERIFIED_BUT_ERROR;
      }
    }
  } else if (vehicle.certificateSeries !== NEW_VEHICLE_CERTIFICATE) {
    updateData.vehicleVerifiedInfo = VERIFICATION_STATUS.NOT_VALID_SERIAL;
  }

  if (Object.keys(updateData).length > 0) {
    await AppUserVehicleResourceAccess.updateById(vehicle.appUserVehicleId, updateData);
  }

  return updateData;
}
async function checkCriminal(customerData) {
  let checkCriminal = CRIMINAL.NO;
  if (customerData.certificateSeries) {
    if (customerData.certificateSeries !== NEW_VEHICLE_CERTIFICATE) {
      let _vehiclePlateColorChar = undefined;
      if (customerData.licensePlateColor === LICENSE_PLATE_COLOR.BLUE) {
        _vehiclePlateColorChar = 'X';
      }
      const _vehicleDataFromVr = await fetchVehicleDataFromVrAPI(
        customerData.licensePlates,
        customerData.certificateSeries,
        customerData.licensePlateColor,
      );

      if (_vehicleDataFromVr && _vehicleDataFromVr.criminal === CRIMINAL.YES) {
        checkCriminal = CRIMINAL.YES;
      }
    }
  }
  return checkCriminal;
}
module.exports = {
  registerVehicleForUser,
  checkIfVehicleRegistered,
  getVehicleTypeFromVehicleSubType,
  getVehicleCategoryFromVehicleSubCategory,
  getSeatCountBySubCategory,
  getVehicleTotalWeightBySubCategory,
  addNewUserVehicle,
  deleteUserVehicleOfAppUser,
  checkValidVehicleIdentity,
  compareUserVehicleWithVRData,
  syncVehicleInfo,
  saveStampChangeHistory,
  checkCriminal,
};
