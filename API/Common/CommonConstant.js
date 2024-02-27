/* Copyright (c) 2022-2024 Reminano */

module.exports = {
  UNKNOWN_ERROR: 'UNKNOWN_ERROR', //Hệ thống tạm ngưng, vui lòng thử lại sau
  NO_DATA: 'NO_DATA', //Không có dữ liệu
  NOT_ENOUGH_AUTHORITY: 'NOT_ENOUGH_AUTHORITY', //Người dùng không có quyền thực hiện thao tác
  POPULAR_ERROR: {
    INSERT_FAILED: 'INSERT_FAILED', //Tạo mới thất bại
    RECORD_NOT_FOUND: 'RECORD_NOT_FOUND', //Không tìm thấy dữ liệu
    UPDATE_FAILED: 'UPDATE_FAILED', //Cập nhật dữ liệu thất bại
    DELETE_FAILED: 'DELETE_FAILED', //Xóa dữ liệu thất bại
    DUPLICATE_DATA: 'DUPLICATE_DATA', //Dữ liệu trùng lặp
  },
  MAINTAIN_ERROR: {
    MAINTAIN_ALL: 'MAINTAIN_ALL', //hệ thống bảo trì
    MAINTAIN_SIGN_IN: 'MAINTAIN_SIGN_IN', //chức năng đăng nhập bảo trì
    MAINTAIN_SIGNUP: 'MAINTAIN_SIGNUP', //chức năng đăng ký bảo trì
    MAINTAIN_FORGOT_PASSWORD: 'MAINTAIN_FORGOT_PASSWORD', //chức năng quên mật khẩu bảo trì
    MAINTAIN_CHANGE_PASSWORD: 'MAINTAIN_CHANGE_PASSWORD', //chức năng thay đổi mật khẩu bảo trì
    MAINTAIN_DEPOSIT: 'MAINTAIN_DEPOSIT', //chức năng nạp tiền bảo trì
    MAINTAIN_WITHDRAW: 'MAINTAIN_WITHDRAW', //chức năng rút tiền bảo trì
    MAINTAIN_WITHDRAW_BONUS: 'MAINTAIN_WITHDRAW_BONUS', //chức năng rút tiền hoa hồng bảo trì
  },
  NO_PERMISSION: 'NO_PERMISSION', //Người dùng không có quyền thao tác
  DATETIME_DISPLAY_FORMAT: 'DD-MM-YYYY HH:mm',
  DATETIME_DATA_ISO_FORMAT: 'YYYY-MM-DDTHH:mm:SS.000Z',
};
