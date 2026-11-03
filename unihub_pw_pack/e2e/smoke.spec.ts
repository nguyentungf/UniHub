import { test, expect } from '@playwright/test';

const navItems = [
  ['Tổng quan', '/dashboard'],
  ['Môn học', '/courses'],
  ['Thời khóa biểu', '/timetable'],
  ['Bài tập', '/assignments'],
  ['Lịch thi', '/exams'],
  ['Tính điểm & GPA', '/gpa'],
  ['Đồng hồ Pomodoro', '/study'],
  ['Ghi chú', '/notes'],
  ['Cài đặt', '/settings'],
] as const;

test('các trang chính mở được và không phát sinh lỗi runtime', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/dashboard');
  await expect(page.getByText('UniHub', { exact: false }).first()).toBeVisible();

  for (const [label, path] of navItems) {
    await page.getByRole('complementary')
      .getByRole('link', {
        name: label,
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`));
    await expect(page.locator('body')).not.toContainText('Application error');
  }

  expect(pageErrors, `Lỗi JavaScript runtime:\n${pageErrors.join('\n')}`).toEqual([]);
});

test('thêm môn học mới và tìm lại bằng mã môn', async ({ page }) => {
  const code = `E2E${Date.now().toString().slice(-6)}`;
  const name = `Môn kiểm thử ${code}`;

  await page.goto('/courses');
  await page.getByRole('button', { name: 'Thêm môn học' }).click();
  await expect(page.getByText('Đăng ký môn học mới')).toBeVisible();

  await page.getByLabel('Mã môn học *').fill(code);
  await page.getByLabel('Tên môn học *').fill(name);
  await page.getByLabel('Học kỳ *').selectOption({ index: 0 });
  await page.getByLabel('Số tín chỉ *').selectOption('3');
  await page.getByLabel('Tuần học*').fill('1-16');
  await page.getByRole('button', { name: 'Đăng ký môn' }).click();

  await expect(page.getByText(code, { exact: true }).first()).toBeVisible();
  await page.getByPlaceholder('Tìm mã môn hoặc giảng viên...').fill(code);
  await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
});

test('thêm bài tập mới và xác nhận hiển thị trong danh sách', async ({ page }) => {
  const title = `Bài tập E2E ${Date.now()}`;
  await page.goto('/assignments');
  await page.getByTestId('add-assignment-button').click();
  await expect(page.getByText('Thêm bài tập mới')).toBeVisible();

  const courseSelect = page.getByLabel('Môn học *');
  expect(await courseSelect.locator('option').count()).toBeGreaterThan(1);
  await courseSelect.selectOption({ index: 1 });
  await page.getByLabel('Tiêu đề bài tập *').fill(title);
  await page.getByLabel('Hạn nộp & Thời gian *').fill('2027-01-15T18:00');
  await page.getByRole('button', { name: 'Tạo bài tập' }).click();

  await expect(page.getByText(title, { exact: false }).first()).toBeVisible();
});

test('xuất backup tải được tệp JSON', async ({ page }) => {
  await page.goto('/settings');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Xuất bản sao lưu JSON/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/i);
});
