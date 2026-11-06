// Lab 5 (slide 26, 27): Value Object bằng nhau theo giá trị, Aggregate không cho vượt rào bất biến.
import { Money } from './src/wallets/domain/money.ts';
import { Wallet } from './src/wallets/domain/wallet.ts';
import { WalletTsPrivate } from './ts-private-demo.ts';

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
for (const bad of [10.5, -1, Number('9007199254740993')]) {
  try {
    Money.of(bad);
  } catch (error) {
    console.log(`Money.of(${bad}) -> ${error.code}`);
  }
}
// `private constructor` chỉ chặn lúc biên dịch; kiểm tra nằm trong constructor nên lúc chạy vẫn giữ được.
try {
  new Money(-5n);
} catch (error) {
  console.log(`new Money(-5n) -> ${error.code}`);
}

// Entity: nhận diện theo id, không theo thuộc tính.
const w1 = new Wallet(1, Money.of(500n));
const w2 = new Wallet(2, Money.of(500n));
console.log(`Entity: vi 1 va vi 2 cung so du ${w1.balance.equals(w2.balance)}, nhung cung vi? ${w1.id === w2.id}`);

// Aggregate: thử các đường vượt rào.
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
try {
  new Function('w', 'return w.#balance');
} catch (error) {
  console.log(`Aggregate: doc w.#balance ngoai class -> ${error.constructor.name}: ${error.message}`);
}
console.log(`Aggregate: Object.keys -> ${JSON.stringify(Object.keys(w1))}`);

// So sánh: field `private balance` của TypeScript, gán từ JS lúc chạy.
const leaky = new WalletTsPrivate();
leaky.balance = -1n;
console.log(`TS private (chi kiem luc bien dich): luc chay gan duoc so du = ${leaky.balance}`);
