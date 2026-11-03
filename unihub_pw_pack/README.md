# UniHub – bộ kiểm thử giao diện Playwright

Bộ test này chạy trực tiếp trên localhost `http://127.0.0.1:5173`, tự khởi động Vite và mở Chromium. Không cần deploy ứng dụng.

## 1. Cài đặt (chạy một lần)

Mở terminal tại thư mục gốc UniHub:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## 2. Chép bộ test vào dự án

Giải nén gói này vào thư mục gốc UniHub, giữ nguyên cấu trúc:

- `playwright.config.ts`
- `e2e/smoke.spec.ts`

Không ghi đè file source hiện có.

## 3. Chạy kiểm thử

```bash
npx playwright test
```

Mở báo cáo HTML:

```bash
npx playwright show-report playwright-report
```

## 4. Gửi kết quả cho ChatGPT

Nén và gửi lại các thư mục:

- `playwright-report/`
- `test-results/`

Nếu test thất bại, trong `test-results` có screenshot, trace và video (nếu được ghi). Đừng gửi `node_modules`.

## Các luồng hiện được kiểm tra

1. Điều hướng qua 9 trang chính và lỗi JavaScript runtime.
2. Tạo môn học mới, sau đó tìm lại theo mã môn.
3. Tạo bài tập mới và xác nhận hiển thị.
4. Xuất backup JSON.

Lưu ý: test tạo dữ liệu thử trong IndexedDB của browser context Playwright riêng, không sửa dữ liệu trình duyệt bạn đang sử dụng thường ngày. Bộ test smoke chưa bao phủ toàn bộ nghiệp vụ; sau khi chạy vòng đầu, có thể bổ sung test chi tiết theo các lỗi phát hiện được.
