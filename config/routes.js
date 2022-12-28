/* Copyright (c) 2020-2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */
'use strict';
// User Modules
const AppUsers = require('../API/AppUsers/route');
const Wallet = require('../API/Wallet/route');
const WalletBalanceUnit = require('../API/WalletBalanceUnit/route');
const AppUserMembership = require('../API/AppUserMembership/route/index');

//Staff modules
const Staff = require('../API/Staff/route');
const Role = require('../API/Role/route/RoleRoute');
const Permission = require('../API/Permission/route/PermissionRoute');

//System & Utilites modules
const Maintain = require('../API/Maintain/route/MaintainRoute');
const Upload = require('../API/Upload/route/UploadRoute');
const SystemConfigurations = require('../API/SystemConfigurations/route');
const GeneralInformation = require('../API/GeneralInformation/route');

//Customer Schedules
const CustomerSchedule = require('../API/CustomerSchedule/route');

//Customer Message modules
const CustomerMessage = require('../API/CustomerMessage/route');

//Customer Measure modules
const CustomerMeasureRecord = require('../API/CustomerMeasureRecord/route');

//Stations Modules
const Stations = require('../API/Stations/route');
const StationProducts = require('../API/StationProducts/route');
const StationProductsCategory = require('../API/StationProductsCategory/route');
const StationServices = require('../API/StationServices/route');
const StationServicesCategory = require('../API/StationServicesCategory/route');

//Payment modules
const PaymentMethod = require('../API/PaymentMethod/route');
const PaymentServicePackage = require('../API/PaymentServicePackage/route');
const PaymentRecord = require('../API/PaymentRecord/route/PaymentRecordRoute');
const PaymentDepositTransaction = require('../API/PaymentDepositTransaction/route');
const PaymentWithdrawTransaction = require('../API/PaymentWithdrawTransaction/route');
const PaymentExchangeTransaction = require('../API/PaymentExchangeTransaction/route');

//Dashboard modules
const Statistical = require('../API/Statistical/route');

// Bet Records
const BetRecords = require('../API/BetRecords/route');

// Receive History
const ReceiveHistory = require('../API/WalletRecord/route');

// Staking
const StakingRoute = require('../API/StakingPackage/route');

//WalletBalanceUnit

const CustomerMessage = require('../API/CustomerMessage/route');
// LeaderBoard
const LeaderBoard = require('../API/LeaderBoard/router');
var APIs = [
  //Upload APIs
  { method: 'POST', path: '/Upload/uploadMediaFile', config: Upload.uploadMediaFile },
  {
    method: 'GET',
    path: '/downloadApp',
    handler: function (request, h) {
      return h.redirect('https://dl.trumios.com/temp/index.php?hash=Wm50Q2NvbS50b3JpdGkuem50Yw==');
    },
  },
  {
    method: 'GET',
    path: '/{path*}',
    handler: function (request, h) {
      return h.file(`${request.params.path}`);
    },
  },
  { method: 'POST', path: '/Upload/uploadUserAvatar', config: Upload.uploadUserAvatar },

  {
    method: 'GET', //This API use to load QRCode of user
    path: '/images/{filename}',
    handler: function (request, h) {
      return h.file(`images/${request.params.filename}`);
    },
  },
  //download Excel
  {
    method: 'GET',
    path: '/uploads/exportExcel/{filename}',
    handler: function (request, h) {
      return h.file(`uploads/exportExcel/${request.params.filename}`);
    },
  },
  //Role APIs
  { method: 'POST', path: '/Role/insert', config: Role.insert },
  { method: 'POST', path: '/Role/getList', config: Role.find },
  // { method: 'POST', path: '/Role/getDetailById', config: Role.findById }, //currently disable - no need
  { method: 'POST', path: '/Role/updateById', config: Role.updateById },

  //Permission APIs
  // { method: 'POST', path: '/Permission/insert', config: Permission.insert },//currently disable - no need
  { method: 'POST', path: '/Permission/getList', config: Permission.find },
  // { method: 'POST', path: '/Permission/getDetailById', config: Permission.findById },//currently disable - no need
  // { method: 'POST', path: '/Permission/updateById', config: Permission.updateById },//currently disable - no need

  /******************System & Utilites modules */

  //Maintain APIs
  { method: 'POST', path: '/Maintain/maintainAll', config: Maintain.maintainAll },
  { method: 'POST', path: '/Maintain/maintainSignup', config: Maintain.maintainSignup },
  { method: 'POST', path: '/Maintain/getSystemStatus', config: Maintain.getSystemStatus },

  /****************PAYMENT MODULES ****************/
];

APIs = APIs.concat(AppUsers);
// Product Order
const OTPMessage = require('../API/OTPMessage/router');
APIs = APIs.concat(OTPMessage);

APIs = APIs.concat(WalletBalanceUnit);
APIs = APIs.concat(Wallet);

APIs = APIs.concat(BetRecords);

APIs = APIs.concat(PaymentMethod);
APIs = APIs.concat(PaymentServicePackage);
APIs = APIs.concat(PaymentWithdrawTransaction);
APIs = APIs.concat(PaymentDepositTransaction);
APIs = APIs.concat(PaymentExchangeTransaction);

//Customer Schedule modules
APIs = APIs.concat(CustomerSchedule);

//Customer Message modules
APIs = APIs.concat(CustomerMessage);

APIs = APIs.concat(CustomerMeasureRecord);

//Stations modules
APIs = APIs.concat(Stations);
APIs = APIs.concat(StationProducts);
APIs = APIs.concat(StationProductsCategory);
APIs = APIs.concat(StationServices);
APIs = APIs.concat(StationServicesCategory);

APIs = APIs.concat(Statistical);

APIs = APIs.concat(SystemConfigurations);
APIs = APIs.concat(ReceiveHistory);

APIs = APIs.concat(AppUserMembership);

APIs = APIs.concat(StakingRoute);

APIs = APIs.concat(CustomerMessage);
APIs = APIs.concat(LeaderBoard);

// Product
const Product = require('../API/Product/router');
APIs = APIs.concat(Product);
// Product Order
const ProductOrder = require('../API/ProductOrder/router');
APIs = APIs.concat(ProductOrder);
// Product Order
const ProductOrderItem = require('../API/ProductOrderItem/router');
APIs = APIs.concat(ProductOrderItem);

APIs = APIs.concat(Staff);

const PaymentBonusTransaction = require('../API/PaymentBonusTransaction/route');
APIs = APIs.concat(PaymentBonusTransaction);

const AppUserConversation = require('../API/AppUserConversation/route');
APIs = APIs.concat(AppUserConversation);

module.exports = APIs;
