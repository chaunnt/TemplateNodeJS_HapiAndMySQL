require('dotenv').config();
const moment = require('moment');
const { sendZNSMessageFromSmartGift } = require('../../ThirdParty/SmartGift/ZNSSmartGiftFunction');
const { sendZNSMessageToUserByZaloAPI } = require('../../ThirdParty/ZaloAPI/ZNS/ZNSFunction');

async function sendMessageByZNSOfSystem(phoneNumber, templateId, data) {
  if (process.env.SMARTGIFT_API_ENABLED * 1 === 1) {
    let _sendZnsResult = await sendZNSMessageFromSmartGift(templateId, phoneNumber, data);
    if (_sendZnsResult && _sendZnsResult.message) {
      return _sendZnsResult.message;
    }
  }

  // if (process.env.VMGZNS_API_ENABLED * 1 === 1) {
  //   return await send;
  // }

  return await sendZNSMessageToUserByZaloAPI(phoneNumber, templateId, data, `${templateId}_${moment().format('YYYYMMDDHHmmss')}`);
}

module.exports = {
  sendMessageByZNSOfSystem,
};
