// Lab 1 (slide 15): controller trả thẳng Entity cho client thì chuyện gì xảy ra? Đo bằng HTTP thật.
import { createServer } from 'node:http';
import { Money } from './src/wallets/domain/money.ts';
import { Wallet } from './src/wallets/domain/wallet.ts';

// Dòng kiểu Prisma: balance là bigint như Hub. riskScore, version là field nội bộ minh họa, Hub không có.
const walletRow = { id: 7, storeId: 3, balance: 1500000n, riskScore: 87, version: 4 };

// Mapper: chỉ những field API hứa trả mới đi qua ranh giới.
const toWalletDto = (w) => ({ id: w.id, storeId: w.storeId, balance: String(w.balance) });

const routes = {
  '/prisma-row': () => walletRow,
  '/prisma-row-to-json-patch': () => {
    // "Sửa nhanh" hay gặp trên mạng: dạy bigint tự thành chuỗi.
    BigInt.prototype.toJSON = function () {
      return this.toString();
    };
    return walletRow;
  },
  // Entity của lab: số dư là field #private nên JSON không thấy, không lỗi nào báo.
  '/domain-entity': () => new Wallet(7, Money.of(1500000n)),
  '/dto': () => toWalletDto(walletRow),
};

const server = createServer((req, res) => {
  try {
    const body = JSON.stringify(routes[req.url]());
    res.writeHead(200, { 'content-type': 'application/json' }).end(body);
  } catch (error) {
    res.writeHead(500, { 'content-type': 'application/json' }).end(JSON.stringify({ loi: error.message }));
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

for (const path of Object.keys(routes)) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`);
  console.log(`GET ${path} -> ${response.status} ${await response.text()}`);
}
delete BigInt.prototype.toJSON;
server.close();
