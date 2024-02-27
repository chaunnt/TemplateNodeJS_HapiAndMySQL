/* Copyright (c) 2023 Reminano */

module.exports = {
  COPY_TRADE_STATUS: {
    PENDING: 0, //tạm dừng copy
    RUNNING: 1, //đang copy
    UNFOLLOW: 2, //Xóa follow
  },
  COPY_TRADE_ERROR: {
    INVALID_COPY_TRADE_ID: 'INVALID_COPY_TRADE_ID', //Sai thông tin
    ALREADY_FOLLOWED: 'ALREADY_FOLLOWED', //Đã theo dõi, không được trùng lập người theo dõi
    INVALID_EXPERT: 'INVALID_EXPERT', //Người theo dõi không tồn tại
  },
};
