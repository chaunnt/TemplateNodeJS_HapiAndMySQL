/* Copyright (c) 2021-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Handlebars = require('handlebars');

const CustomerMessageResourceAccess = require('./resourceAccess/CustomerMessageResourceAccess');
const GroupCustomerMessageResourceAccess = require('./resourceAccess/GroupCustomerMessageResourceAccess');
// const MessageCustomerResourceAccess = require('./resourceAccess/MessageCustomerResourceAccess');

const ApiUtilsFunctions = require('../ApiUtils/utilFunctions');
const { MESSAGE_STATUS, MESSAGE_TYPE, MESSAGE_TOPIC, MESSAGE_CATEGORY, MESSAGE_RECEIVER } = require('./CustomerMessageConstant');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');

const Logger = require('../../utils/logging');

const FUNC_SUCCESS = 1;
const FUNC_FAILED = undefined;

const messageTemplate = [
  {
    messageTemplateId: 1,
    messageTemplateContent: 'Mời bạn đăng ký đăng kiểm tại {{stationsAddress}} cho ô tô BKS số {{customerRecordPlatenumber}}',
    messageTemplateName: 'CSKH',
    // messageTemplateScope: [CustomerRecord.modelName]
  },
  {
    messageTemplateId: 2,
    messageTemplateName: 'Nhắc đăng kiểm',
    messageTemplateContent:
      'Ô tô BKS số {{customerRecordPlatenumber}} hết hạn đăng kiểm vào {{customerRecordCheckExpiredDate}}. Mời bạn đăng ký đăng kiểm tại {{stationsAddress}}',
    // messageTemplateScope: [CustomerRecord.modelName]
  },
];

function _importDataForMessage(customer) {
  return {
    customerMessageEmail: customer.customerRecordEmail,
    customerMessagePhone: customer.customerRecordPhone,
    customerMessagePlateNumber: customer.customerRecordPlatenumber,
    customerId: customer.customerRecordId,
  };
}

async function checkValidTemplateMessage(messageTemplateId) {
  //check if using template and template is valid
  let templateData = undefined;
  if (messageTemplateId) {
    for (let i = 0; i < messageTemplate.length; i++) {
      const template = messageTemplate[i];
      if (messageTemplateId * 1 === template.messageTemplateId * 1) {
        templateData = template;
        break;
      }
    }

    if (templateData === undefined) {
      Logger.error(`there is no template with id ${messageTemplateId}`);
      return FUNC_FAILED;
    }
  }
  return templateData;
}

async function getMessageContentByTemplate(messageTemplateId, station, customer) {
  //check if station / customer data is valid
  if (station === undefined || customer === undefined) {
    return FUNC_FAILED;
  }

  //check if using template and template is valid
  let templateData = await checkValidTemplateMessage(messageTemplateId);
  if (templateData === undefined) {
    Logger.error(`there is no template with id ${messageTemplateId}`);
    return FUNC_FAILED;
  }

  //generate content by template & customer data
  let templateParams = {
    ...customer,
    ...station,
  };

  const CustomerSchedule = require('../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');

  //if this message is "REMIND SCHEDULE" message
  //else default is "CUSTOMER SERVICE" message
  if (templateData.messageTemplateScope.indexOf(CustomerSchedule.modelName) > -1) {
    let scheduleData = CustomerSchedule.find({
      licensePlates: customer.customerRecordPlatenumber,
    });
    if (scheduleData && scheduleData.length > 0) {
      scheduleData = scheduleData[0];
      templateParams = {
        ...templateParams,
        ...scheduleData,
      };
    }
  }

  let customerMessageContent = Handlebars.compile(templateData.messageTemplateContent)(templateParams);
  return customerMessageContent;
}

async function _createNewMessage(stationsId, customerMessageContent, customerMessageCategories, templateCustomerMessageId) {
  let _enableUsingTemplate = false;

  let templateContent = await checkValidTemplateMessage(templateCustomerMessageId);
  if (templateContent) {
    _enableUsingTemplate = true;
  }

  const StationsResource = require('../Stations/resourceAccess/StationsResourceAccess');

  //get station info
  let station = await StationsResource.findById(stationsId);
  if (station === undefined) {
    return FUNC_FAILED;
  }

  //create data for message
  let dataMessage = {
    customerMessageCategories: customerMessageCategories,
    customerMessageContent: customerMessageContent,
    customerStationId: stationsId,
    customerMessageTitle: `Thông báo hệ thống từ ${station.stationsName}`,
  };

  if (_enableUsingTemplate) {
    dataMessage.customerMessageContent = templateContent.messageTemplateContent;
    dataMessage.templateCustomerMessageId = templateCustomerMessageId;
  }

  let messageId = await CustomerMessageResourceAccess.insert(dataMessage);
  if (messageId) {
    messageId = messageId[0];
    return messageId;
  } else {
    return undefined;
  }
}

//Send message to many customer
async function sendMessageToManyCustomer(customerList, stationsId, customerMessageContent, customerMessageCategories, templateCustomerMessageId) {
  if (customerList.length <= 0) {
    return FUNC_SUCCESS;
  }

  //create new MessageCustomer object
  let messageId = await _createNewMessage(stationsId, customerMessageContent, customerMessageCategories, templateCustomerMessageId);
  if (messageId === undefined) {
    Logger.error(`can not create new message`);
    return FUNC_FAILED;
  }

  let messageList = [];
  let listTopicUser = [];
  let listUserToken = [];

  //get Message content and split into 1 message for each customer
  for (var i = 0; i < customerList.length; i++) {
    const customer = customerList[i];
    let customerMessage = {
      ..._importDataForMessage(customer),
      messageId: messageId,
      customerStationId: stationsId,
    };
    // let customerMessage = {
    //   customerId: customerList[i].appUserId,
    //   messageId: customerMessageId,
    //   messageNote: messageNote,
    //   messageTimeReceive: new Date().toISOString(),
    //   messageCustomerData: data ? JSON.stringify(data) : null,
    //   isRead: 0,
    //   messageType: messageType
    // }
    // messageList.push(customerMessage);
    // listTopicUser.push(`USER_${customerList[i].appUserId}`);
    // if(customerList[i].firebaseToken) {
    //   listUserToken.push(customerList[i].firebaseToken);
    // }
  }

  //Chunk messageList array into multiple batches of 100 to prevent DB Crash
  if (messageList.length > 100) {
    let batches = await ApiUtilsFunctions.chunkArray(messageList, 100);
    for (var i = 0; i < batches.length; i++) {
      await MessageCustomerResourceAccess.insert(batches[i]);
    }
  } else {
    await MessageCustomerResourceAccess.insert(messageList);
  }

  let sendMessageResult;
  const { pushNotificationByTopic, pushNotificationByTokens } = require('../../ThirdParty/FirebaseNotification/FirebaseNotificationFunctions');

  if (customerMessageCategories === MESSAGE_TYPE.GENERAL) {
    sendMessageResult = await pushNotificationByTopic(customerMessageCategories, customerMessageTitle, customerMessageContent, data, messageType);
  } else {
    for (let i = 0; i < listTopicUser.length; i++) {
      await pushNotificationByTopic(listTopicUser[i], customerMessageTitle, customerMessageContent, data, messageType);
    }
  }
  await pushNotificationByTokens(listUserToken, customerMessageTitle, customerMessageContent, data, messageType);
  if (sendMessageResult) {
    await CustomerMessageResourceAccess.updateById(customerMessageId, {
      customerMessageSendStatus: MESSAGE_STATUS.COMPLETED,
      customerMessageTimeSent: new Date().toISOString(),
      isHidden: hiddenAfterSend ? 1 : 0,
    });
    return FUNC_SUCCESS;
  } else {
    await CustomerMessageResourceAccess.updateById(customerMessageId, {
      customerMessageSendStatus: MESSAGE_STATUS.FAILED,
      customerMessageTimeSent: new Date().toISOString(),
      isHidden: hiddenAfterSend ? 1 : 0,
    });
    return FUNC_FAILED;
  }
}

async function getTemplateMessages() {
  return messageTemplate;
}

async function handleSendMessage(appUserId, POST, data, messageType) {
  return new Promise(async resolve => {
    try {
      let listUserId = [];
      if (!appUserId) {
        return;
      }
      if (typeof appUserId === 'number') {
        listUserId = [appUserId];
      }
      if (typeof appUserId === 'object') {
        listUserId = appUserId;
      }
      let insertMessage = await CustomerMessageResourceAccess.insert(POST);
      let customerList = [];
      if (insertMessage) {
        //retrieve info for customer list
        for (var i = 0; i < listUserId.length; i++) {
          let customer = await AppUsersResourceAccess.findById(listUserId[i]);
          if (customer) {
            customerList.push(customer);
          }
        }
        const HIDDEN_AFTER_SEND = 1;
        sendMessageToManyCustomer(customerList, 'Hệ thống tự động', insertMessage[0], messageType, data, HIDDEN_AFTER_SEND);
      }
      resolve();
    } catch (e) {
      Logger.error('error', e);
      resolve();
    }
  });
}

async function handleSendMessageUser(messageData, data, receiverId, moreData) {
  let msg = messageData;
  if (data) {
    const template = Handlebars.compile(JSON.stringify(messageData));
    msg = JSON.parse(template(data));
  }
  await handleSendMessage(receiverId, msg, moreData, MESSAGE_TYPE.USER);
}

async function _handleFirebasePushMessage(messageData, messageType, additionData) {
  let messageDataList = [];

  let userMessageData = {
    ...messageData,
    receiverType: MESSAGE_RECEIVER.USER,
  };

  //luon luon co 1 thong bao vi danh sach thong bao dang chay theo firebase push (cho du ko push)
  userMessageData.customerMessageCategories = MESSAGE_CATEGORY.FIREBASE_PUSH;

  //neu co agency thi gui them message cho agency
  if (additionData.agencyId) {
    let agencyMessageData = {
      ...userMessageData,
      receiverType: MESSAGE_RECEIVER.AGENCY,
      customerId: additionData.agencyId,
    };
    messageDataList.push(agencyMessageData);
  }

  messageDataList.push(userMessageData);

  //store message into database
  let storeFirebasePushResult = await CustomerMessageResourceAccess.insert(messageDataList);
  if (!storeFirebasePushResult) {
    Logger.error(`can not storeFirebasePushResult _handleFirebasePushMessage`);
    return FUNC_FAILED;
  }

  let GOOGLE_FIREBASE_PUSH_ENABLE = process.env.GOOGLE_FIREBASE_PUSH_ENABLE;
  if (GOOGLE_FIREBASE_PUSH_ENABLE) {
    //push cho user
    if (userMessageData.appUserId) {
      let pushUserNotificationResult = await pushNotificationByTopic(
        `${MESSAGE_TOPIC.USER}_${userMessageData.appUserId}`,
        userMessageData.customerMessageContent,
        userMessageData.customerMessageTitle,
        additionData,
        messageType,
      );
      if (pushUserNotificationResult === undefined) {
        Logger.error(`can not send pushNotificationResult for ${MESSAGE_TOPIC.USER}_${userMessageData.appUserId}`);
      }
    }

    if (additionData.agencyId) {
      //push notification cho agency
      let pushUserNotificationResult = await pushNotificationByTopic(
        `${MESSAGE_TOPIC.AGENCY}_${additionData.agencyId}`,
        userMessageData.customerMessageContent,
        userMessageData.customerMessageTitle,
        additionData,
        messageType,
      );
      if (pushUserNotificationResult === undefined) {
        Logger.error(`can not send pushNotificationResult ${MESSAGE_TOPIC.AGENCY}_${additionData.agencyId}`);
      }
    }
  }
  return FUNC_SUCCESS;
}

async function _handleSMSMessage(messageData, additionData) {
  let SMS_ENABLE = process.env.SMS_ENABLE;
  if (SMS_ENABLE) {
    messageData.customerMessageCategories = MESSAGE_CATEGORY.SMS;

    //store message into database
    let storeSMSResult = await CustomerMessageResourceAccess.insert(messageData);

    if (!storeSMSResult) {
      Logger.error(`can not storeSMSResult _handleSMSMessage`);
    } else {
      const SMSClientFunctions = require('../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');

      let smsResult = await SMSClientFunctions.sendSMS(messageData.customerMessageContent, messageData.customerMessagePhone);
      if (smsResult === undefined) {
        Logger.error(`can not send sms to ${messageData.customerMessagePhone}`);
      }
    }
  }
  return FUNC_SUCCESS;
}

//xu ly tao thong tin message theo tat ca cac phuong thuc gui message
async function _sendMessage(scheduleData, messageTitle, messageContent, messageType) {
  let userMessageData = {
    customerMessageCategories: MESSAGE_CATEGORY.EMAIL,
    receiverType: MESSAGE_RECEIVER.USER,
    customerMessageType: messageType,
    customerMessagePhone: scheduleData.customerPhone,
    customerMessageEmail: scheduleData.customerEmail,
    customerMessageIdentity: scheduleData.customerIdentity,
    customerMessageImage: '',
    customerMessageContent: messageContent,
    customerMessageTitle: messageTitle,
    customerStationId: scheduleData.stationsId,
    customerScheduleId: scheduleData.customerScheduleId,
    customerId: scheduleData.appUserId,
    staffId: scheduleData.staffId,
  };

  //xu ly tao thong bao trong DB va gui qua push notification
  await _handleFirebasePushMessage(userMessageData, messageType, scheduleData);

  //xu ly gui thong bao qua sms
  await _handleSMSMessage(userMessageData, userMessageData);

  return FUNC_SUCCESS;
}

async function sendNotificationUser(appUserId, notifiTitle, notifiContent, staffId, customerMessageImage) {
  let customerMessageData = {
    customerId: appUserId,
    isRead: 0,
    customerMessageCategories: MESSAGE_CATEGORY.FIREBASE_PUSH,
    customerMessageTopic: MESSAGE_TOPIC.USER,
    receiverType: MESSAGE_RECEIVER.USER,
    customerMessageContent: notifiContent,
    customerMessageTitle: notifiTitle,
  };
  if (staffId) {
    customerMessageData.staffId = staffId;
  }
  if (customerMessageImage) {
    customerMessageData.customerMessageImage = customerMessageImage;
  }
  return await CustomerMessageResourceAccess.insert(customerMessageData);
}

async function sendNotificationAllUser(notifiTitle, notifiContent, staffId, groupCustomerMessageImage) {
  let groupCustomerMessageData = {
    groupCustomerMessageCategories: MESSAGE_CATEGORY.FIREBASE_PUSH,
    groupCustomerMessageType: MESSAGE_TYPE.GENERAL,
    groupCustomerMessageContent: notifiContent,
    groupCustomerMessageTitle: notifiTitle,
  };
  if (staffId) {
    groupCustomerMessageData.staffId = staffId;
  }
  if (groupCustomerMessageImage) {
    groupCustomerMessageData.groupCustomerMessageImage = groupCustomerMessageImage;
  }
  return await GroupCustomerMessageResourceAccess.insert(groupCustomerMessageData);
}

async function createMessageToUserById(appUserId, title, content) {
  let _messageData = {};
  if (appUserId) {
    _messageData.customerMessageTitle = title;
    _messageData.customerMessageContent = content;
    _messageData.customerId = appUserId;
  }

  return await CustomerMessageResourceAccess.insert(_messageData);
}

async function userReadGroupMessage(appUserId, groupCustomerMessageId) {
  const UserGroupCustomerMessageResourceAccess = require('./resourceAccess/UserGroupCustomerMessageResourceAccess');
  await UserGroupCustomerMessageResourceAccess.insert({
    appUserId: appUserId,
    groupCustomerMessageId: groupCustomerMessageId,
  });
}

async function getUserReadStatusForGroupMessage(appUserId, groupCustomerMessageId) {
  const UserGroupCustomerMessageResourceAccess = require('./resourceAccess/UserGroupCustomerMessageResourceAccess');
  let _result = await UserGroupCustomerMessageResourceAccess.find({
    appUserId: appUserId,
    groupCustomerMessageId: groupCustomerMessageId,
  });

  if (_result && _result.length > 0) {
    const ALREADY_READ = 1;
    return ALREADY_READ;
  }
  return 0;
}
module.exports = {
  getTemplateMessages,
  getUserReadStatusForGroupMessage,
  sendMessageToManyCustomer,
  getMessageContentByTemplate,
  handleSendMessage,
  handleSendMessageUser,
  sendNotificationUser,
  sendNotificationAllUser,
  userReadGroupMessage,
  createMessageToUserById,
};
