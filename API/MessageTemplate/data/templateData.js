/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const dotenv = require('dotenv').config();
const { TEMPLATE_TYPE } = require('../MessageTemplateConstant');

module.exports = {
  SMS_CSKH: [
    {
      id: 1,
      messageTemplateName: 'Nhắc đăng kiểm mẫu 1',
      messageTemplateContent:
        'TTDK kinh bao: KH co xe {{vehiclePlateNumber}} đã đến hạn kiểm định ngày {{customerRecordCheckExpiredDate}} tai TTDK {{stationCode}} {{stationsAddress}}. Quy khach can ho tro vui long lien he {{stationsHotline}}',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null,
      messageTemplateType: TEMPLATE_TYPE.SMS_CSKH,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 1,
      messageDemo:
        'TTDK kinh bao: KH co xe 50C12345 đã đến hạn kiểm định ngày 01/01/2024 tai TTDK 1011S Quan Tan Binh TPHCM. Quy khach can ho tro vui long lien he 0909090909',
    },
    {
      id: 2,
      messageTemplateName: 'Nhắc đăng kiểm mẫu 2',
      messageTemplateContent:
        'TTDK thong bao: KH oto bien so {{vehiclePlateNumber}} het han kiem dinh ngay {{customerRecordCheckExpiredDate}}. Quy khach dang ky dang kiem tai TTDK {{stationCode}} {{stationsAddress}} de duoc ho tro. T/t cam on.',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null,
      messageTemplateType: TEMPLATE_TYPE.SMS_CSKH,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 1,
      messageDemo:
        'TTDK thong bao: KH oto bien so 50C12345 het han kiem dinh ngay 01/01/2024. Quy khach dang ky dang kiem tai TTDK 1011S Quan Tan Binh TPHCM de duoc ho tro. T/t cam on.',
    },
  ],
  ZALO_CSKH: [
    {
      id: 10,
      messageTemplateName: 'Nhắc đăng kiểm qua Zalo  mẫu 1',
      messageTemplateContent:
        'TTDK Thông báo: Khách hàng có ôtô biển số {{customerRecordPlatenumber}} hết hạn kiểm định ngày {{customerRecordCheckExpiredDate}}. Quý khách đăng ký đăng kiểm tại {{stationsName}} địa chỉ: {{stationsAddress}} để được hỗ trợ. Trân trọng cảm ơn.',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: 286946,
      messageTemplateType: TEMPLATE_TYPE.ZALO_CSKH,
      messageTemplatePrice: 300,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 1,
      messageDemo:
        'TTDK Thông báo: Khách hàng có ôtô biển số 50C12345 hết hạn kiểm định ngày 01/01/2024. Quý khách đăng ký đăng kiểm tại TTDK Tan Binh 1011S địa chỉ: P15 Q Tan Binh TP.HCM để được hỗ trợ. Trân trọng cảm ơn.',
    },
    {
      id: 11,
      messageTemplateName: 'Nhắc đăng kiểm qua Zalo mẫu 2',
      messageTemplateContent:
        '{{stationsName}} {{stationsAddress}} kính báo: Xe {{customerRecordPlatenumber}} hết hạn kiểm định ngày {{customerRecordCheckExpiredDate}}. Quý khách cần hỗ trợ vui lòng liên hệ {{stationsHotline}}.',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: 262238,
      messageTemplateType: TEMPLATE_TYPE.ZALO_CSKH,
      messageTemplatePrice: 300,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
      messageDemo:
        'TTDK Tan Binh 1011S P15 Quan Tan Binh TPHCM kính báo: Xe 50C12345 hết hạn kiểm định ngày 01/01/2024. Quý khách cần hỗ trợ vui lòng liên hệ 0909090909.',
    },
  ],
  SMS_PROMOTION: [
    {
      id: 3,
      messageTemplateName: 'Khuyến mãi bảo hiểm mẫu 1',
      messageTemplateContent:
        'TTDK {{stationCode}} t.báo có k.mãi tốt khi mua bảo hiểm cho xe đã đăng kiểm tại trạm. Vui lòng lh sdt {{stationsHotline}} để được tư vấn',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.SMS_PROMOTION,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 4,
      messageTemplateName: 'Khuyến mãi bảo dưỡng xe mẫu 1',
      messageTemplateContent:
        '{{stationsName}} t.báo từ ngày {{startDay}} to chuc c.trình k.mãi đặc biệt đồng sơn/bảo dưỡng cho {{vehiclePlateNumber}}. Vui lòng lh sdt {{stationsHotline}} để biết thêm chi tiết',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.SMS_PROMOTION,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 5,
      messageTemplateName: 'Nhắc hẹn bảo dưỡng xe mẫu 1',
      messageTemplateContent:
        '{{stationsName}} t.báo xe ôtô {{vehiclePlateNumber}} của Q.Khách đã đến hạn bảo dưỡng. Vui lòng lh sdt {{stationsHotline}} đặt hẹn để được ưu tiên',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.SMS_PROMOTION,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 6,
      messageTemplateName: 'Khuyến mãi bảo dưỡng xe mẫu 2',
      messageTemplateContent:
        '{{stationsName}} t.báo xe ôtô {{vehiclePlateNumber}} của Q.Khách được miễn phí k.tra tổng quát xe trước {{startDate}}. Vui lòng lh sdt {{stationsHotline}} đặt hẹn',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.SMS_PROMOTION,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 7,
      messageTemplateName: 'Quảng cáo bảo dưỡng xe mẫu 1',
      messageTemplateContent:
        '{{stationsName}} khai truong CN mới tại {{stationsAddress}} k.mãi quà hot cho hoá đơn từ {{minPaymentAmount}}. Vui lòng lh sdt {{stationsHotline}} để biết thêm chi tiết',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.SMS_PROMOTION,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 8,
      messageTemplateName: 'Quảng cáo cứu hộ mẫu 1',
      messageTemplateContent: '{{stationsName}}: hệ thống hơn 100 xe, nhanh chóng, giá cực kì ưu đãi. Lưu số {{stationsHotline}} để khi cần là có',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.SMS_PROMOTION,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 9,
      messageTemplateName: 'Khuyến mãi cứu hộ xe mẫu 1',
      messageTemplateContent:
        '{{stationsName}} khuyến mãi giá tốt cho cứu hộ xe trên {{distance}}. Lưu số {{stationsHotline}} và bấm gọi để biết thêm chi tiết',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.SMS_PROMOTION,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
  ],
  ZALO_PROMOTION: [
    {
      id: 12,
      messageTemplateName: 'Khuyến mãi bảo hiểm qua Zalo mẫu 1',
      messageTemplateContent:
        'TTDK {{stationCode}} t.báo có k.mãi tốt khi mua bảo hiểm cho xe đã đăng kiểm tại trạm. Vui lòng lh sdt {{stationsHotline}} để được tư vấn',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.ZALO_PROMOTION,
      messageTemplatePrice: 300,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 13,
      messageTemplateName: 'Khuyến mãi bảo dưỡng xe qua Zalo mẫu 1',
      messageTemplateContent:
        '{{stationsName}} t.báo từ ngày {{startDay}} to chuc c.trình k.mãi đặc biệt đồng sơn/bảo dưỡng cho {{vehiclePlateNumber}}. Vui lòng lh sdt {{stationsHotline}} để biết thêm chi tiết',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.ZALO_PROMOTION,
      messageTemplatePrice: 300,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 14,
      messageTemplateName: 'Nhắc hẹn bảo dưỡng xe qua Zalo mẫu 1',
      messageTemplateContent:
        '{{stationsName}} t.báo xe ôtô {{vehiclePlateNumber}} của Q.Khách đã đến hạn bảo dưỡng. Vui lòng lh sdt {{stationsHotline}} đặt hẹn để được ưu tiên',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.ZALO_PROMOTION,
      messageTemplatePrice: 300,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 15,
      messageTemplateName: 'Khuyến mãi bảo dưỡng xe qua Zalo mẫu 2',
      messageTemplateContent:
        '{{stationsName}} t.báo xe ôtô {{vehiclePlateNumber}} của Q.Khách được miễn phí k.tra tổng quát xe trước {{startDate}}. Vui lòng lh sdt {{stationsHotline}} đặt hẹn',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.ZALO_PROMOTION,
      messageTemplatePrice: 300,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 16,
      messageTemplateName: 'Quảng cáo bảo dưỡng xe qua Zalo mẫu 1',
      messageTemplateContent:
        '{{stationsName}} khai truong CN mới tại {{stationsAddress}} k.mãi quà hot cho hoá đơn từ {{minPaymentAmount}}. Vui lòng lh sdt {{stationsHotline}} để biết thêm chi tiết',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.ZALO_PROMOTION,
      messageTemplatePrice: 300,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 17,
      messageTemplateName: 'Quảng cáo cứu hộ qua Zalo mẫu 1',
      messageTemplateContent: '{{stationsName}}: hệ thống hơn 100 xe, nhanh chóng, giá cực kì ưu đãi. Lưu số {{stationsHotline}} để khi cần là có',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.ZALO_PROMOTION,
      messageTemplatePrice: 300,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 18,
      messageTemplateName: 'Khuyến mãi cứu hộ xe qua Zalo mẫu 1',
      messageTemplateContent:
        '{{stationsName}} khuyến mãi giá tốt cho cứu hộ xe trên {{distance}}. Lưu số {{stationsHotline}} và bấm gọi để biết thêm chi tiết',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.ZALO_PROMOTION,
      messageTemplatePrice: 300,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
  ],
  REPORT: [
    {
      id: 19,
      messageTemplateName: 'Báo cáo tình hình hoạt động trong ngày tại trạm',
      messageTemplateContent:
        'Báo cáo từ hệ thống TTDK tình hình hoạt động tại {{stationsName}} vào ngày {{workingDay}} - Lịch hẹn đã xử lý {{totalCompletedSchedule}} xe - Tin nhắn nhắc lịch đã gửi {{totalCompletedMarketingMessage}} tin nhắn - Lịch hẹn hôm nay {{totalScheduleTomorrow}} xe. Mọi thắc mắc xin liên hệ Zalo TTDK hoặc đội ngũ TTDK để được hỗ trợ',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: 289552, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.ZALO_PROMOTION,
      messageTemplatePrice: 300,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 20,
      messageTemplateName: 'Báo cáo tình hình hoạt động trong tuần tại trạm',
      messageTemplateContent:
        'Báo cáo từ hệ thống TTDK tình hình hoạt động tại {{stationsName}} từ ngày {{startDate}} đến ngày {{endDate}} - Tin nhắn nhắc lịch đã gửi trong tuần {{totalCompletedMarketingMessage}} tin nhắn - - Lịch hẹn đã xử lý trong tuần {{totalCompletedSchedule}} xe . Mọi thắc mắc xin liên hệ Zalo TTDK hoặc đội ngũ TTDK để được hỗ trợ',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: 289676, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.ZALO_PROMOTION,
      messageTemplatePrice: 300,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
    {
      id: 21,
      messageTemplateName: 'Báo cáo tình hình hoạt động trong ngày tại trạm',
      messageTemplateContent:
        'Báo cáo từ hệ thống TTDK tình hình hoạt động tại {{stationsName}} vào ngày {{workingDay}}. Lịch hẹn cần xử lý hôm nay {{totalScheduleToday}} xe. Mọi thắc mắc xin liên hệ Zalo TTDK hoặc đội ngũ TTDK để được hỗ trợ',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: 292806, // chưa đăng ký
      messageTemplateType: TEMPLATE_TYPE.ZALO_PROMOTION,
      messageTemplatePrice: 300,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 0,
    },
  ],
  STATION_SMS_CSKH: [
    // Mẫu SMS cho trạm 2404D đăng ký
    {
      id: 22,
      messageTemplateName: 'Nhắc đăng kiểm mẫu 3',
      messageTemplateContent:
        'Xe {{vehiclePlateNumber}} đến hạn kiểm định ngày {{customerRecordCheckExpiredDate}}, quý khách liên hệ TTDK {{stationCode}} {{stationsAddress}} sđt {{stationsHotline}} để được hỗ trợ',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null,
      messageTemplateType: TEMPLATE_TYPE.SMS_CSKH,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 1,
      messageDemo: 'Xe 50C12345 đến hạn kiểm định ngày 01/01/2024, quý khách liên hệ TTDK 1011S Quan Tan Binh TPHCM sđt 0909090909 để được hỗ trợ',
    },

    // Mẫu SMS cho trạm 2403D đăng ký
    {
      id: 23,
      messageTemplateName: 'Nhắc đăng kiểm mẫu 4',
      messageTemplateContent:
        'Trân trọng Thông báo! Xe {{vehiclePlateNumber}} của Quý khách sẽ đến hạn kiểm định ngày {{customerRecordCheckExpiredDate}}. Quý khách vui lòng liên hệ TTDK {{stationCode}} để được hỗ trợ - Hotline {{stationsHotline}}.',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null,
      messageTemplateType: TEMPLATE_TYPE.SMS_CSKH,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 1,
      messageDemo:
        'Trân trọng Thông báo! Xe 50C12345 của Quý khách sẽ đến hạn kiểm định ngày 01/01/2024. Quý khách vui lòng liên hệ TTDK 2403D để được hỗ trợ - Hotline 02143838999.',
    },

    {
      id: 24,
      messageTemplateName: 'Mẫu nhắc gia hạn bảo hiểm TNDS',
      messageTemplateContent:
        'Xe {{vehiclePlateNumber}} đến hạn BH TNDS ngày {{customerRecordCheckExpiredDate}}, quý khách liên hệ TTDK {{stationCode}} {{stationsAddress}} sđt {{stationsHotline}} để được hỗ trợ',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null,
      messageTemplateType: TEMPLATE_TYPE.SMS_CSKH,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 1,
      messageDemo: 'Xe 50C12345 đến hạn BH TNDS ngày 01/01/2024, quý khách liên hệ TTDK 1011S Quan Tan Binh TPHCM sđt 0909090909 để được hỗ trợ',
    },

    {
      id: 25,
      messageTemplateName: 'Mẫu nhắc gia hạn bảo hiểm thân vỏ xe',
      messageTemplateContent:
        'Xe {{vehiclePlateNumber}} đến hạn BH thân vỏ xe ngày {{customerRecordCheckExpiredDate}}, quý khách liên hệ TTDK {{stationCode}} {{stationsAddress}} sđt {{stationsHotline}} để được hỗ trợ',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null,
      messageTemplateType: TEMPLATE_TYPE.SMS_CSKH,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 1,
      messageDemo:
        'Xe 50C12345 đến hạn BH thân vỏ xe ngày 01/01/2024, quý khách liên hệ TTDK 1011S Quan Tan Binh TPHCM sđt 0909090909 để được hỗ trợ',
    },

    {
      id: 26,
      messageTemplateName: 'Mẫu nhắc gia hạn dịch vụ GPS',
      messageTemplateContent:
        'Xe {{vehiclePlateNumber}} đến hạn dịch vụ GPS  ngày {{customerRecordCheckExpiredDate}}, quý khách liên hệ TTDK {{stationCode}} {{stationsAddress}} sđt {{stationsHotline}} để được hỗ trợ',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: null,
      messageTemplateType: TEMPLATE_TYPE.SMS_CSKH,
      messageTemplatePrice: 850,
      messageTemplateImage: `https://${process.env.HOST_NAME}/uploads/BannerDemo.jpg`,
      messageTemplateEnabled: 1,
      messageDemo: 'Xe 50C12345 đến hạn dịch vụ GPS ngày 01/01/2024, quý khách liên hệ TTDK 1011S Quan Tan Binh TPHCM sđt 0909090909 để được hỗ trợ',
    },
  ],
};
