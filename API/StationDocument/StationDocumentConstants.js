/* Copyright (c) 2023 TORITECH LIMITED 2022 */

module.exports = {
  MAX_LIMIT_FILE_PER_DOCUMENT: 10,
  READING_STATUS: {
    ALREADY_READ: 1,
    NOT_READ: 0,
  },
  DOCUMENT_CATEGORY: {
    OFFICIAL_LETTER: 1, //Công văn
    ESTABLISHMENT_APPOINTMENT_DOCUMENT: 2, // Giấy tờ thành lập / bổ nhiệm
    PERIODIC_INSPECTION_DOCUMENT: 3, //Văn bản kiểm tra định kỳ
    TASK_ASSIGNMENT_FORM: 4, // Phiếu phân công nhiệm vụ
  },
};
