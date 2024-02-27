/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const AppUsersResourceAccess = require('../resourceAccess/AppUsersResourceAccess');
async function updateFormatPhoneEmployee() {
  console.info(`start updateFormatPhoneEmployee`);
  let skip = 0;
  while (true) {
    let _userList = await AppUsersResourceAccess.customSearch(
      {
        appUserRoleId: [1, 2, 3, 4, 5, 6],
      },
      skip,
      100,
    );
    if (_userList && _userList.length > 0) {
      for (let i = 0; i < _userList.length; i++) {
        if (_userList[i].phoneNumber && !_userList[i].phoneNumber.includes('_')) {
          console.info(`updateFormatPhoneEmployee ${_userList[i].appUserId} - ${_userList[i].phoneNumber}`);
          const phonerFormated = _userList[i].phoneNumber + '_' + _userList[i].phoneNumber;

          let updateData = {
            phoneNumber: phonerFormated,
          };

          await AppUsersResourceAccess.updateById(_userList[i].appUserId, updateData);
        }
      }
      skip += 100;
    } else {
      break;
    }
  }
  console.info(`finish updateFormatPhoneEmployee`);
}
updateFormatPhoneEmployee();
