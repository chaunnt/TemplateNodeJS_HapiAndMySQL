/* Copyright (c) 2022-2023 Reminano */

const GameRecordsResourceAccess = require('../../resourceAccess/GameRecordsResourceAccess');
const crawlLottery = require('../../../../cron/crawlerLottery').crawlLottery;
const { GAME_RECORD_STATUS } = require('../../GameRecordConstant');
const CustomerMessageFunctions = require('../../../CustomerMessage/CustomerMessageFunctions');
const { XSTT_PRODUCT_CHANNEL, BET_TYPE, BET_STATUS } = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const GameRecordFunctions = require('../../GameRecordFunctions');
const GamePlayRecordsResourceAccess = require('../../../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
const moment = require('moment');
const Logger = require('../../../../utils/logging');
async function updateGameResult(gameRecordSection) {
  let existedGameRecord = await GameRecordsResourceAccess.find({
    gameRecordSection: gameRecordSection,
    gameRecordStatus: GAME_RECORD_STATUS.NEW,
  });
  if (existedGameRecord && existedGameRecord.length > 0) {
    existedGameRecord = existedGameRecord[0];
    if (!existedGameRecord.gameRecordValue) {
      let channel = existedGameRecord.gameRecordSection.split(/_/).slice(1).join('_').toLowerCase();
      const resultLottery = await _getResultLottery(channel);
      let gameDateResult = moment(resultLottery.ngayXoSo).format('YYYYMMDD'); // ngay xo so
      let getDateAdd = existedGameRecord.gameRecordSection.split('_'); //chi lay ngay tao
      let gameDateAdd = getDateAdd[0];
      if (gameDateResult === gameDateAdd) {
        let updateRecordData = {
          gameRecordValue: resultLottery.ketqua,
          gameRecordStatus: GAME_RECORD_STATUS.PENDING,
        };
        let isUpdateSuccess = await GameRecordsResourceAccess.updateById(existedGameRecord.gameRecordId, updateRecordData);
        let isGameRecordValueChange = existedGameRecord.gameRecordValue !== updateRecordData.gameRecordValue;
        if (isUpdateSuccess && isGameRecordValueChange) {
          let groupNotifyTitle = 'Kết quả quả xổ số';
          let gameDateResultFormat = moment(resultLottery.ngayXoSo).format('DD-MM-YYYY');
          let gameChannel = mappingModelGameRecordChannel(channel.toUpperCase());
          let groupNotifyContent = `Đã có kết quả dò hôm nay đài ${gameChannel} ngày ${gameDateResultFormat}`;
          await CustomerMessageFunctions.sendNotificationAllUser(groupNotifyTitle, groupNotifyContent);

          // trả tiền thưởng cho user
          await updateWinLoseResultForBetRecord(existedGameRecord.gameRecordId);
        }
      } else {
        Logger.error(`date game different to update result ${gameRecordSection}`);
      }
    }
  } else {
    Logger.error(`can not find game to update result ${gameRecordSection}`);
  }
}

async function updateWinLoseResultForBetRecord(gameRecordId) {
  try {
    const gameRecord = await GameRecordsResourceAccess.findById(gameRecordId);

    // get records that users placed
    const gamePlayRecords = await GamePlayRecordsResourceAccess.find({
      betRecordSection: gameRecord.gameRecordSection,
      betRecordStatus: BET_STATUS.NEW,
    });
    //if users placed
    if (gamePlayRecords.length != 0) {
      await GameRecordFunctions.checkResultXososieutoc(gamePlayRecords, gameRecord);
    }

    //update status game
    await GameRecordsResourceAccess.updateById(gameRecord.gameRecordId, {
      gameRecordStatus: BET_STATUS.COMPLETED,
    });
  } catch (error) {
    Logger.error(`[Error]: Check xosotruyenthong game record error`, error);
  }
}

function mappingModelGameRecordChannel(gameRecordType) {
  switch (gameRecordType) {
    case XSTT_PRODUCT_CHANNEL.DONG_THAP:
      return 'Đồng Tháp';
    case XSTT_PRODUCT_CHANNEL.CA_MAU:
      return 'Cà Mau';
    case XSTT_PRODUCT_CHANNEL.BEN_TRE:
      return 'Bến Tre';
    case XSTT_PRODUCT_CHANNEL.VUNG_TAU:
      return 'Vũng Tàu';
    case XSTT_PRODUCT_CHANNEL.BAC_LIEU:
      return 'Bạc Liêu';
    case XSTT_PRODUCT_CHANNEL.DONG_NAI:
      return 'Đồng Nai';
    case XSTT_PRODUCT_CHANNEL.CAN_THO:
      return 'Cần Thơ';
    case XSTT_PRODUCT_CHANNEL.SOC_TRANG:
      return 'Sóc Trăng';
    case XSTT_PRODUCT_CHANNEL.TAY_NINH:
      return 'Tây Ninh';
    case XSTT_PRODUCT_CHANNEL.AN_GIANG:
      return 'An Giang';
    case XSTT_PRODUCT_CHANNEL.BINH_THUAN:
      return 'Bình Thuận';
    case XSTT_PRODUCT_CHANNEL.VINH_LONG:
      return 'Vĩnh Long';
    case XSTT_PRODUCT_CHANNEL.BINH_DUONG:
      return 'Bình Dương';
    case XSTT_PRODUCT_CHANNEL.TRA_VINH:
      return 'Trà Vinh';
    case XSTT_PRODUCT_CHANNEL.LONG_AN:
      return 'Long An';
    case XSTT_PRODUCT_CHANNEL.HAU_GIANG:
      return 'Hậu Giang';
    case XSTT_PRODUCT_CHANNEL.BINH_PHUOC:
      return 'Bình Phước';
    case XSTT_PRODUCT_CHANNEL.LAM_DONG:
      return 'Lâm Đồng';
    case XSTT_PRODUCT_CHANNEL.KIEN_GIANG:
      return 'Kiên Giang';
    case XSTT_PRODUCT_CHANNEL.TIEN_GIANG:
      return 'Tiền Giang';
    default:
      return 'Hồ Chí Minh';
  }
}

async function _getResultLottery(channel) {
  return await crawlLottery(channel);
}

module.exports = {
  updateGameResult,
};
