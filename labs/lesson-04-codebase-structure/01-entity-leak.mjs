// Lab 1 (slide 15): controller trả thẳng Entity cho client thì chuyện gì xảy ra? Đo bằng HTTP thật.
import { createServer } from 'node:http';

// Dòng DB giả lập đúng hình dạng Wallet trong Hub: balance là bigint (Prisma BigInt).
const walletRow = { id: 7, storeId: 3, balance: 1500000n, riskScore: 87, version: 4 };

// Mapper: chỉ những field API hứa trả mới đi qua ranh giới.
const toWalletDto = (w) => ({ id: w.id, storeId: w.storeId, balance: String(w.balance) });

const routes = {
  '/entity': () => walletRow,
  '/entity-to-json-patch': () => {
    // "Sửa nhanh" hay gặp trên mạng: dạy bigint tự thành chuỗi.
    BigInt.prototype.toJSON = function () {
      return this.toString();
    };
    return walletRow;
  },
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

for (const path of ['/entity', '/entity-to-json-patch', '/dto']) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`);
  console.log(`GET ${path} -> ${response.status} ${await response.text()}`);
}
delete BigInt.prototype.toJSON;
server.close();
