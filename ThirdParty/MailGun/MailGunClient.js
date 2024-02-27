/* Copyright (c) 2024 Reminano */

const mg = require('mailgun-js');
const mailgun = () =>
  mg({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  });
const Logger = require('../../utils/logging');
async function sendTestEmail(testEmail = 'chacha@gmail.com') {
  Logger.info('sendTestEmail');
  let mailBody = '';
  mailBody += 'THÔNG BÁO!' + '\r\n\r\n';
  let subject = '[THÔNG BÁO] đây là email test hệ thống';
  await sendEmail(testEmail, subject, mailBody);
}

async function sendEmail(receiver, subject, body, html, emailClient) {
  let emailData = {
    from: `<${process.env.SMTP_EMAIL}>`,
    to: receiver,
    subject: subject,
  };

  if (emailClient) {
    try {
      emailData.from = emailClient.options.auth.user;
    } catch (error) {
      Logger.error(`can not get email of emailClient`);
      Logger.error(error);

      //if error, then use default
      emailData.from = `<${process.env.SMTP_EMAIL}>`;
    }
  }

  if (body) {
    emailData.text = body;
  }

  if (html) {
    emailData.html = html;
  }

  return new Promise((resolve, reject) => {
    mailgun()
      .messages()
      .send(emailData, (error, body) => {
        if (error) {
          resolve(undefined);
        } else {
          resolve('send email successfully');
        }
      });
  });
}
module.exports = {
  sendTestEmail,
  sendEmail,
};
