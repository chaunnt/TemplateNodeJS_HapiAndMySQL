/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const { reportToTelegram } = require('../TelegramBot/TelegramBotFunctions');
var soap = require('strong-soap').soap;

async function initClient(serviceUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const service = serviceUrl || 'http://xasd12/TT_XCG.asmx?wsdl';

    soap.createClient(service, options, function (err, client) {
      if (err) {
        reportToTelegram(`Kết nối service thất bại ${err}}`);
      }
      resolve(client);
    });
  });
}

module.exports = {
  initClient,
};
