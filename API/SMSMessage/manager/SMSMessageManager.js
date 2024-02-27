/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const Logger = require('../../../utils/logging');
const SMSMessageFunctions = require('../SMSMessageFunctions');
const SMSMessageResourceAccess = require('../resourceAccess/SMSMessageResourceAccess');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const { isNotEmptyStringValue } = require('../../ApiUtils/utilFunctions');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { activeUserByPhoneNumber, resetPasswordByUsername } = require('../../AppUsers/AppUsersFunctions');
const CustomerScheduleFunctions = require('../../CustomerSchedule/CustomerScheduleFunctions');
const CustomerScheduleServices = require('../../CustomerSchedule/services/CustomerScheduleServices');
const MessageCustomerMarketingFunctions = require('../../MessageCustomerMarketing/MessageCustomerMarketingFunctions');
const UtilFunctions = require('../../ApiUtils/utilFunctions');
const { SCHEDULE_ERROR } = require('../../CustomerSchedule/CustomerScheduleConstants');

async function insert(req) {
  return await _createSMSMessage(req);
}

async function robotInsert(req) {
  return await _createSMSMessage(req);
}

async function _createSMSMessage(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _smsMessageReceiver = req.query.phoneNumber;
      let apiKey = req.query.apiKey;

      if (!(isNotEmptyStringValue(apiKey) && isNotEmptyStringValue(process.env.SYSTEM_API_KEY) && apiKey === process.env.SYSTEM_API_KEY)) {
        console.error('_createSMSMessage invalid SYSTEM_API_KEY or apiKey');
        return reject(UNKNOWN_ERROR);
      }

      if (req.payload.type !== 'received') {
        return reject(UNKNOWN_ERROR);
      }

      let _senderPhone = req.payload.number;
      if (isNotEmptyStringValue(_senderPhone)) {
        _senderPhone = _senderPhone.replace('+', '');
      }
      let _newSMSData = {
        smsMessageOrigin: _senderPhone,
        smsMessageContent: req.payload.message,
        smsMessageReceiver: _smsMessageReceiver,
      };

      // store informations from message
      let result = await SMSMessageFunctions.addNewSMSMessage(_newSMSData);

      if (SMSMessageFunctions.isOTPSMSMessage(_newSMSData.smsMessageContent)) {
        await activeUserByPhoneNumber(_newSMSData.smsMessageOrigin);
        if (_newSMSData.smsMessageOrigin.indexOf('84') === 0) {
          await activeUserByPhoneNumber(_newSMSData.smsMessageOrigin.replace('84', '0'));
        }
        result = _newSMSData.smsMessageOrigin;
      } else if (SMSMessageFunctions.isResetPasswordSMSMessage(_newSMSData.smsMessageContent)) {
        await resetPasswordByUsername(_newSMSData.smsMessageOrigin);
        if (_newSMSData.smsMessageOrigin.indexOf('84') === 0) {
          await resetPasswordByUsername(_newSMSData.smsMessageOrigin.replace('84', '0'));
        }
        result = _newSMSData.smsMessageOrigin;
      } else if (SMSMessageFunctions.isSMSBookingSchedule(_newSMSData.smsMessageContent) !== -1) {
        if (_newSMSData.smsMessageOrigin.indexOf('84') === 0) {
          _newSMSData.smsMessageOrigin = _newSMSData.smsMessageOrigin.replace('84', '0');
        }

        let templateBookingSchedule = SMSMessageFunctions.isSMSBookingSchedule(_newSMSData.smsMessageContent);

        await robotCreateScheduleFromSMS(_newSMSData.smsMessageOrigin, _newSMSData.smsMessageContent, templateBookingSchedule);
        result = _newSMSData.smsMessageOrigin;
      }

      if (result) {
        resolve(result);
      } else {
        reject(UNKNOWN_ERROR);
      }
    } catch (error) {
      Logger.error('insert sms message error', error);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function find(req) {
  return await _find(req);
}

async function _find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      let listSMSMessage = await SMSMessageResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (listSMSMessage) {
        let count = await SMSMessageResourceAccess.customCount(filter, startDate, endDate, searchText);
        resolve({ data: listSMSMessage, count: count[0].count });
      } else {
        resolve({ data: [], count: 0 });
      }
    } catch (error) {
      Logger.error('find sms message list error', error);
      reject('failed');
    }
  });
}

async function findById(req) {
  return await _findDetailById(req);
}

async function _findDetailById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      if (!data.id) {
        reject('INVALID_SMS_MESSAGE_ID');
        return;
      }
      let existSMSMessage = await SMSMessageResourceAccess.findById(data.id);
      if (existSMSMessage) {
        resolve(existSMSMessage);
      } else {
        resolve({});
      }
    } catch (error) {
      Logger.error('find sms message detail error', error);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = req.payload.data;
      let updateResult = await SMSMessageResourceAccess.updateById(id, data);
      if (updateResult) {
        resolve(updateResult);
      } else {
        reject('failed');
      }
    } catch (error) {
      Logger.error('update sms message detail error', error);
      reject('failed');
    }
  });
}

async function robotCreateScheduleFromSMS(phoneNumber, smsContent, templateSMS) {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        !UtilFunctions.isNotEmptyStringValue(phoneNumber) ||
        !UtilFunctions.isNotEmptyStringValue(smsContent) ||
        !UtilFunctions.isNotEmptyStringValue(templateSMS)
      ) {
        return reject(SCHEDULE_ERROR.INVALID_SCHEDULE_DATA);
      }

      // Lấy thông tin đặt lịch từ tin nhắn SMS
      const customerScheduleData = CustomerScheduleFunctions.parseSMSContent(smsContent, templateSMS);
      if (!customerScheduleData) {
        return reject(SCHEDULE_ERROR.INVALID_SCHEDULE_DATA);
      }

      // Lấy dữ liệu trạm người dùng muốn đặt lịch bằng stationCode
      let selectedStation = await StationsResourceAccess.find({ stationCode: customerScheduleData.stationCode }, 0, 1);
      if (!selectedStation || selectedStation.length <= 0) {
        return reject(SCHEDULE_ERROR.INVALID_STATION);
      }
      delete customerScheduleData.stationCode;

      if (selectedStation[0].enableReceiveScheduleViaSMS === 0) {
        console.error(SCHEDULE_ERROR.ERROR_RECEIVE_SCHEDULE_SMS_DISABLED);
        return reject(SCHEDULE_ERROR.ERROR_RECEIVE_SCHEDULE_SMS_DISABLED);
      }

      customerScheduleData.phone = phoneNumber;
      customerScheduleData.fullnameSchedule = `SMS_${phoneNumber}`;
      customerScheduleData.email = '';
      customerScheduleData.stationsId = selectedStation[0].stationsId;
      customerScheduleData.scheduleNote = smsContent; // Thêm ghi chú lịch hẹn
      customerScheduleData.vehicleType = 10; // Loại phương tiện khác (mặc định)
      customerScheduleData.scheduleType = 1; // Đặt lịch đăng kiểm xe cũ

      // lấy danh sách giờ hẹn hợp lệ của ngày
      const times = await CustomerScheduleFunctions.getListScheduleTime(
        selectedStation[0],
        customerScheduleData.dateSchedule,
        customerScheduleData.vehicleType,
      );

      // lấy giờ hẹn phù hợp cho lịch
      const bestTime = _findBestScheduleTime(times);
      if (!bestTime) {
        console.error(SCHEDULE_ERROR.INVALID_TIME);
        return reject(SCHEDULE_ERROR.INVALID_TIME);
      }
      customerScheduleData.time = bestTime.scheduleTime;

      let result = await CustomerScheduleServices.createNewSchedule(customerScheduleData, null);

      if (result) {
        resolve(result);

        // Gửi SMS phản hồi cho khách hàng
        let messageTitle = 'Thông báo đặt lịch thành công!';
        let messageContent = `TTDK.COM.VN ${selectedStation[0].stationCode}: Lịch hẹn đăng kiểm cho BSX ${customerScheduleData.licensePlates} được xác nhận. Thời gian hẹn ${customerScheduleData.time} ngày ${customerScheduleData.dateSchedule}, mã lịch hẹn ${customerScheduleData.scheduleCode}.`;
        await MessageCustomerMarketingFunctions.sendMSMToCustomerByPhone(
          phoneNumber, // Số điện thoại khách hàng
          customerScheduleData.licensePlates,
          selectedStation[0],
          messageTitle,
          messageContent,
        );
      }

      reject('failed');
    } catch (err) {
      Logger.error(__filename, err);
      reject(UNKNOWN_ERROR);
    }
  });
}

function _findBestScheduleTime(data) {
  let bestScheduleTime = null;
  for (const item of data) {
    if (item.scheduleTimeStatus === 1 && item.totalBookingSchedule <= item.totalSchedule) {
      if (bestScheduleTime === null || item.totalBookingSchedule < bestScheduleTime.totalBookingSchedule) {
        bestScheduleTime = item;
        // Dừng ngay sau khi tìm thấy phần tử thỏa mãn điều kiện
        if (item.totalBookingSchedule === 0) {
          break;
        }
      }
    }
  }
  return bestScheduleTime;
}

module.exports = {
  insert,
  robotInsert,
  findById,
  find,
  updateById,
};
