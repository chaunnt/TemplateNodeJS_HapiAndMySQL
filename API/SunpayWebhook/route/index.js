/* Copyright (c) 2022-2023 Reminano */

const PaymentMethod = require('./SunpayWebHookRoute');

module.exports = [
  //PaymentMethod APIs
  { method: 'POST', path: '/SunpayWebhook/receivePayment', config: PaymentMethod.webhookReceivePayment },
  { method: 'POST', path: '/SunpayWebhook/receivePayoutPayment', config: PaymentMethod.webhookReceivePayoutPayment },
  { method: 'POST', path: '/SunpayWebhook/receivePaymentUSDT', config: PaymentMethod.webhookReceivePaymentUSDT },
  { method: 'POST', path: '/SunpayWebhook/receivePaymentElecWallet', config: PaymentMethod.webhookReceivePaymentElecWallet },
];
