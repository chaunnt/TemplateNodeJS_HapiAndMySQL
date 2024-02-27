/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const moment = require('moment');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Logger = require('../../utils/logging');
const { reportToTelegram } = require('../TelegramBot/TelegramBotFunctions');

// const VNP_SMS_HOST_URL = 'http://113.185.0.35:8888/smsbn/api';
const VNP_SMS_HOST_URL = 'http://192.168.38.134:8888';

const AGENTID = 137;
const APIUSER = 'VNPT-BV';
const APIPASS = 'BV#A123';
const USERNAME = 'BV_CS';

const LABELID = 89071;
const CONTRACTID = 7688;

const VNP_SMS_RESPONSE = {
  '-1': {
    errorMessage: 'Request chứa 5 ký tự đặc biệt của XML, hoặc dữ liệu dài quá, hoặc lỗi nội bộ',
  },
  0: {
    success: true,
    errorMessage: null,
  },
  1: {
    errorMessage: 'Username, password, IP, status các API không hợp lệ',
  },
  2: {
    errorMessage: 'Thời gian đặt lịch sai định dạng ',
  },
  8: {
    errorMessage: 'Sai thời gian quy định gửi tin nhắn',
  },
  3: {
    errorMessage: 'ID method không hợp lệ',
  },
  7: {
    errorMessage: 'Template không hợp lệ hoặc không tồn tại với nhãn và đại lý',
  },
  9: {
    errorMessage: 'Contract_type_id không hợp lệ',
  },
  10: {
    errorMessage: 'User_name không hợp lệ (user đăng nhập của Agent trên portal không đúng)',
  },
  11: {
    errorMessage: 'Độ dài tin nhắn không hợp lệ ',
  },
  12: {
    errorMessage: 'Thời gian không hợp lệ với chính sách của Vinaphone',
  },
  13: {
    errorMessage: 'Hợp đồng không đúng',
  },
  14: {
    errorMessage: 'Label không đúng',
  },
  15: {
    errorMessage: 'Agent không hợp lệ',
  },
  16: {
    errorMessage: 'Quá tốc độ gửi tin nhắn cho phép',
  },
  17: {
    errorMessage: 'Định dạnh ký tự không hợp lệ',
  },
  20: {
    errorMessage: 'Hết gói tin của hợp đồng',
  },
  21: {
    errorMessage: 'Hết gói tin của khách hàng',
  },
  22: {
    errorMessage: 'Hết gói tin của đạit lý, Liên hệ VNP Admin để cấp gói mới',
  },
  23: {
    errorMessage: 'Gửi nhiều mạng trong một lệnh gửi tin nhắn hoặc số điện thoại không hợp lệ',
  },
  24: {
    errorMessage: 'Thời gian đặt lịch sớm hơn thời gian hiện tại của hệ thống',
  },
  25: {
    errorMessage: 'Sai mạng, mạng dung [telco chuyển], lable không hợp lệ',
  },
  25: {
    errorMessage: 'Sai mạng, mạng dung [telco chuyển], lable không hợp lệ',
  },
  26: {
    errorMessage: 'Thuê bao đã nhận 3 request gửi tin nhắn QC trong ngày',
  },
  30: {
    errorMessage: 'Trong tin nhắn gửi có chứa từ khóa vi phạm',
  },
  31: {
    errorMessage: 'Trạng thái của khách hàng không hợp lệ',
  },
  32: {
    errorMessage: 'Template id (cũ) không hợp lệ',
  },
  33: {
    errorMessage: 'Gửi trùng request id',
  },
};

async function sendSMSListByTemplate(phoneNumberList, params, templateId, requestId) {
  Logger.info(`send sms use Vinaphone API ${JSON.stringify(phoneNumberList)}`);

  const body = {
    RQST: {
      name: 'send_sms_list', // tên api
      REQID: requestId, // id của request
      LABELID: LABELID, // ID của nhãn
      CONTRACTTYPEID: '1', // Tin nhắn QC = 2, tin nhắn CSKH = 1
      CONTRACTID: CONTRACTID, // ID hợp đồng
      TEMPLATEID: templateId, // ID của mẫu tin nhắn
      PARAMS: params.map((param, index) => ({ NUM: `${index + 1}`, CONTENT: param })), // dữ liệu từng tham số theo template
      SCHEDULETIME: '', // trống để gửi ngay hiện tại
      MOBILELIST: phoneNumberList.join(','),
      ISTELCOSUB: '0',
      AGENTID: AGENTID,
      APIUSER: APIUSER,
      APIPASS: APIPASS,
      USERNAME: USERNAME,
      DATACODING: '0', // 0 là không dấu, 8 là có dấu nhưng chỉ áp dụng cho mạng vinaphone
      // SALEORDERID: "", // Mã đơn hàng.
      // PACKAGEID: "" // Mã gói tin dành cho k/h gửi tin của cục TMĐT
    },
  };

  if (process.env.SMS_ENABLE * 1 !== 1) {
    console.info('Vina sendSMSListByTemplate SMS_ENABLE disable');
    return undefined;
  }

  return new Promise((resolve, reject) => {
    chai
      .request(VNP_SMS_HOST_URL)
      .post('/smsmarketing/api')
      .set('Content-Type', 'application/json; charset=utf-8')
      .send(body)
      .end((err, res) => {
        if (err) {
          Logger.error(err);
          return resolve(false);
        }

        if (res && res.body) {
          const { ERROR, ERROR_DESC } = res.body.RPLY || {};
          if (ERROR == '0') {
            resolve(true);
          } else {
            reportToTelegram(`Gửi tin nhắn đến sdt ${JSON.stringify(phoneNumberList)} thất bại, ${ERROR_DESC}`);
            resolve(false);
          }
        } else {
          resolve(false);
        }
      });
  });
}

async function checkSMSStatusById(requestID, sendTime) {
  Logger.info('check sms status use Vinaphone API ');

  const body = {
    RQST: {
      name: 'get_sms_status_api',
      REQID: requestID, // id của request
      CONTRACTID: CONTRACTID, // ID hợp đồng
      AGENTID: AGENTID,
      APIUSER: APIUSER,
      APIPASS: APIPASS,
      SENDTIME: sendTime,
    },
  };

  return new Promise((resolve, reject) => {
    chai
      .request(VNP_SMS_HOST_URL)
      .post('/smsmarketing/api')
      .set('Content-Type', 'application/json; charset=utf-8')
      .send(JSON.stringify(body))
      .end((err, res) => {
        if (err) {
          Logger.error(err);
          return resolve(false);
        }

        if (res && res.body) {
          const { ERROR, ERROR_DESC } = res.body.RPLY || {};
          if (ERROR == '0') {
            resolve(true);
          } else {
            reportToTelegram(`Kiểm tra trạng thái tin nhắn ${requestID} thất bại, ${ERROR_DESC}`);
            resolve(false);
          }
        } else {
          resolve(false);
        }
      });
  });
}

async function createTemplate(content, totalParams, requestId) {
  Logger.info('Create SMS template use Vinaphone API');

  const body = {
    RQST: {
      name: 'create_template',
      REQID: requestId,
      AGENTID: AGENTID,
      LABELID: LABELID,
      CONTENT: content,
      TOTALPARAMS: totalParams,
      APIUSER: APIUSER,
      APIPASS: APIPASS,
      USERNAME: USERNAME,
    },
  };

  return new Promise((resolve, reject) => {
    chai
      .request(VNP_SMS_HOST_URL)
      .post('/smsmarketing/api')
      .set('Content-Type', 'application/json; charset=utf-8')
      .send(JSON.stringify(body))
      .end((err, res) => {
        if (err) {
          Logger.error(err);
          return resolve(undefined);
        }

        if (res && res.body) {
          const { ERROR, ERROR_DESC, TEMPLATEID } = res.body.RPLY || {};
          if (ERROR == '0') {
            resolve(TEMPLATEID);
          } else {
            reportToTelegram(`Tạo mẫu tin nhắn ${requestId} thất bại, ${ERROR_DESC}`);
            resolve(undefined);
          }
        } else {
          resolve(undefined);
        }
      });
  });
}

module.exports = {
  sendSMSListByTemplate,
  checkSMSStatusById,
  createTemplate,
  VNP_SMS_RESPONSE,
};
