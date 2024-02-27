/* Copyright (c) 2022-2023 Reminano */

var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
const Logger = require('../utils/logging');
const cheerio = require('cheerio');

async function _getHTMLPageLottery(tenTinh) {
  return new Promise(async (resolve, reject) => {
    try {
      const url = 'https://www.minhchinh.com';
      chai
        .request(url)
        .get(`/xo-so-${tenTinh}.html`)
        .end(function (err, res) {
          if (err) {
            Logger.error(err);
            reject('get html page error');
          }
          resolve(res);
        });
    } catch (e) {
      Logger.error('error', e);
      resolve('done error');
    }
  });
}
async function crawlLottery(tenTinh) {
  return new Promise(async (resolve, reject) => {
    try {
      const KQXS = {
        tenTinh: '',
        thu: '',
        ngayXoSo: '',
        ketqua: '',
      };
      if (tenTinh) {
        let formatTentinh = tenTinh === 'tphcm' ? `${tenTinh.slice(0, 2)}-${tenTinh.slice(2, tenTinh.length)}` : tenTinh.replace('_', '-');

        formatTentinh = formatTentinh === 'lam-dong' ? (formatTentinh = 'da-lat') : (formatTentinh = formatTentinh);

        let page = await _getHTMLPageLottery(formatTentinh);
        const pageLoad = cheerio.load(page.text);
        let pageBangKetQuaTinhMienNam = pageLoad('.box_kqxs').children('.bkqtinhmiennam');
        let bangKetQuaXoSo = pageBangKetQuaTinhMienNam[0].childNodes;
        let thongTinXoSo = await _layThongTinXoSo(bangKetQuaXoSo);
        let ketQuaXoso = await _layKetQuaXoso(bangKetQuaXoSo);

        KQXS.thu = thongTinXoSo.thu;
        KQXS.ngayXoSo = thongTinXoSo.ngayThangNam;
        KQXS.ketqua = ketQuaXoso;
        KQXS.tenTinh = formatTentinh;
        resolve(KQXS);
      } else {
        Logger.error('ten tinh must required');
        reject('error');
      }
    } catch (e) {
      Logger.error('error', e);
      reject('done error');
    }
  });
}

async function _layThongTinXoSo(bangKetQuaXoSo) {
  return new Promise(async (resolve, reject) => {
    try {
      let thongTinXoSo = {
        thu: '',
        ngayThangNam: '',
      };
      let thongTinTinh = bangKetQuaXoSo.filter(e => e.name === 'thead');

      thongTinTinh.forEach(e => {
        let cotThongTin = e.children;
        let cotThongTinFilter = cotThongTin.filter(ctt => ctt.name === 'tr');
        cotThongTinFilter.forEach(ctt => {
          let thuNgayThangXoSo = ctt.children.filter(el => el.name === 'td');
          thuNgayThangXoSo.forEach(item => {
            if (item.attribs.class === 'thu') {
              thongTinXoSo.thu = item.children[0].data;
            }
            if (item.attribs.class === 'tenbkqxs') {
              let thuNgayThangXoSoTagDiv = item.children[1].parent.children.filter(e => e.name === 'div');
              let ngayXoSo = thuNgayThangXoSoTagDiv.filter(e => e.attribs.class === 'ngaykqxs');
              ngayXoSo.forEach(e => {
                let date = e.children[0].children[0].children[0];
                let ngayThang = date.children[0].data;
                let formatNgayThang = ngayThang.split('/').reverse().join('-');
                let nam = date.next.children[0].data;
                thongTinXoSo.ngayThangNam = `${nam}-${formatNgayThang}`;
              });
            }
          });
        });
      });
      resolve(thongTinXoSo);
    } catch (e) {
      Logger.error('error', e);
      reject('done error');
    }
  });
}

async function _layKetQuaXoso(bangKetQuaXoSo) {
  return new Promise(async (resolve, reject) => {
    try {
      let ketQuaXoso = '';
      let listKetQuaXoSo = bangKetQuaXoSo.filter(e => e.name === 'tbody');
      listKetQuaXoSo.forEach(e => {
        let cotGiaiThuong = e.children;
        let cotKetQuaXoSoFilter = cotGiaiThuong.filter(e => e.name === 'tr');
        cotKetQuaXoSoFilter.forEach(kq => {
          let ketQuaXoSo = kq.children;
          let ketQuaXoSoFilter = ketQuaXoSo.filter(el => el.name === 'td');
          ketQuaXoSoFilter.forEach(item => {
            if (!item.attribs.class.includes('ten_giai')) {
              // chi lay ket qua
              item.children.forEach(kqxs => {
                ketQuaXoso += `${kqxs.attribs.data};`;
              });
            }
          });
        });
      });
      ketQuaXoso = ketQuaXoso.slice(0, -1);
      resolve(ketQuaXoso);
    } catch (e) {
      Logger.error('error', e);
      reject('done error');
    }
  });
}

module.exports = {
  crawlLottery,
};
