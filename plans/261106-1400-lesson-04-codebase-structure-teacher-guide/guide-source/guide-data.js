/* === GUIDE_DATA_START === */
var SLIDES = [
  { n: 1, title: 'Codebase Structure', href: '#cach-hoc', chip: null },
  { n: 2, title: 'Outline', href: '#cach-hoc', chip: null },
  { n: 3, title: 'Problems', href: '#cach-hoc', chip: null },
  { n: 4, title: '1. Architectural Patterns', href: '#chang-1', chip: null },
  { n: 5, title: 'Flow of Control', href: '#chang-1', chip: 'Đúng' },
  { n: 6, title: '1.1. Layer Architecture', href: '#sl-6', chip: 'Đúng một phần' },
  { n: 7, title: 'Layer: tầng mở', href: '#chang-1', chip: 'Đúng' },
  { n: 8, title: 'Layer: ưu, nhược', href: '#sl-8', chip: 'Đúng' },
  { n: 9, title: '1.2. Hexagonal', href: '#chang-2', chip: 'Đúng' },
  { n: 10, title: 'Hexagonal: ưu, nhược', href: '#sl-10', chip: 'Đúng' },
  { n: 11, title: '1.3. Onion', href: '#chang-2', chip: 'Đúng' },
  { n: 12, title: 'Onion: ưu, nhược', href: '#chang-2', chip: 'Đúng' },
  { n: 13, title: '1.4. Clean', href: '#chang-3', chip: 'Đúng' },
  { n: 14, title: 'Explicit Architecture', href: '#chang-3', chip: 'Đúng' },
  { n: 15, title: 'Crossing Boundary: DTO', href: '#sl-15', chip: 'Cần sửa' },
  { n: 16, title: 'Crossing Boundary: Repository', href: '#chang-3', chip: 'Đúng' },
  { n: 17, title: 'Clean: khi nào dùng', href: '#sl-17', chip: 'Đúng một phần' },
  { n: 18, title: '1.5. Functional', href: '#chang-4', chip: 'Đúng' },
  { n: 19, title: 'Functional: ưu, nhược', href: '#sl-19', chip: 'Đúng' },
  { n: 20, title: '2. Project Structure', href: '#chang-5', chip: null },
  { n: 21, title: 'How to divide domains?', href: '#sl-21', chip: null },
  { n: 22, title: '3. Domain Driven Design', href: '#chang-5', chip: null },
  { n: 23, title: '3.1. Introduction', href: '#chang-5', chip: 'Đúng' },
  { n: 24, title: '3.2. Bounded Context', href: '#chang-5', chip: 'Đúng' },
  { n: 25, title: '3.2. Collaborative Modeling', href: '#chang-5', chip: 'Đúng' },
  { n: 26, title: 'Tactical: Entity, Value Object', href: '#chang-6', chip: 'Đúng' },
  { n: 27, title: 'Tactical: Aggregate, Service, Repository', href: '#sl-27', chip: 'Đúng' },
  { n: 28, title: 'Key Terms in DDD', href: '#chang-6', chip: 'Đúng' },
  { n: 29, title: '3.4. Layers', href: '#sl-29', chip: 'Cần sửa' },
  { n: 30, title: 'Recap', href: '#chang-7', chip: 'Đúng' },
  { n: 31, title: 'References', href: '#tham-khao', chip: null },
  { n: 32, title: 'Homework', href: '#bai-tap', chip: 'Đúng' },
  { n: 33, title: 'Thank you', href: '#sl-33', chip: null }
];

var QUIZ = {
  1: [
    { q: 'Sơ đồ slide 5 vẽ luồng chạy đi từ UI, qua lõi, sang hạ tầng rồi quay về. Clean Architecture đổi điều gì trong hình này?', opts: ['Bỏ bước gọi sang hạ tầng', 'Không đổi luồng chạy, chỉ đổi chiều import trong source', 'Đảo luồng chạy, để DB gọi vào lõi', 'Bắt mọi lời gọi đi qua message queue'], ans: 1, why: 'Lúc chạy lõi vẫn phải lưu dữ liệu. Thứ đảo là chiều phụ thuộc trong source (Lab 3 kiểm chiều này).' },
    { q: 'Controller gọi thẳng repository vì "service chỉ chuyển tiếp, thừa". Trong layered đóng, đó là gì?', opts: ['Được phép nếu service rỗng', 'Vi phạm, vì tầng đóng không được nhảy cóc; chỉ tầng mở mới bỏ qua được', 'Bắt buộc phải làm vậy', 'Chỉ sai khi có transaction'], ans: 1, why: 'Slide 6: tầng đóng không được bỏ qua. Slide 7: chỉ tầng khai báo là "open" mới được đi qua. Nếu cả tầng service chỉ chuyển tiếp, hãy cân nhắc khai báo mở tầng đó thay vì để mỗi nơi tự nhảy.' },
    { q: 'Slide 8 ghi layered "khó scale". Nên hiểu thế nào?', opts: ['Layered chịu tải kém hơn Clean', 'Cả khối chạy chung một process nên chỉ nhân bản được toàn bộ, không scale riêng từng phần; Clean chung process cũng vậy', 'Không chạy được nhiều instance', 'DB không shard được'], ans: 1, why: 'Vẫn nhân bản được cả khối, nên C sai. Cách chia thư mục không đổi đơn vị triển khai, nên A sai. Slide không nói rõ loại scale, đây là cách đọc hợp lý.' },
    { q: 'Lab 8: một endpoint chuyển tiền là 39 dòng spaghetti, 168 dòng ở 4 tầng. Kết luận nào hợp lý nhất?', opts: ['4 tầng luôn tệ hơn', 'Luôn phải dùng 4 tầng', 'Có chi phí trả trước; chỉ đáng khi nghiệp vụ đủ nhiều và đủ quan trọng', 'Số dòng không liên quan gì tới chi phí'], ans: 2, why: 'Đó là lý do slide 17 có mục "không nên dùng". Lab chỉ đo chi phí, không đo được lợi ích dài hạn.' }
  ],
  2: [
    { q: 'Port là gì trong code TypeScript của lab?', opts: ['Cổng mạng của server', 'Interface do lõi tự định nghĩa, ví dụ WalletRepository', 'Class PrismaService', 'Một module của Nest'], ans: 1, why: 'Slide 9: Port là interface, Adapter là cài đặt. Điểm mấu chốt là lõi đặt ra interface theo nhu cầu của nó.' },
    { q: 'Kafka consumer nhận event rồi gọi use case. Nó là adapter phía nào?', opts: ['Driven, vì Kafka là hạ tầng', 'Driving, vì nó khởi xướng lời gọi vào lõi', 'Không phải adapter', 'Cả hai, không phân biệt được'], ans: 1, why: 'Phân loại theo ai khởi xướng, không theo công nghệ. Consumer gọi vào lõi nên là driving; producer được lõi gọi ra nên là driven, dù cùng là Kafka.' },
    { q: 'Adapter thiếu khóa trong Lab 4 qua 4 ca tuần tự và rớt ca đồng thời. Rút ra điều gì?', opts: ['Bộ kiểm quá khó', 'Test tuần tự không chứng minh được adapter an toàn đồng thời; hợp đồng phải có ca đồng thời', 'Chỉ cần tăng số ca tuần tự', 'Adapter trong RAM là đủ để thay DB khi test'], ans: 1, why: 'Lab 4: vi1=990 thay vì 700 và but_toan=60, trong khi 4 ca còn lại PASS.' },
    { q: 'Hub đổi từ Prisma sang driver pg thuần. Với kiến trúc port đúng, cần sửa những gì?', opts: ['Domain, application và controller', 'Chỉ adapter và chỗ nối dây; rồi chạy lại bộ kiểm hợp đồng', 'Chỉ cần đổi biến môi trường', 'Không sửa gì cả'], ans: 1, why: 'Lab 4 đổi adapter mà không sửa domain hay use case. "Dễ đổi" chỉ tính sau khi adapter mới qua hết bộ kiểm.' }
  ],
  3: [
    { q: 'File domain/wallet.ts có dòng import type { Prisma } from "@prisma/client". Chỉ là type, biến mất lúc chạy. Có vi phạm không?', opts: ['Không, vì lúc chạy không còn', 'Có, vì domain vẫn phụ thuộc vào chi tiết của Prisma ở source; nâng Prisma có thể phải sửa domain', 'Chỉ vi phạm khi deploy', 'Không, vì type không phải code'], ans: 1, why: 'Quy tắc nói về phụ thuộc trong source. Máy quét trong lab cũng tính import type, vì đổi kiểu của Prisma vẫn buộc domain sửa theo.' },
    { q: 'Lab 1: gắn BigInt.prototype.toJSON giúp endpoint trả Entity đạt 200. Vấn đề còn lại là gì?', opts: ['Không còn vấn đề', 'Mọi field của Entity lọt ra API, lab thấy riskScore và version bị lộ', 'Status vẫn là 500', 'Số dư sai'], ans: 1, why: 'Lab 1 dòng 2. DTO là danh sách trắng: field mới không tự lọt ra ngoài.' },
    { q: 'Bạn đặt DTO của API trong tầng domain theo đúng chữ slide 15. Hệ quả?', opts: ['Tốt hơn vì gần Entity', 'Domain bắt đầu đổi theo hình dạng API; DTO nên nằm ở application', 'Không có hệ quả', 'Không biên dịch được'], ans: 1, why: 'Domain không được biết nhu cầu của từng client. Sơ đồ Clean trên slide cũng đặt Input/Output Port ở vòng use case.' },
    { q: 'Sản phẩm mới: một admin tool 1 người, chủ yếu CRUD, sống 6 tháng. Nên làm gì?', opts: ['Clean 4 tầng để sau này dễ mở rộng', 'Tổ chức theo module, mỗi module controller và service mỏng; chỉ nâng cấp khi có bất biến thật', 'Không tổ chức gì', 'Tách microservice ngay'], ans: 1, why: 'Đúng trường hợp "không nên dùng" của slide 17. Clean là chi phí trả trước, không phải dấu hiệu của code tốt.' }
  ],
  4: [
    { q: 'Hàm nào thuần?', opts: ['const f = (a) => a + Date.now()', 'const f = (a, now) => a + now', 'const f = async (id) => db.find(id)', 'const f = (a) => { console.log(a); return a; }'], ans: 1, why: 'Chỉ bản nhận now làm tham số là cùng đầu vào, cùng đầu ra và không có tác dụng phụ. console.log cũng là tác dụng phụ.' },
    { q: 'Domain cần id cho giao dịch mới. Làm thế nào?', opts: ['Gọi randomUUID() ngay trong Entity', 'Nhận id từ ngoài; use case lấy qua hàm được tiêm vào', 'Để DB sinh rồi đọc lại trong Entity', 'Dùng biến toàn cục'], ans: 1, why: 'Trong lab, TransferFunds nhận newId qua constructor nên test cố định được id; domain chỉ nhận transferId.' },
    { q: 'Lab 2: use case + adapter RAM gấp domain x6.1 ở nhánh thành công nhưng chỉ vài µs mỗi ca; qua HTTP gấp x64 ở nhánh từ chối. Kết luận?', opts: ['Phải bỏ tầng use case vì chậm', 'Trong lab, mạng là bước đắt nhất; use case với adapter RAM vẫn đủ rẻ để phủ các nhánh logic', 'Không nên test qua HTTP bao giờ', 'Adapter RAM thay được test trên DB thật'], ans: 1, why: 'Vẫn cần một ít test HTTP cho status và mapping lỗi, và cần test trên DB thật cho khóa. DB thật chưa đo trong lab này.' },
    { q: 'Vì sao kiểm được 90601 tổ hợp mà không cần mock nào trong Lab 6?', opts: ['Vì dùng framework test mạnh', 'Vì lõi không có phụ thuộc nên không có gì để mock', 'Vì chạy song song', 'Vì đã có sẵn DB'], ans: 1, why: 'Đây là lợi ích chính của lõi thuần: test hết đầu vào rẻ tới mức chạy được hàng chục nghìn ca.' }
  ],
  5: [
    { q: 'Module vouchers cần biết ví còn bao nhiêu. Cách nào giữ đúng ranh giới nhất?', opts: ['SELECT thẳng bảng wallets', 'Gọi use case hoặc port do wallets cung cấp', 'Chép bảng wallets sang vouchers', 'Bỏ ranh giới cho nhanh'], ans: 1, why: 'Tín hiệu 4: wallets là chủ dữ liệu. Đọc thẳng bảng khiến đổi schema ví sẽ làm hỏng vouchers mà không ai biết.' },
    { q: 'Hai nhóm dùng chữ "order": bếp hiểu là phiếu chế biến, kế toán hiểu là chứng từ doanh thu. Nên làm gì?', opts: ['Một class Order chứa mọi field', 'Mỗi context một model riêng, có thể cùng tên, nối với nhau bằng id', 'Đổi hết thành Order1 và Order2', 'Bắt một nhóm đổi cách nói'], ans: 1, why: 'Đây đúng ví dụ "credit" của slide 24. Từ đổi nghĩa là tín hiệu rõ nhất để cắt context.' },
    { q: 'Vì sao nên chia thư mục theo nghiệp vụ trước, theo tầng sau?', opts: ['Vì ít file hơn', 'Vì một tính năng nằm gọn một chỗ và dễ bê đi khi tách service', 'Vì chạy nhanh hơn', 'Vì NestJS bắt buộc'], ans: 1, why: 'Slide 20 để trống phần này. Lộ trình v3.0 của Hub tách service theo module nên cách này đỡ tốn công nhất.' },
    { q: 'Đã vẽ được 5 bounded context. Có nên tách 5 microservice ngay không?', opts: ['Có, context nào service nấy', 'Không nhất thiết; context là ranh giới logic, có thể sống chung một process tới khi có lý do', 'Có, để dễ học', 'Không bao giờ được tách'], ans: 1, why: 'Slide 24 chỉ nói context hoạt động độc lập được. Tách process thêm chi phí mạng, Saga, vận hành; Hub để việc đó tới Cụm 5.' }
  ],
  6: [
    { q: 'Hai object Money cùng 100, a === b trả false. Vậy phải so bằng gì?', opts: ['Vẫn dùng ===', 'a.equals(b), vì Value Object bằng nhau theo giá trị', 'So bằng id', 'JSON.stringify, vì luôn an toàn'], ans: 1, why: 'Lab 5 dòng 1. Value Object không có id nên so giá trị.' },
    { q: 'Quy tắc "ví cửa hàng không được âm" (I-03) nên đặt ở đâu trong Hub v2.0?', opts: ['Chỉ ở CHECK của DB', 'Chỉ trong use case', 'Trong Wallet.debit theo loại ví, và vẫn giữ CHECK ở DB làm lưới cuối', 'Trong controller'], ans: 2, why: 'Domain từ chối sớm với mã lỗi nghiệp vụ, DB chặn nếu có đường ghi bỏ qua domain. Phải theo loại ví, vì TREASURY được phép âm.' },
    { q: 'Chuyển tiền sửa 2 Aggregate Wallet. Sách khuyên mỗi transaction một Aggregate. Hub làm thế nào?', opts: ['Dùng Saga ngay', 'Domain Service + một transaction DB, khóa theo thứ tự id, vì tiền phải cùng commit', 'Bỏ sổ cái kép', 'Sửa 2 ví ở 2 transaction'], ans: 1, why: 'Bất biến sổ cái cần nhất quán tức thì và cả hai ví chung DB, kể cả ở v3.0 (omnipos_wallet). Saga dành cho luồng order sang wallet, khi dữ liệu thật sự nằm ở hai DB.' },
    { q: 'Repository.save(wallet) ghi số dư tuyệt đối. Khi nào an toàn?', opts: ['Luôn an toàn', 'Khi đang giữ khóa từ lúc đọc, hoặc ghi có điều kiện version; nếu không sẽ mất cập nhật', 'Khi dùng BigInt', 'Khi có index'], ans: 1, why: 'Không có cả hai thì thành cách B của Lab 14.01, hoặc adapter thiếu khóa của Lab 4: 30 lệnh mà ví chỉ giảm 10.' }
  ],
  7: [
    { q: 'constructor(private prisma: PrismaService). Câu nào đúng?', opts: ['Đã có cả DI và DIP', 'Có DI, chưa có DIP, vì file vẫn phụ thuộc class Prisma cụ thể', 'Không có DI', 'Có DIP, chưa có DI'], ans: 1, why: 'Có tiêm từ ngoài vào, nên test dùng được bản giả. Nhưng dòng import vẫn hướng ra hạ tầng, và Lab 7 cho thấy bản giả phải bắt chước đúng API của Prisma.' },
    { q: 'Vì sao @Inject(WalletRepository) với WalletRepository là interface không chạy được trong Nest?', opts: ['Nest cấm interface', 'interface biến mất lúc chạy, nên không còn giá trị làm token', 'Vì thiếu decorator', 'Vì TypeScript chạy chậm'], ans: 1, why: 'Lab 7 dòng cuối: sau khi bỏ kiểu chỉ còn Symbol. Vì vậy dùng token Symbol hoặc chuỗi.' },
    { q: 'Trong transferLocked, catch SQLSTATE 23514 đổi thành INSUFFICIENT_FUNDS. Sau refactor nó về đâu?', opts: ['Domain', 'Adapter infrastructure, vì mã SQLSTATE là chi tiết của DB; adapter dịch thành lỗi nghiệp vụ', 'Controller', 'Bỏ hẳn'], ans: 1, why: 'Domain không được biết 23514. Adapter ném DomainError, presentation đổi thành 409.' },
    { q: 'Hiện tại nên làm gì với Hub sau khi học xong bài này?', opts: ['Refactor ngay mọi module', 'Giữ nguyên tới Pha B, lấy số "trước" từ checks M1, chỉ refactor các module có bất biến theo ADR-008, rồi so lại', 'Viết lại từ đầu', 'Không bao giờ refactor'], ans: 1, why: 'Refactor là đổi cấu trúc, không đổi hành vi. Không có số trước thì không chứng minh được điều đó.' }
  ]
};

var SORTERS = {
  scan: {
    intro: 'Mỗi dòng là một import trong một tầng. Dựa vào bảng ALLOWED, chọn trước rồi bấm Chấm.',
    options: ['Hợp lệ', 'Vi phạm'],
    items: [
      { t: 'domain/wallet.ts → ./money.ts', a: 'Hợp lệ', why: 'Domain import domain.' },
      { t: 'domain/voucher.ts → @prisma/client', a: 'Vi phạm', why: 'Domain không được import gói ngoài.' },
      { t: 'application/transfer-funds.ts → ../domain/money.ts', a: 'Hợp lệ', why: 'Application hướng vào domain.' },
      { t: 'application/claim-voucher.ts → @nestjs/common', a: 'Vi phạm', why: 'Application dính framework. Nhiều team chấp nhận điều này, nhưng máy quét của lab thì không.' },
      { t: 'application/claim-voucher.ts → ../presentation/claim-response.dto.ts', a: 'Vi phạm', why: 'Hướng ra ngoài. DTO nên chuyển vào application.' },
      { t: 'infrastructure/voucher-prisma.repository.ts → @prisma/client', a: 'Hợp lệ', why: 'Đây đúng là nơi được biết Prisma.' },
      { t: 'infrastructure/voucher-prisma.repository.ts → ../domain/voucher.ts', a: 'Hợp lệ', why: 'Hạ tầng phụ thuộc domain: chiều đã đảo.' },
      { t: 'presentation/vouchers.controller.ts → ../infrastructure/voucher-prisma.repository.ts', a: 'Vi phạm', why: 'Controller nhảy cóc qua use case.' },
      { t: 'presentation/transfer-http-handler.ts → ../application/transfer-funds.ts', a: 'Hợp lệ', why: 'Adapter vào gọi use case.' }
    ]
  },
  hub: {
    intro: 'Đoạn code lấy từ wallets.service.ts của Hub. Chọn tầng đích theo cheat sheet.',
    options: ['domain', 'application', 'infrastructure', 'presentation', 'module (nối dây)'],
    items: [
      { t: 'if (this.mode === "naive") … else …', a: 'module (nối dây)', why: 'Hai nhánh này thực chất là hai adapter. Chọn adapter theo M1_IMPL là việc của provider.' },
      { t: 'prisma.$transaction(…, this.txOptions)', a: 'infrastructure', why: 'Application chỉ gọi repo.transaction(work); Prisma và timeout nằm trong adapter.' },
      { t: 'SELECT … ORDER BY id ASC FOR UPDATE (I-07)', a: 'infrastructure', why: 'Thành lockMany. Thứ tự khóa chống deadlock là chi tiết của DB.' },
      { t: 'if (locked.length !== 2) → không đủ ví', a: 'application', why: 'Kiểm tìm đủ dữ liệu là bước điều phối. Use case ném DomainError, không dùng NotFoundException.' },
      { t: 'fromRow.balance < amountBig → thiếu tiền', a: 'domain', why: 'Thành Wallet.debit. Đây là quy tắc nghiệp vụ thật sự, và phải xét loại ví vì TREASURY được phép âm (I-03).' },
      { t: 'Tạo 2 bút toán -amount, +amount (I-01)', a: 'domain', why: 'Domain tạo ra các entry; adapter chỉ lưu chúng.' },
      { t: 'tx.ledgerEntry.createMany(…)', a: 'infrastructure', why: 'Thành appendLedger trong adapter.' },
      { t: 'catch sqlState(e) === "23514"', a: 'infrastructure', why: 'SQLSTATE là chi tiết DB; adapter dịch thành DomainError.' },
      { t: 'new ConflictException("INSUFFICIENT_FUNDS")', a: 'presentation', why: 'Domain chỉ ném mã lỗi. Đổi sang HTTP 409 là việc của controller hoặc filter.' },
      { t: 'Gọi hàm sinh id để lấy transferId, ngay trước khi ghi', a: 'application', why: 'Use case gọi hàm được tiêm vào, như newId trong lab. Chính hàm randomUUID thì truyền vào ở module.' }
    ]
  },
  flight: {
    intro: 'Đặt vé máy bay. Mỗi class về tầng nào? (Slide 32)',
    options: ['domain', 'application', 'infrastructure', 'presentation'],
    items: [
      { t: 'Booking (giữ ghế, chặn hủy vé đã bay)', a: 'domain', why: 'Aggregate Root.' },
      { t: 'Seat (chỉ truy cập qua Booking)', a: 'domain', why: 'Entity con trong Aggregate.' },
      { t: 'Money, FlightId', a: 'domain', why: 'Value Object. FlightId thay vì copy cả Flight từ context khác.' },
      { t: 'FareCalculator (tính giá theo hạng ghế và ngày bay)', a: 'domain', why: 'Domain Service: quy tắc nghiệp vụ, không state, không I/O.' },
      { t: 'interface BookingRepository', a: 'domain', why: 'Slide 27: port repository ở domain.' },
      { t: 'BookFlightUseCase', a: 'application', why: 'Điều phối: tính giá, tạo Booking, thanh toán, lưu.' },
      { t: 'BookFlightCommand, BookFlightResult', a: 'application', why: 'DTO ở ranh giới use case.' },
      { t: 'interface PaymentGateway', a: 'application', also: ['domain'], why: 'Port để điều phối hệ thống ngoài. Đặt ở domain cũng được, miễn không nằm ở infrastructure.' },
      { t: 'PrismaBookingRepository', a: 'infrastructure', why: 'Adapter driven.' },
      { t: 'StripePaymentGateway', a: 'infrastructure', why: 'Adapter driven.' },
      { t: 'BookingsController', a: 'presentation', why: 'Adapter driving.' }
    ]
  }
};

var EXAM = [
  { q: '1. Quy tắc phụ thuộc là gì, và kiểm tra nó bằng cách nào?', a: 'Dòng import trong source chỉ được hướng vào trong: domain không biết application, application không biết hạ tầng và framework. Luồng chạy vẫn đi ra DB; thứ đảo là chiều import. Kiểm được bằng máy: Lab 3 chỉ cần đọc import và đối chiếu một bảng, 0 vi phạm trên bản sạch, 5 trên bản AI. Có thể đưa nó vào CI.' },
  { q: '2. Layered, Hexagonal, Onion, Clean khác nhau chỗ nào?', a: 'Layered có đáy là database, nên business phụ thuộc persistence. Hexagonal nói về rìa: port và adapter, chia driving và driven. Onion nói về các vòng bên trong với domain ở tâm. Clean, theo chính slide 13, là gói lại các ý đó. Ba cái sau chung một luật, còn số tầng không quan trọng.' },
  { q: '3. DI và DIP khác nhau thế nào? Cho ví dụ.', a: 'DI là kỹ thuật đưa dependency từ ngoài vào. DIP là nguyên tắc về chiều phụ thuộc: tầng cao không phụ thuộc tầng thấp, cả hai phụ thuộc vào hợp đồng do tầng cao đặt ra. constructor(prisma: PrismaService) có DI, nên test vẫn tiêm bản giả được. Nhưng không có DIP: service gọi tên class Prisma, và bản giả phải bắt chước wallet.findUnique. Dùng interface ở tầng trong và token trong Nest thì có cả hai.' },
  { q: '4. Bạn có dùng Clean Architecture cho mọi dự án không?', a: 'Không. Lab 8 đo: 39 dòng thành 168 dòng cho một endpoint. Tôi áp dụng theo module: module có bất biến tiền bạc, nhiều nhánh từ chối thì chia tầng; CRUD thì giữ mỏng. Dự án của tôi do một người làm, vẫn chia tầng cho các module tiền bạc vì sai là mất tiền, và cũng vì mục tiêu học; tôi không coi đó là nhu cầu của mọi dự án cùng cỡ.' },
  { q: '5. Có adapter trong RAM rồi, còn cần test với DB thật không?', a: 'Có. Lab 4: adapter thiếu khóa qua cả 4 ca tuần tự, chỉ lộ ở ca đồng thời, ví còn 990 thay vì 700. Adapter RAM chứng minh được logic, không chứng minh được khóa, index hay isolation. Mỗi adapter thật phải chạy cùng một bộ kiểm hợp đồng, có cả ca đồng thời.' },
  { q: '6. Entity, Value Object, Aggregate khác nhau ra sao? Ví dụ trong ví điện tử.', a: 'Entity có id và vòng đời: Wallet. Value Object không id, bất biến, bằng nhau theo giá trị: Money. Aggregate là cụm phải nhất quán, chỉ sửa qua root: mọi thay đổi số dư đi qua Wallet.debit và credit. Lab 5 cho thấy TypeScript private không chặn lúc chạy, còn #balance thì có. Nếu có ví được phép âm như TREASURY, số dư không dùng chung kiểu với số tiền không âm.' },
  { q: '7. Chuyển tiền sửa 2 ví. Có vi phạm "mỗi transaction một Aggregate" không?', a: 'Có, và tôi chấp nhận có chủ đích. Sổ cái kép cần cả hai ví cùng commit, cả hai đang chung một DB. Tôi dùng Domain Service và một transaction, khóa theo thứ tự id để tránh deadlock. Saga chỉ đáng trả giá khi dữ liệu thực sự nằm ở hai DB, vì lúc đó phải xử lý trạng thái trung gian và bù trừ.' },
  { q: '8. Review một PR: use case có if (departureAt - now < 2h) và controller trả thẳng Booking. Bạn góp ý gì?', a: 'Quy tắc giờ bay chuyển vào Booking, ví dụ booking.confirm(now), và now truyền vào để test được. Use case chỉ điều phối. Controller trả DTO để field nội bộ không lọt ra và hợp đồng API không đổi theo Entity. Lab 1 đã đo: dòng Prisma có bigint gây 500, vá bằng toJSON thì lộ field nội bộ, còn Entity có field #private thì mất số dư mà không báo lỗi. Thêm máy quét import vào CI, nhưng lỗi if thì máy không bắt được, phải có người review.' }
];
/* === GUIDE_DATA_END === */

(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* chế độ riêng tư: bỏ qua, trang vẫn chạy */ } }
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const run = (id) => { try { return JSON.parse($('#run-' + id).textContent); } catch { return null; } };
  const press = (group, btn) => { $$('[aria-pressed]', group).forEach((b) => b.setAttribute('aria-pressed', String(b === btn))); };

  // Giao diện sáng/tối
  const theme = store.get('l04-theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  $('#themeBtn')?.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('l04-theme', next);
  });

  // Ô điền tay: chỉ dùng khóa l04-*
  $$('[data-store]').forEach((el) => {
    const key = el.dataset.store;
    if (!key.startsWith('l04-')) return;
    el.value = store.get(key) ?? '';
    el.addEventListener('input', () => store.set(key, el.value));
  });

  // Quiz
  $$('.quiz[data-quiz]').forEach((box) => {
    const n = box.dataset.quiz;
    const qs = QUIZ[n];
    if (!qs) return;
    let score = 0, answered = 0;
    box.innerHTML = `<div class="quiz-head"><h4>Tự kiểm tra chặng ${n}</h4><span class="quiz-score num" aria-live="polite">0/${qs.length}</span></div>` +
      qs.map((x, i) => {
        const order = x.opts.map((_, j) => j).sort(() => Math.random() - 0.5);
        return `<div class="q" data-i="${i}"><p class="q-text">${i + 1}. ${esc(x.q)}</p><div class="q-opts">${order.map((j) => `<button type="button" class="q-opt" data-j="${j}">${esc(x.opts[j])}</button>`).join('')}</div></div>`;
      }).join('');
    $$('.q', box).forEach((qel) => {
      const x = qs[+qel.dataset.i];
      $$('.q-opt', qel).forEach((btn) => btn.addEventListener('click', () => {
        const j = +btn.dataset.j;
        $$('.q-opt', qel).forEach((b) => { b.disabled = true; if (+b.dataset.j === x.ans) b.classList.add('right'); });
        if (j === x.ans) score++; else btn.classList.add('wrong');
        answered++;
        const ex = document.createElement('div');
        ex.className = 'q-explain';
        ex.innerHTML = `<strong>${j === x.ans ? 'Đúng.' : 'Chưa đúng.'}</strong> ${esc(x.why)}`;
        qel.appendChild(ex);
        $('.quiz-score', box).textContent = `${score}/${qs.length}${answered === qs.length ? (score === qs.length ? ' · Đạt' : ' · Xem lại phần sai') : ''}`;
      }));
    });
  });

  // Phỏng vấn + bản đồ slide
  const exam = $('#examList');
  if (exam) exam.innerHTML = EXAM.map((e) => `<details class="fold"><summary>${esc(e.q)}</summary><div class="fold-body"><p>${esc(e.a)}</p></div></details>`).join('');
  const chipClass = { 'Đúng': 'ok', 'Đúng một phần': 'diff', 'Cần sửa': 'fix' };
  const map = $('#slideMap');
  if (map) map.innerHTML = SLIDES.map((s) => `<a class="chip" href="${s.href}"><b>${s.n}</b> ${esc(s.title)}${s.chip ? ` <span class="vchip ${chipClass[s.chip]}">${esc(s.chip)}</span>` : ''}</a>`).join('');

  // Bộ xếp loại dùng chung cho W3, W4, W5: chọn đáp án cho từng dòng rồi chấm một lượt
  $$('[data-sorter]').forEach((box) => {
    const set = SORTERS[box.dataset.sorter];
    const key = 'l04-sort-' + box.dataset.sorter;
    let saved = {};
    try { saved = JSON.parse(store.get(key) || '{}'); } catch { saved = {}; }
    box.innerHTML = `<p>${esc(set.intro)}</p><div class="table-wrap" style="margin:0"><table class="sorter"><tbody>${set.items.map((it, i) => `<tr data-i="${i}"><td><code>${esc(it.t)}</code><div class="sorter-why" hidden></div></td><td class="sorter-pick"><select class="field" aria-label="Chọn đáp án cho ${esc(it.t)}"><option value="">Chọn…</option>${set.options.map((o) => `<option${saved[i] === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div><div class="btns" style="margin-top:12px"><button type="button" class="btn primary sorter-grade">Chấm</button><button type="button" class="btn sorter-reset">Làm lại</button></div><div class="out sorter-out" aria-live="polite" style="margin-top:12px">Chưa chấm.</div>`;
    const selects = $$('select', box);
    selects.forEach((sel, i) => sel.addEventListener('change', () => { saved[i] = sel.value; store.set(key, JSON.stringify(saved)); }));
    $('.sorter-grade', box).addEventListener('click', () => {
      let right = 0, blank = 0;
      set.items.forEach((it, i) => {
        const tr = $(`tr[data-i="${i}"]`, box), why = $('.sorter-why', tr), val = selects[i].value;
        if (!val) { blank++; why.hidden = true; return; }
        const ok = val === it.a || (it.also || []).includes(val);
        if (ok) right++;
        why.hidden = false;
        why.innerHTML = `<span class="${ok ? 'good' : 'badx'}">${ok ? '✔ Đúng.' : `✘ Đáp án: ${esc(it.a)}.`}</span> ${esc(it.why)}`;
      });
      $('.sorter-out', box).textContent = `${right}/${set.items.length} đúng${blank ? `, còn ${blank} dòng chưa chọn` : ''}.`;
    });
    $('.sorter-reset', box).addEventListener('click', () => {
      saved = {}; store.set(key, '{}');
      selects.forEach((s) => { s.value = ''; });
      $$('.sorter-why', box).forEach((w) => { w.hidden = true; });
      $('.sorter-out', box).textContent = 'Chưa chấm.';
    });
  });

  // W1 · Ma trận hợp đồng (từ runs/lab4.txt)
  const L4 = run('lab4');
  const w1 = $('#w1-table');
  if (L4 && w1) {
    const cases = L4.adapters[0].cases.map((c) => c.name);
    w1.innerHTML = `<table class="mx"><thead><tr><th>Ca kiểm</th>${L4.adapters.map((a) => `<th>${esc(a.name)}</th>`).join('')}</tr></thead><tbody>${cases.map((name, i) => `<tr><td>${esc(name)}</td>${L4.adapters.map((a, k) => `<td><button type="button" class="cellbtn ${a.cases[i].ok ? 'ok' : 'bad'}" aria-pressed="false" data-a="${k}" data-c="${i}" aria-label="${esc(a.name)}, ${esc(name)}: ${a.cases[i].ok ? 'PASS' : 'FAIL'}">${a.cases[i].ok ? 'PASS' : 'FAIL'}</button></td>`).join('')}</tr>`).join('')}</tbody></table>`;
    $$('.cellbtn', w1).forEach((b) => b.addEventListener('click', () => {
      press(w1, b);
      const a = L4.adapters[+b.dataset.a], c = a.cases[+b.dataset.c];
      const note = c.note ? ` Số đo: <code>${esc(c.note)}</code>.` : '';
      const lesson = c.ok ? '' : ' Bút toán vẫn đủ 60, nhưng số dư bị ghi đè bởi các lệnh đọc cùng một giá trị cũ. Đó là mất cập nhật của Bài 14, chỉ khác là mô phỏng trong RAM.';
      $('#w1-out').innerHTML = `<b>${esc(a.name)}</b> · ${esc(c.name)}: <span class="${c.ok ? 'good' : 'badx'}">${c.ok ? 'PASS' : 'FAIL'}</span>.${note}${lesson}`;
    }));
  }

  // W2 · Trả gì cho client? (từ runs/lab1.txt)
  const L1 = run('lab1');
  const w2 = $('#w2-btns');
  if (L1 && w2) {
    const label = { '/prisma-row': 'Trả dòng Prisma', '/prisma-row-to-json-patch': 'Dòng Prisma + vá toJSON', '/domain-entity': 'Trả Entity của lab', '/dto': 'Trả DTO' };
    const say = { '/prisma-row': 'JSON.stringify không biết bigint, nên cả endpoint chết.', '/prisma-row-to-json-patch': 'Chạy được, nhưng field nội bộ lọt ra. Sau này thêm field nào vào bảng, field đó cũng ra API.', '/domain-entity': 'Status 200 nên trông như thành công, nhưng số dư đã biến mất vì #balance không nằm trong JSON.', '/dto': 'Chỉ field đã hứa đi qua ranh giới. balance là chuỗi nên client JS không mất độ chính xác.' };
    const show = (r) => {
      $('#w2-out').innerHTML = `<p><code>GET ${esc(r.path)}</code> → <b class="${r.status === 200 ? 'good' : 'badx'}">${r.status}</b></p><p><code>${esc(r.body)}</code></p><p>${esc(say[r.path])}</p>`;
    };
    w2.innerHTML = L1.map((r, i) => `<button type="button" class="btn" aria-pressed="false" data-i="${i}">${esc(label[r.path])}</button>`).join('');
    $$('button', w2).forEach((b) => b.addEventListener('click', () => { press(w2, b); show(L1[+b.dataset.i]); }));
    press(w2, $('button', w2));
    show(L1[0]);
  }
})();
