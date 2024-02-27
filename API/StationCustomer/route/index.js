/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const StationCustomer = require('./StationCustomerRoute');

module.exports = [{ method: 'POST', path: '/StationCustomer/advanceUser/getListCustomer', config: StationCustomer.advanceUserGetListCustomer }];
