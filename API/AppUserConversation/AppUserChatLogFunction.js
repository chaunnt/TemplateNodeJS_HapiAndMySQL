/* Copyright (c) 2022-2023 Reminano */

'use strict';
const AppUserChatLogResourceAccess = require('./resourceAccess/AppUserChatLogResourceAccess');
const AppUserConversationResourceAccess = require('../AppUserConversation/resourceAccess/AppUserConversationResourceAccess');
const { CHAT_DIRECTION } = require('./AppUserChatLogConstant');
const Logger = require('../../utils/logging');
const GamePlayRoomResourceAccess = require('../GamePlayRoom/resourceAccess/GamePlayRoomResourceAccess');
const { publishJSONToClient } = require('../../ThirdParty/SocketIO/SocketIOClient');

async function sendMessageToConversation(messageContent, conversationId, senderToReceiver = CHAT_DIRECTION.USER_TO_ADMIN) {
  let _existingConversation = await AppUserConversationResourceAccess.findById(conversationId);
  if (!_existingConversation) {
    Logger.error(`can not find _existingConversation ${conversationId} to sendMessageToConversation`);
    return undefined;
  }

  let _newMessage = {
    appUserChatLogContent: messageContent,
    senderId: _existingConversation.senderId,
    receiverId: _existingConversation.receiverId,
    appUserConversationId: conversationId,
    senderToReceiver: senderToReceiver,
  };

  let sendResult = await AppUserChatLogResourceAccess.insert(_newMessage);
  if (sendResult) {
    let _readData = {};
    if (senderToReceiver === senderToReceiver.USER_TO_ADMIN) {
      _readData.senderReadMessage = 0;
      _readData.receiverReadMessage = 0;
    } else {
      _readData.receiverReadMessage = 0;
      _readData.senderReadMessage = 0;
    }
    await AppUserConversationResourceAccess.updateById(conversationId, _readData);
    return sendResult;
  } else {
    return undefined;
  }
}

async function userSendMessageToRoom(messageContent, sender, roomId) {
  const room = await GamePlayRoomResourceAccess.findById(roomId);
  if (!room) {
    Logger.error(`RoomId ${roomId} doesn't exist!`);
    return null;
  }
  let _newMessage = {
    appUserChatLogContent: messageContent,
    senderId: sender.appUserId,
    receiverId: roomId,
    senderToReceiver: CHAT_DIRECTION.USER_TO_ROOM,
  };
  let sendResult = await AppUserChatLogResourceAccess.insert(_newMessage);
  const topic = `USER_CHAT_IN_ROOM_${roomId}`;
  const message = {
    message: messageContent,
    firstName: sender.firstName,
    lastName: sender.lastName,
    avatar: sender.userAvatar,
  };
  publishJSONToClient(topic, message);
  if (sendResult) {
    return sendResult;
  } else {
    return null;
  }
}

module.exports = {
  sendMessageToConversation,
  userSendMessageToRoom,
};
