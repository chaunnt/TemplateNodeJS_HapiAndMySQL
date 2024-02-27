/* Copyright (c) 2024 Reminano */

var crypto = require('crypto');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const SUNPAY_HOST = 'https://sunpay.com';
const MERCHANT_NO = 'sunsljo21129511';
const MERCHANT_KEY = 'lasijdo1293801';
var querystring = require('qs');
const { isNotEmptyStringValue } = require('../../API/ApiUtils/utilFunctions');

const SUNPAY_SUCCESS_RESULT = 'success';
//lưu lại bankCode để đỡ phải loop từ đầu
let _currentWorkingBankCode = 'MB';

async function __checkOutPaymentByBankCode(bankCode, paymentIdString, paymentAmount) {
  let reqBody = {
    merchantNo: MERCHANT_NO,
    outTradeNo: `${paymentIdString}`,
    type: 'bank_transfer',
    code: bankCode,
    amount: paymentAmount,
    timestamp: parseInt((new Date() - 1) / 1000),
    notifyUrl: `https://${process.env.HOST_NAME}/SunpayWebhook/receivePayment`,
  };
  // MD5(merchantNo+"|"+outTradeNo+"|"+type+"|"+code+"|"+amount+"|"+timestamp+"|"+key+"|" )
  let signature = `${reqBody.merchantNo}|${reqBody.outTradeNo}|${reqBody.type}|${reqBody.code}|${reqBody.amount}|${reqBody.timestamp}|${MERCHANT_KEY}|`;

  signature = crypto.createHash('md5').update(signature).digest('hex');
  reqBody.sign = signature;

  let formData = querystring.stringify(reqBody, { encode: true });
  // Object.keys(reqBody).forEach(key => formData += (key + '=' + reqBody[key] + "&"));

  const { body } = await chai
    .request(`${SUNPAY_HOST}`)
    .post(`/trade/create`)
    .set('Content-type', 'application/json')
    // .set('X-STRINGEE-AUTH', token)
    .send(reqBody);

  return body;
}

async function createCheckoutPaymentBank(paymentIdString, paymentAmount) {
  let _createCheckOutResult = undefined;
  //Tạo payment với bankcode hiện tại, không cần thiết phải loop toàn bộ bank
  let bankChanelArr = ['SAC', 'MB', 'BIDV', 'VTB', 'ACB', 'EXB', 'VP', 'TCB', 'VCB', 'DAB', 'VIB', 'MSB', 'SHB'];
  if (isNotEmptyStringValue(_currentWorkingBankCode) && bankChanelArr.includes(_currentWorkingBankCode)) {
    _createCheckOutResult = await __checkOutPaymentByBankCode(_currentWorkingBankCode, paymentIdString, paymentAmount);
    if (_createCheckOutResult && _createCheckOutResult.message === SUNPAY_SUCCESS_RESULT) {
      return _createCheckOutResult;
    }
  }

  //Trường hợp thất bại hoặc bảo trì thì sẽ loop để tìm bank nào thành công
  for (let i = 0; i < bankChanelArr.length; i++) {
    const _bankChannel = bankChanelArr[i];
    _createCheckOutResult = await __checkOutPaymentByBankCode(_bankChannel, paymentIdString, paymentAmount);

    if (_createCheckOutResult && _createCheckOutResult.message === SUNPAY_SUCCESS_RESULT) {
      return _createCheckOutResult;
    }
  }

  //Trường hợp tất cả mọi thứ đều thất bại thì bó tay
  return undefined;
}

async function createCheckoutPaymentUSDT(paymentIdString, paymentAmount) {
  let reqBody = {
    merchantNo: MERCHANT_NO,
    outTradeNo: `${paymentIdString}`,
    type: 'usdt_qr',
    payType: 1,
    linkType: 2,
    rateType: 1,
    amount: paymentAmount,
    timestamp: parseInt((new Date() - 1) / 1000),
    notifyUrl: `https://${process.env.HOST_NAME}/SunpayWebhook/receivePaymentUSDT`,
  };
  // MD5(merchantNo+"|"+outTradeNo+"|"+amount+"|"+type+"|"+payType+"|"+linkType+"|"+rateType+"|"+timestamp+"|"+key+"|" )
  let signature = `${reqBody.merchantNo}|${reqBody.outTradeNo}|${reqBody.amount}|${reqBody.type}|${reqBody.payType}|${reqBody.linkType}|${reqBody.rateType}|${reqBody.timestamp}|${MERCHANT_KEY}|`;

  signature = crypto.createHash('md5').update(signature).digest('hex');
  reqBody.sign = signature;

  let formData = querystring.stringify(reqBody, { encode: true });
  // Object.keys(reqBody).forEach(key => formData += (key + '=' + reqBody[key] + "&"));

  const { body } = await chai
    .request(`${SUNPAY_HOST}`)
    .post(`/trade/usdt/create`)
    .set('Content-type', 'application/json')
    // .set('X-STRINGEE-AUTH', token)
    .send(reqBody);

  return body;
}
async function createCheckoutPaymentElecWallet(paymentIdString, paymentAmount, category) {
  let reqBody = {
    merchantNo: MERCHANT_NO,
    outTradeNo: `${paymentIdString}`,
    type: category,
    code: category,
    username: '',
    password: '',
    amount: paymentAmount,
    timestamp: parseInt((new Date() - 1) / 1000),
    notifyUrl: `https://${process.env.HOST_NAME}/SunpayWebhook/receivePaymentElecWallet`,
  };
  // MD5(merchantNo+"|"+outTradeNo+"|"+type+"|"+code+"|"+amount++"|"+username+"|"+password+"|"+timestamp+"|"+key+"|" )
  let signature = `${reqBody.merchantNo}|${reqBody.outTradeNo}|${reqBody.type}|${reqBody.code}|${reqBody.amount}|${reqBody.username}|${reqBody.password}|${reqBody.timestamp}|${MERCHANT_KEY}|`;

  signature = crypto.createHash('md5').update(signature).digest('hex');
  reqBody.sign = signature;

  let formData = querystring.stringify(reqBody, { encode: true });
  // Object.keys(reqBody).forEach(key => formData += (key + '=' + reqBody[key] + "&"));

  const { body } = await chai
    .request(`${SUNPAY_HOST}`)
    .post(`/trade/data/create`)
    .set('Content-type', 'application/json')
    // .set('X-STRINGEE-AUTH', token)
    .send(reqBody);

  return body;
}
function getBankCode(bankName) {
  let _validBankList = {
    TCB: 'TECHCOMBANK (TCB)',
    DBS: 'DBS - CHI NHANH THANH PHO HO CHI MINH',
    IBK: 'NGAN HANG CONG NGHIEP HAN QUOC',
    IBKHCM: 'NGAN HANG CONG NGHIEP HAN QUOC CHI NHANH HCM (IBK HCM)',
    KOOKMI: 'NGAN HANG KOOKMIN - CN HA NOI',
    VRB: 'NGAN HANG LIEN DOANH VIET - NGA (VRB)',
    AGB: 'NGAN HANG NN VA PTNT VIETNAM (AGRIBANK)',
    NHBHN: 'NGAN HANG NONGHYUP CHI NHANH HA NOI (NHB HN)',
    ACB: 'NGAN HANG TMCP A CHAU (ACB)',
    ABB: 'NGAN HANG TMCP AN BINH (ABBANK)',
    NASB: 'NGAN HANG TMCP BAC A (NASB)',
    VCPB: 'NGAN HANG TMCP BAN VIET (VIETCAPITAL BANK)',
    BVB: 'NGAN HANG TMCP BAO VIET (BVB)',
    LPB: 'NGAN HANG TMCP BUU DIEN LIEN VIET (LPB)',
    VTB: 'NGAN HANG TMCP CONG THUONG VIET NAM (VIETINBANK)',
    PVCB: 'NGAN HANG TMCP DAI CHUNG VIET NAM (PVCOMBANK)',
    OJB: 'NGAN HANG TMCP DAI DUONG (OCEANBANK)',
    GPB: 'NGAN HANG TMCP DAU KHI TOAN CAU (GPB)',
    BIDV: 'NGAN HANG TMCP DAU TU VA PHAT TRIEN VIET NAM (BIDV)',
    DAB: 'NGAN HANG TMCP DONG A (DONGABANK)',
    SEAB: 'NGAN HANG TMCP DONG NAM A (SEABANK)',
    MSB: 'NGAN HANG TMCP HANG HAI VIET NAM (MSB)',
    KLB: 'NGAN HANG TMCP KIEN LONG (KIENLONGBANK)',
    NAMABA: 'NGAN HANG TMCP NAM A (NAMABANK)',
    VCB: 'NGAN HANG TMCP NGOAI THUONG VIET NAM (VIETCOMBANK)',
    HDB: 'NGAN HANG TMCP PHAT TRIEN TP.HCM (HDB)',
    OCB: 'NGAN HANG TMCP PHUONG DONG (OCB)',
    MHB: 'NGAN HANG TMCP PT NHA DONG BANG SONG CUU LONG',
    MB: 'NGAN HANG TMCP QUAN DOI (MB)',
    NCB: 'NGAN HANG TMCP QUOC DAN (NCB)',
    VIB: 'NGAN HANG TMCP QUOC TE VIB',
    SCB: 'NGAN HANG TMCP SAI GON (SCB)',
    SHB: 'NGAN HANG TMCP SAI GON - HA NOI (SHB)',
    SGN: 'NGAN HANG TMCP SAI GON CONG THUONG (SAIGONBANK)',
    SACB: 'NGAN HANG TMCP SAI GON THUONG TIN (SACOMBANK)',
    TPB: 'NGAN HANG TMCP TIEN PHONG (TPBANK)',
    VAB: 'NGAN HANG TMCP VIET A (VAB)',
    VPB: 'NGAN HANG TMCP VIET NAM THINH VUONG (VPBANK)',
    VB: 'NGAN HANG TMCP VIET NAM THUONG TIN (VIETBANK)',
    PGB: 'NGAN HANG TMCP XANG DAU PETROLIMEX (PG BANK)',
    EIB: 'NGAN HANG TMCP XUAT NHAP KHAU VIET NAM (EXIMBANK)',
    IVB: 'NGAN HANG TNHH INDOVINA',
    CIMB: 'NGAN HANG TNHH MTV CIMB (CIMB)',
    HLB: 'NGAN HANG TNHH MTV HONGLEONG VIET NAM',
    HSBC: 'NGAN HANG TNHH MTV HSBC (VIET NAM)',
    VID: 'NGAN HANG TNHH MTV PUBLIC VIET NAM (PBVN)',
    SHBVN: 'NGAN HANG TNHH MTV SHINHAN VIET NAM (SHBVN)',
    SCVN: 'NGAN HANG TNHH MTV STANDARD CHARTERED VIETNAM (SCVN)',
    UOB: 'NGAN HANG TNHH MTV UNITED OVERSEAS BANK (UOB)',
    WOO: 'NGAN HANG WOORIBANK',
    CBBANK: 'TM TNHH MTV Xay dung Viet Nam (CBBank)',
  };
  let _updatedBankCodeList = {
    SACB: 'STB',
    VAB: 'VGB',
    VTB: 'ICB',
    AGB: 'VBA',
    NAMABA: 'NAB',
  };
  let _IndexInBankListByName = Object.values(_validBankList).indexOf(bankName);
  if (_IndexInBankListByName >= 0) {
    return Object.keys(_validBankList)[_IndexInBankListByName];
  }
  let _IndexInBankListByCode = Object.keys(_validBankList).indexOf(bankName);
  if (_IndexInBankListByCode >= 0) {
    return Object.keys(_validBankList)[_IndexInBankListByCode];
  }
  let _IndexInUpdatedBankListByName = Object.values(_updatedBankCodeList).indexOf(bankName);
  if (_IndexInUpdatedBankListByName >= 0) {
    return Object.keys(_updatedBankCodeList)[_IndexInUpdatedBankListByName];
  }
  let _IndexInUpdatedBankListByCode = Object.keys(_updatedBankCodeList).indexOf(bankName);
  if (_IndexInUpdatedBankListByCode >= 0) {
    return Object.keys(_updatedBankCodeList)[_IndexInUpdatedBankListByCode];
  }
  const INVALID_BANK = undefined;
  return INVALID_BANK;
}
async function createPayoutRequest(paymentIdString, paymentAmount, bankCode, bankCardNumber, username) {
  let reqBody = {
    merchantNo: MERCHANT_NO,
    outTradeNo: `${paymentIdString}`,
    bankCode: bankCode,
    bankCardNumber: bankCardNumber,
    amount: paymentAmount,
    timestamp: parseInt((new Date() - 1) / 1000),
    notifyUrl: `https://${process.env.HOST_NAME}/SunpayWebhook/receivePayoutPayment`,
    username: username,
  };
  // MD5(merchantNo+"|"+outTradeNo+"|"+type+"|"+code+"|"+amount+"|"+timestamp+"|"+key+"|" )
  let signature = `${reqBody.merchantNo}|${reqBody.outTradeNo}|${reqBody.bankCode}|${reqBody.bankCardNumber}|${reqBody.amount}|${reqBody.timestamp}|${MERCHANT_KEY}|`;

  signature = crypto.createHash('md5').update(signature).digest('hex');
  reqBody.sign = signature;

  let formData = querystring.stringify(reqBody, { encode: true });
  // Object.keys(reqBody).forEach(key => formData += (key + '=' + reqBody[key] + "&"));

  const { body } = await chai
    .request(`${SUNPAY_HOST}`)
    .post(`/trade/payout/create`)
    .set('Content-type', 'application/json')
    // .set('X-STRINGEE-AUTH', token)
    .send(reqBody);

  return body;
}

module.exports = {
  createCheckoutPaymentBank,
  createPayoutRequest,
  getBankCode,
  createCheckoutPaymentUSDT,
  createCheckoutPaymentElecWallet,
};
