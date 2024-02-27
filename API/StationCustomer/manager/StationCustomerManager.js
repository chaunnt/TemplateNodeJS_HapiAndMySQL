/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const StationCustomerView = require('../resourceAccess/StationCustomerView');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');

async function advanceUserGetListCustomer(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let searchText = req.payload.searchText;
      let skip = req.payload.skip || undefined;
      let limit = req.payload.limit || undefined;

      const stationsId = req.currentUser.stationsId;

      // Chỉ lấy khách hàng của trạm
      filter.stationsId = stationsId;

      const customers = await StationCustomerView.find(filter, skip, limit);

      if (customers && customers.length > 0) {
        const customersRecordCount = await StationCustomerView.customCount(filter, searchText);
        return resolve({ data: customers, total: customersRecordCount });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  advanceUserGetListCustomer,
};
