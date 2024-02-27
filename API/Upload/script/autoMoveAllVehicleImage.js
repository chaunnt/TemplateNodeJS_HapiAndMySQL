/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const { moveFileFromLocalToLinode } = require('../../../ThirdParty/LinodeStorage/LinodeStorageFunctions');
const { isNotEmptyStringValue, randomIntByMinMax } = require('../../ApiUtils/utilFunctions');
const AppUserVehicleResourceAccess = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');

async function moveFileFromObject(vehicleData) {
  let vehicleRegistrationImageUrl = vehicleData.vehicleRegistrationImageUrl;
  if (isNotEmptyStringValue(vehicleRegistrationImageUrl) && vehicleRegistrationImageUrl.indexOf('uploads/') >= 0) {
    let _fileName = vehicleRegistrationImageUrl.split('uploads/');
    if (_fileName.length > 1) {
      _fileName = process.cwd() + '/uploads/' + _fileName[1];
      let _newUrl = await moveFileFromLocalToLinode(_fileName);
      if (_newUrl) {
        await AppUserVehicleResourceAccess.updateById(vehicleData.appUserVehicleId, {
          vehicleRegistrationImageUrl: _newUrl,
        });
      }
    }
  }
}

async function moveFileFromList() {
  console.info(`start moveFileFromList ${new Date()}`);
  let counter = 0;
  if (process.env.LINODE_ENABLE * 1 !== 1) {
    return;
  }
  while (true) {
    let _itemList = await AppUserVehicleResourceAccess.find({}, counter, 1);
    if (_itemList && _itemList.length > 0) {
      await moveFileFromObject(_itemList[0]);
    } else {
      break;
    }
    counter++;
  }
  console.info(`end moveFileFromList ${new Date()}`);
}
async function autoMoveAllVehicleImage() {
  setTimeout(() => {
    moveFileFromList();
  }, randomIntByMinMax(5000, 20000));
}

module.exports = {
  autoMoveAllVehicleImage,
  moveFileFromObject,
};
