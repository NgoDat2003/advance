// Lab 5 (slide 26, 27): Value Object bằng nhau theo giá trị, Aggregate không cho vượt rào bất biến.
import { Money } from './src/wallets/domain/money.ts';
import { Wallet } from './src/wallets/domain/wallet.ts';

const a = Money.of(100n);
const b = Money.of(100n);
console.log(`Money: a === b -> ${a === b}; a.equals(b) -> ${a.equals(b)}`);

try {
  a.minor = 999n;
} catch (error) {
  console.log(`Money: gan a.minor -> ${error.constructor.name}: ${error.message}`);
}

console.log(`Vi sao khong dung number: 0.1 + 0.2 = ${0.1 + 0.2}`);
console.log(`So lon: 9007199254740993 khi la number = ${Number('9007199254740993')}; khi la bigint = ${BigInt('9007199254740993')}`);
for (const bad of [10.5, -1]) {
  try {
    Money.of(bad);
  } catch (error) {
    console.log(`Money.of(${bad}) -> ${error.code}`);
  }
}

// Entity: nhận diện theo id, không theo thuộc tính.
const w1 = new Wallet(1, Money.of(500n));
const w2 = new Wallet(2, Money.of(500n));
console.log(`Entity: vi 1 va vi 2 cung so du ${w1.balance.equals(w2.balance)}, nhung cung vi? ${w1.id === w2.id}`);

// Aggregate: thử 3 đường vượt rào.
try {
  w1.debit(Money.of(600n));
} catch (error) {
  console.log(`Aggregate: debit qua so du -> ${error.code}; so du van ${w1.balance}`);
}
try {
  w1.balance = Money.of(9999n);
} catch (error) {
  console.log(`Aggregate: gan w.balance -> ${error.constructor.name}: ${error.message}`);
}
console.log(`Aggregate: doc w['#balance'] -> ${w1['#balance']}; Object.keys -> ${JSON.stringify(Object.keys(w1))}`);

// So sánh: `private` của TypeScript chỉ tồn tại lúc biên dịch, chạy thật thì ai cũng sửa được.
class WalletTsPrivate {
  /* private */ balance = 500n;
}
const leaky = new WalletTsPrivate();
leaky.balance = -1n;
console.log(`TS private (chi luc bien dich): gan duoc so du = ${leaky.balance}`);
