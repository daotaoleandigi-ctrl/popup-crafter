# Triển khai Popup Crafter nhiều người dùng

## Trạng thái
Mã nguồn đã hỗ trợ Supabase Auth, PostgreSQL với RLS, lưu ảnh, bản nháp/bản xuất bản, mã nhúng tải theo ID và nhập popup từ JSON/trình duyệt. Đã cấu hình Project URL và publishable key trong .env.local; API Auth đã phản hồi HTTP 200. Cả hai migration đã chạy thành công trên Supabase thật. API công khai trả HTTP 200, quyền bản nháp/API ghi bị chặn cho anon. Test hai người dùng và nháp/xuất bản/ngừng xuất bản trên database thật đã PASS; dữ liệu thử đã rollback. Không có khóa bí mật trong mã nguồn.

## 1. Chuẩn bị Supabase
1. Tạo một dự án Supabase trong tài khoản của bạn.
2. Trong SQL Editor, chạy lần lượt tất cả file trong `supabase/migrations/` theo thứ tự tên (001 rồi 002), một lần trên dự án mới. File tạo bảng, hàm API, chính sách phân quyền và bucket ảnh.
3. Trong Authentication, bật đăng nhập email/password và xác nhận email. Cấu hình Site URL cùng danh sách Redirect URLs cho URL website thật; thêm URL localhost nếu cần kiểm thử.
4. Cấu hình SMTP để gửi thư xác nhận và đặt lại mật khẩu khi dùng thật. Cấu hình giới hạn đăng ký/rate limit/CAPTCHA phù hợp lượng truy cập.
5. Lấy Project URL và publishable key từ bảng điều khiển. Không đưa secret key, service_role hoặc mật khẩu database vào biến VITE_*.

## 2. Kết nối ứng dụng
Sao chép `.env.example` thành `.env.local` và điền:
```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
VITE_APP_URL=https://YOUR_POPUP_CRAFTER_DOMAIN
```
VITE_APP_URL là địa chỉ của ứng dụng này, không phải website khách hàng sẽ nhúng popup.

Khởi động lại dev server sau khi đổi biến môi trường:
```sh
npm install
npm run dev
```

- Dev không có Supabase: vẫn cho dùng dữ liệu local cũ, có nhãn thông báo rõ.
- Production không có Supabase: chặn màn quản lý, không tự chuyển về lưu local.
- Có Supabase nhưng mất mạng/thiếu quyền: báo lỗi, không báo đã lưu và không ghi vào kho local.

## 3. Xuất bản frontend
Dùng hosting hỗ trợ website tĩnh với HTTPS:
- Lệnh build: `npm run build`.
- Thư mục đầu ra: `dist`.
- Cấu hình ba biến môi trường phía trên **trước khi build**.
- Rewrite các route ứng dụng như /demo về /index.html.
- Giữ các file /embed-loader.js và /widget-runtime.js là JavaScript thực; không rewrite chúng về HTML.
- Không cache HTML và embed-loader.js dài hạn; ưu tiên revalidation cho widget-runtime.js.
- Chỉ mở Vite dev server trên máy phát triển, không dùng làm server production.

Lệnh prebuild/predev tự tạo public/widget-runtime.js từ cùng nguồn runtime dùng trong bản demo.

## 4. Luồng sử dụng
1. Đăng ký và xác nhận email.
2. Đăng nhập, tạo popup; thay đổi được lưu thành bản nháp.
3. Tải ảnh PNG/JPG/WebP/GIF tối đa 5 MB lên Storage.
4. Chọn Xuất bản rồi lấy mã nhúng; dán mã vào website khách hàng.
5. Chỉnh tiếp bản nháp không ảnh hưởng bản đã xuất bản.
6. Bấm Xuất bản cập nhật để thay thế bản công khai. Website nhận bản mới trong lần tải trang tiếp theo.
7. Ngừng xuất bản làm những lần tải tiếp theo không hiển thị popup. Nó không gỡ tức thì popup đã tải trong tab đang mở.
8. Xóa popup xóa cả bản nháp lẫn bản xuất bản liên quan. Ảnh không tự xóa để tránh làm hỏng URL còn được sử dụng.

Ảnh là tài nguyên công khai phục vụ hiển thị website. Mỗi tài khoản chỉ được tải lên thư mục của mình; tên file bất biến, không cho ghi đè. Không tải tài liệu riêng tư lên bucket ảnh. Cấu hình bản nháp vẫn riêng tư theo tài khoản.

## 5. Dữ liệu cũ và sao lưu
- Nút Nhập popup cũ từ trình duyệt sao chép dữ liệu local **tại đúng origin/trình duyệt đang mở** vào tài khoản. Bản local gốc không bị xóa.
- Nếu chuyển từ localhost sang tên miền mới, xuất JSON ở localhost rồi dùng Nhập bản sao JSON trên website mới.
- Nhập luôn tạo ID mới, không ghi đè popup hiện có. Nhập lại cùng file sẽ tạo thêm bản sao.
- Nếu nhập bị lỗi giữa chừng, các bản đã lưu vẫn tồn tại; kiểm tra thư viện trước khi thử lại.
- JSON chứa cấu hình và URL ảnh, không phải bản sao đầy đủ database/ảnh.
- Thiết lập backup PostgreSQL và backup Storage riêng trong quy trình vận hành. Kiểm tra khả năng phục hồi trước khi nhận dữ liệu quan trọng.

## 6. Kiểm tra trước khi mời người dùng thật
Các test tự động dùng PostgreSQL WASM và mô phỏng Auth/Storage schemas. Kiểm tra SQL trên Supabase thật đã đạt; vẫn cần kiểm tra luồng trình duyệt/email:
- Tạo hai tài khoản A và B, mỗi bên tạo popup riêng.
- Xác nhận B không thể xem/sửa/xuất bản popup của A khi gọi trực tiếp API.
- Kiểm tra xác nhận email, đăng nhập, đặt lại mật khẩu, đăng xuất.
- Tải ảnh, tải lại trang và đăng nhập trên thiết bị khác.
- Dán mã nhúng lên một website khác; thử cả popup và inline.
- Thử sửa nháp, xuất bản, ngừng xuất bản và xóa.
- Kết nối form CRM thật, kiểm tra cào → form → cảm ơn.

Form trong trang quản trị/demo chạy trong iframe sandbox để cách ly phiên đăng nhập. Một số CRM yêu cầu cookie hoặc quyền điều hướng có thể không hoạt động đầy đủ trong sandbox; cần kiểm tra form thật trên website nhúng. Không gỡ sandbox khỏi trang quản trị để sửa lỗi tương thích.

## Giới hạn phạm vi
Mỗi tài khoản sở hữu dữ liệu riêng. Chưa có workspace chung, mời thành viên, thanh toán hay thống kê lead. Thông tin khách gửi trong form vẫn do CRM của form quản lý; ứng dụng này lưu cấu hình popup và ảnh.

## Tài liệu chính thức
- https://supabase.com/docs/guides/auth/quickstarts/react
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control
