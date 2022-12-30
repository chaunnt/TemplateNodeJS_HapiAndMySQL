/* Copyright (c) 2020-2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */
'use strict';

//System & Utilites modules
const Maintain = require('../API/Maintain/route/MaintainRoute');
const Upload = require('../API/Upload/route/UploadRoute');

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

  //Maintain APIs
  { method: 'POST', path: '/Maintain/maintainAll', config: Maintain.maintainAll },
  { method: 'POST', path: '/Maintain/maintainSignup', config: Maintain.maintainSignup },
  { method: 'POST', path: '/Maintain/getSystemStatus', config: Maintain.getSystemStatus },

  /****************PAYMENT MODULES ****************/
];

APIs = APIs.concat(require('../API/AppUsers/route'));
APIs = APIs.concat(require('../API/AppUserConversation/route'));
APIs = APIs.concat(require('../API/AppUserMembership/route'));
APIs = APIs.concat(require('../API/GamePlayRecords/route'));
APIs = APIs.concat(require('../API/CustomerMessage/route'));
APIs = APIs.concat(require('../API/LeaderBoard/router'));
APIs = APIs.concat(require('../API/OTPMessage/router'));
APIs = APIs.concat(require('../API/Wallet/route'));
APIs = APIs.concat(require('../API/WalletRecord/route'));

APIs = APIs.concat(require('../API/PaymentBonusTransaction/route'));
APIs = APIs.concat(require('../API/PaymentDepositTransaction/route'));
APIs = APIs.concat(require('../API/PaymentMethod/route'));
APIs = APIs.concat(require('../API/PaymentWithdrawTransaction/route'));

APIs = APIs.concat(require('../API/Staff/route'));
APIs = APIs.concat(require('../API/StaffPermission/route'));
APIs = APIs.concat(require('../API/StaffRole/route'));
APIs = APIs.concat(require('../API/SystemConfigurations/route'));

module.exports = APIs;
