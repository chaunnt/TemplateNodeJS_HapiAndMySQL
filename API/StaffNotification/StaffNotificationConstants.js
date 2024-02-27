/* Copyright (c) 2022 Reminano */

module.exports = {
  NOTIFICATION_METHOD: {
    SMS: 'SMS',
    EMAIL: 'Email',
    ZNS: 'ZNS',
    FIREBASE_PUSH: 'FIREBASE_PUSH',
    GENERAL: 'GENERAL',
  },
  NOTIFICATION_STATUS: {
    NEW: 'New',
    SENDING: 'Sending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELED: 'Canceled',
  },
  NOTIFICATION_TYPE: {
    GENERAL: 'GENERAL',
  },
  NOTIFICATION_RECEIVER: {
    USER: 1,
    STAFF: 2,
  },
  NOTIFICATION_TOPIC: {
    GENERAL: 'GENERAL',
    USER: 'USER', //USER_<ID của user>,
    STAFF: 'STAFF', //STAFF_<ID của staff>
  },
};
