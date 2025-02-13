/* Copyright (c) 2022-2024 Reminano */

const Handlebars = require('handlebars');
const fs = require('fs');
const { OTP_TITLE } = require('../../API/OTPMessage/OTPMessageConstant');

function generateNewOTPEmail(fullName, newOTP, otpTitle) {
  let templateEmailNewOTP = {
    subject: `Account Registration`,
    body: '',
    htmlBody: '',
  };

  const subjectParams = {};
  const bodyParams = {
    paramFullName: fullName,
    paramNewOTP: newOTP,
    paramSupportEmail: 'info@demo.com',
    paramWebsite: `https://${process.env.WEB_HOST_NAME}`,
    paramCopyright: `${process.env.PROJECT_NAME}`,
    otpTitle: otpTitle,
  };
  templateEmailNewOTP.htmlBody = fs.readFileSync('./ThirdParty/Email/Template/emailNewOTP.html');
  templateEmailNewOTP.htmlBody = templateEmailNewOTP.htmlBody.toString();

  const subject = Handlebars.compile(templateEmailNewOTP.subject)(subjectParams);
  const htmlBody = Handlebars.compile(templateEmailNewOTP.htmlBody)(bodyParams);
  const body = '';

  return { subject, body, htmlBody };
}
function generateRegisterOTPEmail(fullName, newOTP) {
  let templateEmailNewOTP = {
    subject: `Account Registration`,
    body: '',
    htmlBody: '',
  };

  const subjectParams = {};
  const bodyParams = {
    paramFullName: fullName,
    paramNewOTP: newOTP,
    paramWebsite: `https://${process.env.WEB_HOST_NAME}`,
    paramCopyright: `${process.env.PROJECT_NAME}`,
  };

  templateEmailNewOTP.htmlBody = fs.readFileSync('./ThirdParty/Email/Template/emailRegisterOTP.html');
  templateEmailNewOTP.htmlBody = templateEmailNewOTP.htmlBody.toString();

  const subject = Handlebars.compile(templateEmailNewOTP.subject)(subjectParams);
  const htmlBody = Handlebars.compile(templateEmailNewOTP.htmlBody)(bodyParams);
  const body = '';

  return { subject, body, htmlBody };
}
function generateResetPasswordEmail(token) {
  let templateForgotPassword = {
    subject: `Reset Password`,
    body: '',
    htmlBody: '',
  };
  templateEmailNewOTP.htmlBody = fs.readFileSync('./ThirdParty/Email/Template/emailForgotPassword.html');
  templateEmailNewOTP.htmlBody = templateEmailNewOTP.htmlBody.toString();

  const subjectParams = {};
  const bodyParams = {
    paramResetPasswordUrl: `https://${process.env.WEB_HOST_NAME}/resetPassword?token=${token}`,
    paramSupportEmail: paramSupportEmail,
    paramWebsite: `https://${process.env.WEB_HOST_NAME}`,
    paramCopyright: `${process.env.PROJECT_NAME}`,
  };

  const subject = Handlebars.compile(templateForgotPassword.subject)(subjectParams);
  const htmlBody = Handlebars.compile(templateForgotPassword.htmlBody)(bodyParams);
  const body = '';
  return { subject, body, htmlBody };
}
module.exports = {
  generateNewOTPEmail,
  generateRegisterOTPEmail,
  generateResetPasswordEmail,
};
