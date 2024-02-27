/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const JOB_STATUS = {
  NOT_YET_START: 0, // chua chay
  SUCCESS: 1, // chay thanh cong
  FAILED: 2, // chay that bai
};

const JOB_IDS = {
  REMIND_SCHEDULE: 'remind-schedule',
  REPORT_TO_BOSS: 'report-to-boss',
  REMIND_CUSTOMER_UPDATE_VEHICLE: 'remind-customer-update-vehicle',
  REMIND_CUSTOMER_UPDATE_GCN: 'remind-customer-update-GCN',
  NOTIFY_EXPIRED_VEHICLE: 'notify-expired-vehicle',
  MOVE_DELETED_USER: 'move-deleted-user',
  AUTO_COMPLETE_CONFIRMED_SCHEDULE: 'auto-complete-confirmed-schedule',
  AUTO_CLOSE_PROCESSING_SCHEDULE: 'auto-close-processing-schedule',
  SEND_MAIL_REPORT_TO_STATIONS: 'send-mail-report-to-stations',
  AUTO_CREATE_SCHEDULE_OFF: 'auto-create-schedule-off',
  REMOVE_EXPIRED_SMS: 'remove-expired-sms',
  NOTIFY_STATION_ACTIVE_STATUS: 'notify-station-active-status',
  DELETE_UNACTIVE_ACCOUNT: 'delete-unactive-account',
  MOVE_DELETED_CUSTOMER_RECORD: 'move-deleted-customer-record',
  MOVE_DELETED_VEHICLE: 'move-deleted-vehicle',
  MOVE_DELETED_MESSAGE_CUSTOMER: 'move-deleted-message-customer',
  VEHICLE_EXTENDS: 'vehicle-extends',
  CHECK_EXPIRED_MOMO_ORDER: 'check-expired-momo-order',

  CHECK_EXPIRED_BHTV: 'check-expired-bhtv',
  CHECK_EXPIRED_BHTNDS: 'check-expired-bhtnds',

  AUTO_CREATE_WORKING_HISTORY: 'auto-create-working-history',
  AUTO_CREATE_MESSAGE_REPORT: 'auto-create-message-report',
  AUTO_SEND_MESSAGE_REPORT_TO_DIRECTOR: 'auto-send-message-report-to-director',
  AUTO_SEND_MESSAGE_WEEK_REPORT_TO_DIRECTOR: 'auto-send-message-week-report-to-director',
  AUTO_CREATE_REPORT_MSG_MARKETING: 'auto-create-report-msg-marketing',
  AUTO_SEND_STATIONS_MESSAGE: 'auto-send-stations-message',
  SEND_PROMOTIONAL_NOTIFICATION: 'send_promotional_notification',
  SEND_PUSH_NOTIFICATION_ALL_CUSTOMER: 'send_push_notification_all_customer',
  NOTIFY_UNCONFIRM_SCHEDULE: 'notify_unconfirm_schedule',
  NOTIFY_CRIMINAL_SCHEDULE: 'notify_criminal_schedule',
};

function CronJobStore() {
  let jobs = [
    {
      id: JOB_IDS.NOTIFY_UNCONFIRM_SCHEDULE,
      name: 'Tự động thông báo đến người đùng có lịch hẹn chưa được xác nhận',
      status: JOB_STATUS.NOT_YET_START,
      time: '8:00',
    },
    {
      id: JOB_IDS.NOTIFY_CRIMINAL_SCHEDULE,
      name: 'Tự động thông báo đến người dùng có lịch hẹn có xe bị phạt nguội',
      status: JOB_STATUS.NOT_YET_START,
      time: '8:00',
    },
    {
      id: JOB_IDS.CHECK_EXPIRED_BHTV,
      name: 'Tự động thông báo đến hạn BHTV',
      status: JOB_STATUS.NOT_YET_START,
      time: '1:00',
    },
    {
      id: JOB_IDS.AUTO_CREATE_WORKING_HISTORY,
      name: 'Mỗi ngày tự tạo ra phiếu phân công cho từng trạm dựa trên tình hình phân công thực tế vào lúc 22h',
      status: JOB_STATUS.NOT_YET_START,
      time: '22:00',
    },
    {
      id: JOB_IDS.CHECK_EXPIRED_BHTNDS,
      name: 'Tự động thông báo đến hạn BHTNDS',
      status: JOB_STATUS.NOT_YET_START,
      time: '1:00',
    },
    {
      id: JOB_IDS.REMIND_SCHEDULE,
      name: 'Tự động thông báo nhắc lịch hẹn',
      status: JOB_STATUS.NOT_YET_START,
      time: '7:00',
    },
    {
      id: JOB_IDS.REPORT_TO_BOSS,
      name: 'Mỗi ngày tự gửi tổng kết báo cáo đến các lãnh đạo',
      status: JOB_STATUS.NOT_YET_START,
      time: '7:00',
    },
    {
      id: JOB_IDS.REMIND_CUSTOMER_UPDATE_VEHICLE,
      name: 'Thông báo nhắc nhở khách hàng cập nhật thông tin phương tiện sau khi đăng kiểm thành công',
      status: JOB_STATUS.NOT_YET_START,
      time: '8:00',
    },
    {
      id: JOB_IDS.REMIND_CUSTOMER_UPDATE_GCN,
      name: 'Thông báo cập nhật GCN cho lịch hẹn đã đóng',
      status: JOB_STATUS.NOT_YET_START,
      time: '8:00',
    },
    {
      id: JOB_IDS.NOTIFY_EXPIRED_VEHICLE,
      name: 'Thông báo ngày hết hạn của phương tiên trong lịch hẹn đã xác nhận',
      status: JOB_STATUS.NOT_YET_START,
      time: '9:00',
    },
    {
      id: JOB_IDS.MOVE_DELETED_USER,
      name: 'Chuyển các tài khoản đã xóa vào bảng mới và xóa luôn dòng record đó',
      status: JOB_STATUS.NOT_YET_START,
      time: '10:00',
    },
    {
      id: JOB_IDS.AUTO_COMPLETE_CONFIRMED_SCHEDULE,
      name: 'Tự động hoàn tất các lich hẹn đã xác nhận',
      status: JOB_STATUS.NOT_YET_START,
      time: '20:00',
    },
    {
      id: JOB_IDS.AUTO_CLOSE_PROCESSING_SCHEDULE,
      name: 'Tự động hoàn tất các lượt đăng kiểm chưa xử lý',
      status: JOB_STATUS.NOT_YET_START,
      time: '20:00',
    },
    {
      id: JOB_IDS.VEHICLE_EXTENDS,
      name: 'Tự động kiểm tra trạng thái gia hạn phương tiện',
      status: JOB_STATUS.NOT_YET_START,
      time: '20:00',
    },
    {
      id: JOB_IDS.SEND_MAIL_REPORT_TO_STATIONS,
      name: 'Tự động tạo mail báo cáo cho các trạm',
      status: JOB_STATUS.NOT_YET_START,
      time: '21:00',
    },
    {
      id: JOB_IDS.AUTO_CREATE_SCHEDULE_OFF,
      name: 'Tự tạo lịch nghỉ cho các trạm',
      status: JOB_STATUS.NOT_YET_START,
      time: '22:00',
    },
    {
      id: JOB_IDS.REMOVE_EXPIRED_SMS,
      name: 'Tự động xóa các record tin nhắn SMS hết hạn',
      status: JOB_STATUS.NOT_YET_START,
      time: '22:00',
    },
    {
      id: JOB_IDS.NOTIFY_STATION_ACTIVE_STATUS,
      name: 'Tự tạo thông báo trạng thái hoạt động của trạm',
      status: JOB_STATUS.NOT_YET_START,
      time: '23:00',
    },
    {
      id: JOB_IDS.DELETE_UNACTIVE_ACCOUNT,
      name: 'Tự động xóa các tài khoản chưa kích hoạt quá 60 ngày',
      status: JOB_STATUS.NOT_YET_START,
      time: '23:00',
    },
    {
      id: JOB_IDS.MOVE_DELETED_CUSTOMER_RECORD,
      name: 'Chuyển dữ liệu đăng kiểm đã xóa sang bảng CustomerRecordDeleted',
      status: JOB_STATUS.NOT_YET_START,
      time: '23:00',
    },
    {
      id: JOB_IDS.MOVE_DELETED_VEHICLE,
      name: 'Chuyển dữ liệu phương tiện đã xóa sang bảng AppUserVehicleDeleted',
      status: JOB_STATUS.NOT_YET_START,
      time: '23:00',
    },
    {
      id: JOB_IDS.MOVE_DELETED_MESSAGE_CUSTOMER,
      name: 'Chuyển dữ liệu mesage của user đã xóa tài khoản sang bảng MessageCustomerDeleted',
      status: JOB_STATUS.NOT_YET_START,
      time: '23:00',
    },
    {
      id: JOB_IDS.AUTO_CREATE_MESSAGE_REPORT,
      name: 'Tự update báo cáo tin nhắn marketing cho trạm',
      status: JOB_STATUS.NOT_YET_START,
      time: '23:59',
    },
    {
      id: JOB_IDS.AUTO_SEND_MESSAGE_REPORT_TO_DIRECTOR,
      name: 'Tự gửi tin nhắn báo cáo cho giám đốc trạm mỗi ngày',
      status: JOB_STATUS.NOT_YET_START,
      time: '07:00',
    },
    {
      id: JOB_IDS.AUTO_SEND_STATIONS_MESSAGE,
      name: 'Tự gửi tin nhắn nhắc lịch cho khách hàng theo mốc thời gian trạm cài đặt',
      status: JOB_STATUS.NOT_YET_START,
      time: '05:00',
    },
    {
      id: JOB_IDS.SEND_PROMOTIONAL_NOTIFICATION,
      name: 'Mỗi 30 phút gửi thông báo khuyến mãi cho khánch hàng đặt lịch thành công',
      status: JOB_STATUS.NOT_YET_START,
      time: '00:30',
    },

    {
      id: JOB_IDS.SEND_PUSH_NOTIFICATION_ALL_CUSTOMER,
      name: 'Mỗi 10 phút kiểm tra và gửi thông báo push (tin tức mới) đến tất cả người dùng',
      status: JOB_STATUS.NOT_YET_START,
      time: '00:10',
    },
  ];

  return {
    setJobSuccess(jobId) {
      jobs = jobs.map(job => {
        if (job.id === jobId) {
          job.status = JOB_STATUS.SUCCESS;
        }
        return job;
      });
    },
    setJobFail(jobId) {
      jobs = jobs.map(job => {
        if (job.id === jobId) {
          job.status = JOB_STATUS.FAILED;
        }
        return job;
      });
    },
    resetAllJob() {
      jobs.forEach(job => {
        job.status = JOB_STATUS.NOT_YET_START;
      });
    },
    getJobsStatus() {
      return jobs;
    },
  };
}

module.exports = {
  CronJobStore,
  JOB_STATUS,
  JOB_IDS,
};
