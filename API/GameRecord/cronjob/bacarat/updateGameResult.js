/* Copyright (c) 2022-2023 Reminano */

const GameRecordsResourceAccess = require('../../resourceAccess/GameRecordsResourceAccess');
const GamePlayRecordsResourceAccess = require('../../../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
const GamePlayRecordsFunctions = require('../../../GamePlayRecords/GamePlayRecordsFunctions');
const utilFunctions = require('../../../ApiUtils/utilFunctions');
const { BET_TYPE, BET_STATUS, BET_RESULT, BET_VALUE } = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const { GAME_RECORD_STATUS } = require('../../GameRecordConstant');
const Logger = require('../../../../utils/logging');

async function updateLatestGameResult(lastGameSection) {
  const gameRecords = await GameRecordsResourceAccess.find(
    {
      gameRecordSection: lastGameSection,
      gameRecordType: BET_TYPE.BACARAT1P,
      gameRecordStatus: BET_STATUS.NEW,
    },
    0,
    1,
    {
      key: 'gameRecordSection',
      value: 'asc',
    },
  );
  if (gameRecords && gameRecords.length > 0 && gameRecords[0].gameRecordValue == null) {
    const gameRecord = gameRecords[0];
    const bacaratValue = _generateResultBacarat();
    const updatedResult = await GameRecordsResourceAccess.updateById(gameRecord.gameRecordId, {
      gameRecordValue: bacaratValue,
      gameRecordStatus: BET_STATUS.PENDING,
    });
    if (!updatedResult) {
      Logger.info(`[Failure]: ${gameRecord.gameRecordSection} - Updated game record bacarat failure- ${bacaratValue}`);
    }
  }
}

async function updateWinLoseResultForBetRecord(lastGameSection) {
  const gameRecordToUpdate = await GameRecordsResourceAccess.find(
    {
      gameRecordSection: lastGameSection,
      gameRecordType: BET_TYPE.BACARAT1P,
      gameRecordStatus: GAME_RECORD_STATUS.PENDING,
    },
    0,
    1,
    {
      key: 'gameRecordSection',
      value: 'asc',
    },
  );
  if (gameRecordToUpdate && gameRecordToUpdate.length > 0) {
    const gameRecord = gameRecordToUpdate[0];
    let gamePlayRecordCount = 50;
    let gamePlayRecordSkip = 0;
    while (gamePlayRecordCount > 0) {
      const gamePlayRecords = await GamePlayRecordsResourceAccess.find(
        {
          betRecordSection: gameRecord.gameRecordSection,
          betRecordType: BET_TYPE.BACARAT1P,
          betRecordStatus: BET_STATUS.NEW,
        },
        gamePlayRecordSkip,
        gamePlayRecordCount,
      );
      if (gamePlayRecords && gamePlayRecords.length > 0) {
        gamePlayRecordSkip += gamePlayRecords.length;
        for (let index = 0; index < gamePlayRecords.length; index++) {
          const gamePlayRecord = gamePlayRecords[index];
          //tinh toan ket qua thang thua => tien
          const moneyReceived = await _checkWinLoseResult(gameRecord, gamePlayRecord);
          //xu ly tra thuong => cap nhat game play record + cong tien wallet + thong bao user
          await GamePlayRecordsFunctions.updateWinLoseForBetGame(gamePlayRecord, moneyReceived);
        }
      } else {
        gamePlayRecordCount = 0;
      }
    }
    await GameRecordsResourceAccess.updateById(gameRecord.gameRecordId, {
      gameRecordStatus: GAME_RECORD_STATUS.COMPLETED,
    });
  }
}

async function _checkWinLoseResult(gameRecord, gamePlayRecord) {
  //ket qua game record
  const playerValue = gameRecord.gameRecordValue.split('|')[0];
  const bankerValue = gameRecord.gameRecordValue.split('|')[1];

  let playerLa1 = playerValue.split(';')[0];
  let playerLa2 = playerValue.split(';')[1];
  let playerLa3 = playerValue.split(';')[2];
  let player3La = false;

  let bankerLa1 = bankerValue.split(';')[0];
  let bankerLa2 = bankerValue.split(';')[1];
  let bankerLa3 = bankerValue.split(';')[2];
  let banker3La = false;

  let playerPoint = _getPointCard(parseInt(playerLa1)) + _getPointCard(parseInt(playerLa2));
  if (playerLa3 !== undefined) {
    playerPoint += _getPointCard(parseInt(playerLa3));
    player3La = true;
  }
  let bankerPoint = _getPointCard(parseInt(bankerLa1)) + _getPointCard(parseInt(bankerLa2));
  if (bankerLa3 !== undefined) {
    bankerPoint += _getPointCard(parseInt(bankerLa3));
    banker3La = true;
  }
  //xu ly tinh toan ket qua game
  let caiThang = playerPoint < bankerPoint;
  let conThang = playerPoint > bankerPoint;
  let hoa = playerPoint == bankerPoint;
  let conDoi = playerLa1 == playerLa2 || playerLa1 == playerLa3 || playerLa2 == playerLa3;
  let caiDoi = bankerLa1 == bankerLa2 || bankerLa1 == bankerLa3 || bankerLa2 == bankerLa3;
  let conLongBao = false;
  let caiLongBao = false;
  let betWinLongBao = 0; //ty le an giai Long Bao
  if (!player3La) {
    //con 2 la => bai chuan
    if ((conThang && playerPoint == 8) || playerPoint == 9) {
      //con thang va diem la 8 hoac 9 => con Long Bao
      conLongBao = true;
      betWinLongBao = 1;
    }
  } else {
    //con 3 la => bai khong chuan
    const deltaPoint = playerPoint - bankerPoint;
    if (conThang && deltaPoint >= 4) {
      //con thang va so sanh diem chenh lech >= 4 => con Long Bao
      conLongBao = true;
      switch (deltaPoint) {
        case 4:
          betWinLongBao = 1;
          break;
        case 5:
          betWinLongBao = 2;
          break;
        case 6:
          betWinLongBao = 4;
          break;
        case 7:
          betWinLongBao = 6;
          break;
        case 8:
          betWinLongBao = 10;
          break;
        case 9:
          betWinLongBao = 30;
          break;
      }
    }
  }
  if (!banker3La) {
    //cai 2 la => bai chuan
    if ((caiThang && bankerPoint == 8) || bankerPoint == 9) {
      //cai thang va diem la 8 hoac 9 => cai Long Bao
      caiLongBao = true;
      betWinLongBao = 1;
    }
  } else {
    //cai 3 la => bai khong chuan
    const deltaPoint = bankerPoint - playerPoint;
    if (caiThang && deltaPoint >= 4) {
      //con thang va so sanh diem chenh lech >= 4 => con Long Bao
      caiLongBao = true;
      switch (deltaPoint) {
        case 4:
          betWinLongBao = 1;
          break;
        case 5:
          betWinLongBao = 2;
          break;
        case 6:
          betWinLongBao = 4;
          break;
        case 7:
          betWinLongBao = 6;
          break;
        case 8:
          betWinLongBao = 10;
          break;
        case 9:
          betWinLongBao = 30;
          break;
      }
    }
  }
  //xu ly luu du lieu win lose cho user
  let matchResult = BET_RESULT.LOSE;
  let betWin = 0; //ty le an giai
  let winAmount = 0;
  if (gamePlayRecord.betRecordValue == BET_VALUE.BACARAT.CAI_THANG && caiThang) {
    matchResult = BET_RESULT.WIN;
    betWin = 1;
  }
  if (gamePlayRecord.betRecordValue == BET_VALUE.BACARAT.CON_THANG && conThang) {
    matchResult = BET_RESULT.WIN;
    betWin = 1;
  }
  if (gamePlayRecord.betRecordValue == BET_VALUE.BACARAT.HOA && hoa) {
    matchResult = BET_RESULT.WIN;
    betWin = 8;
  }
  if (gamePlayRecord.betRecordValue == BET_VALUE.BACARAT.CAI_DOI && caiDoi) {
    matchResult = BET_RESULT.WIN;
    betWin = 9;
  }
  if (gamePlayRecord.betRecordValue == BET_VALUE.BACARAT.CON_DOI && conDoi) {
    matchResult = BET_RESULT.WIN;
    betWin = 9;
  }
  if (gamePlayRecord.betRecordValue == BET_VALUE.BACARAT.CAI_LONGBAO && caiLongBao) {
    matchResult = BET_RESULT.WIN;
    betWin = betWinLongBao;
  }
  if (gamePlayRecord.betRecordValue == BET_VALUE.BACARAT.CON_LONGBAO && conLongBao) {
    matchResult = BET_RESULT.WIN;
    betWin = betWinLongBao;
  }
  if (matchResult == BET_RESULT.WIN) {
    winAmount = gamePlayRecord.betRecordAmountIn * (betWin + 1);
  }
  return winAmount;
}

function _generateResultBacarat() {
  let resultValue = '';
  let _bankerValue = '';
  let _playerValue = '';

  let la1Banker = utilFunctions.randomIntByMinMax(1, 13);
  let la2Banker = utilFunctions.randomIntByMinMax(1, 13);
  _bankerValue = la1Banker + ';' + la2Banker;
  let la1Player = utilFunctions.randomIntByMinMax(1, 13);
  let la2Player = utilFunctions.randomIntByMinMax(1, 13);
  _playerValue = la1Player + ';' + la2Player;

  let totalSecordPlayerValue = _getPointCard(la1Player) + _getPointCard(la2Player);
  totalSecordPlayerValue = _getPointCard(totalSecordPlayerValue);
  let la3Player = -1;
  //[Player] tong 2 la tu 0->5 thi rut them la 3
  if (totalSecordPlayerValue >= 0 && totalSecordPlayerValue <= 5) {
    la3Player = utilFunctions.randomIntByMinMax(1, 13);
    _playerValue = _playerValue + ';' + la3Player;
  }

  let totalSecordBankerValue = _getPointCard(la1Banker) + _getPointCard(la2Banker);
  totalSecordBankerValue = _getPointCard(totalSecordBankerValue);
  //[Banker] tong 2 la tu 0->2 thi rut them la 3
  if (totalSecordBankerValue >= 0 && totalSecordBankerValue <= 2) {
    let la3Banker = utilFunctions.randomIntByMinMax(1, 13);
    _bankerValue = _bankerValue + ';' + la3Banker;
  }
  //[Banker] tong 2 la bang 3 thi xet la thu 3 cua player
  if (totalSecordBankerValue == 3) {
    //la bai thu 3 cua player khac 8 thi rut them la 3
    if (la3Player > 0 && la3Player != 8) {
      let la3Banker = utilFunctions.randomIntByMinMax(1, 13);
      _bankerValue = _bankerValue + ';' + la3Banker;
    }
  }
  //[Banker] tong 2 la bang 4 thi xet la thu 3 cua player
  if (totalSecordBankerValue == 4) {
    //la bai thu 3 cua player la 2|3|4|5|6|7 thi rut them la 3
    if (la3Player > 1 && la3Player < 8) {
      let la3Banker = utilFunctions.randomIntByMinMax(1, 13);
      _bankerValue = _bankerValue + ';' + la3Banker;
    }
  }
  //[Banker] tong 2 la bang 5 thi xet la thu 3 cua player
  if (totalSecordBankerValue == 5) {
    //la bai thu 3 cua player la 4|5|6|7 thi rut them la 3
    if (la3Player > 3 && la3Player < 8) {
      let la3Banker = utilFunctions.randomIntByMinMax(1, 13);
      _bankerValue = _bankerValue + ';' + la3Banker;
    }
  }

  resultValue = _playerValue + '|' + _bankerValue;
  return resultValue;
}

function _getPointCard(laBai) {
  if (laBai <= 9) return laBai;
  if (laBai == 10 || laBai == 20 || laBai == 30) return 0;
  if (laBai == 11 || laBai == 21 || laBai == 31) return 1;
  if (laBai == 12 || laBai == 22 || laBai == 32) return 2;
  if (laBai == 13 || laBai == 23 || laBai == 33) return 3;
  if (laBai == 14 || laBai == 24 || laBai == 34) return 4;
  if (laBai == 15 || laBai == 25 || laBai == 35) return 5;
  if (laBai == 16 || laBai == 26 || laBai == 36) return 6;
  if (laBai == 17 || laBai == 27 || laBai == 37) return 7;
  if (laBai == 18 || laBai == 28 || laBai == 38) return 8;
  if (laBai == 19 || laBai == 29 || laBai == 39) return 9;
}

module.exports = {
  updateLatestGameResult,
  updateWinLoseResultForBetRecord,
};
