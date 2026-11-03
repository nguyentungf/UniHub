import { test, expect } from '@playwright/test';

test.describe('Semester Management & Academic Lifecycle E2E Tests', () => {
  test('BUG 01: tạo ít nhất 3 học kỳ khác nhau và bảo toàn dữ liệu sau khi tải lại trang', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Quản lý Học kỳ & Mục tiêu GPA')).toBeVisible();

    const timestamp = Date.now().toString().slice(-4);
    const sem1Name = `Học kỳ Thu ${timestamp}`;
    const sem2Name = `Học kỳ Xuân ${timestamp}`;
    const sem3Name = `Học kỳ Hè ${timestamp}`;

    // 1. Create Semester 1
    await page.getByRole('button', { name: 'Tạo học kỳ mới' }).first().click();
    await expect(page.getByText('Quản lý thời gian, tên gọi và mục tiêu GPA')).toBeVisible();
    await page.getByLabel('Tên học kỳ *').fill(sem1Name);
    await page.getByLabel('Ngày bắt đầu *').fill('2025-09-01');
    await page.getByLabel('Ngày kết thúc *').fill('2026-01-15');
    await page.getByLabel('Mục tiêu GPA (Thang 4.0)').fill('3.65');
    await page.getByRole('button', { name: 'Tạo học kỳ' }).click();
    await expect(page.getByText(sem1Name)).toBeVisible();
    await expect(page.getByText('Mục tiêu GPA: 3.65')).toBeVisible();

    // 2. Create Semester 2
    await page.getByRole('button', { name: 'Tạo học kỳ mới' }).first().click();
    await page.getByLabel('Tên học kỳ *').fill(sem2Name);
    await page.getByLabel('Ngày bắt đầu *').fill('2026-02-01');
    await page.getByLabel('Ngày kết thúc *').fill('2026-06-30');
    await page.getByLabel('Mục tiêu GPA (Thang 4.0)').fill('3.75');
    await page.getByRole('button', { name: 'Tạo học kỳ' }).click();
    await expect(page.getByText(sem2Name)).toBeVisible();
    await expect(page.getByText('Mục tiêu GPA: 3.75')).toBeVisible();

    // 3. Create Semester 3
    await page.getByRole('button', { name: 'Tạo học kỳ mới' }).first().click();
    await page.getByLabel('Tên học kỳ *').fill(sem3Name);
    await page.getByLabel('Ngày bắt đầu *').fill('2026-07-01');
    await page.getByLabel('Ngày kết thúc *').fill('2026-08-31');
    await page.getByLabel('Mục tiêu GPA (Thang 4.0)').fill('3.90');
    await page.getByRole('button', { name: 'Tạo học kỳ' }).click();
    await expect(page.getByText(sem3Name)).toBeVisible();
    await expect(page.getByText('Mục tiêu GPA: 3.90')).toBeVisible();

    // Verify persistence across reload (F5)
    await page.reload();
    await expect(page.getByText(sem1Name)).toBeVisible();
    await expect(page.getByText(sem2Name)).toBeVisible();
    await expect(page.getByText(sem3Name)).toBeVisible();
  });

  test('BUG 02 & BUG 04: chỉnh sửa học kỳ và thiết lập mục tiêu GPA', async ({ page }) => {
    await page.goto('/settings');
    const timestamp = Date.now().toString().slice(-4);
    const initialName = `Kỳ Thử Nghiệm ${timestamp}`;
    const updatedName = `Kỳ Đã Cập Nhật ${timestamp}`;

    // Create a semester
    await page.getByRole('button', { name: 'Tạo học kỳ mới' }).first().click();
    await page.getByLabel('Tên học kỳ *').fill(initialName);
    await page.getByLabel('Ngày bắt đầu *').fill('2026-09-01');
    await page.getByLabel('Ngày kết thúc *').fill('2027-01-15');
    await page.getByLabel('Mục tiêu GPA (Thang 4.0)').fill('3.50');
    await page.getByRole('button', { name: 'Tạo học kỳ' }).click();
    await expect(page.getByText(initialName)).toBeVisible();

    // Edit the semester
    await page.getByRole('button', { name: `Chỉnh sửa ${initialName}` }).click();
    await expect(page.getByText('Chỉnh sửa thông tin học kỳ')).toBeVisible();
    await page.getByLabel('Tên học kỳ *').fill(updatedName);
    await page.getByLabel('Mục tiêu GPA (Thang 4.0)').fill('3.85');
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();

    // Verify changes
    await expect(page.getByText(updatedName)).toBeVisible();
    await expect(page.getByText('Mục tiêu GPA: 3.85')).toBeVisible();
  });

  test('BUG 03: chuyển học kỳ hiện tại đồng bộ trên Navbar, Sidebar và Dashboard', async ({ page }) => {
    await page.goto('/settings');
    const timestamp = Date.now().toString().slice(-4);
    const semName = `Kỳ Kích Hoạt ${timestamp}`;

    // Create target semester
    await page.getByRole('button', { name: 'Tạo học kỳ mới' }).first().click();
    await page.getByLabel('Tên học kỳ *').fill(semName);
    await page.getByLabel('Ngày bắt đầu *').fill('2026-09-01');
    await page.getByLabel('Ngày kết thúc *').fill('2027-01-15');
    await page.getByLabel('Mục tiêu GPA (Thang 4.0)').fill('3.88');
    await page.getByRole('button', { name: 'Tạo học kỳ' }).click();
    await expect(page.getByText(semName)).toBeVisible();

    // Click "Đặt làm hiện tại"
    const semContainer = page.locator('div').filter({ hasText: semName }).first();
    await semContainer.getByRole('button', { name: 'Đặt làm hiện tại' }).click();

    // Verify current semester badge
    await expect(page.getByText('Học kỳ hiện tại').first()).toBeVisible();

    // Check Navbar quick switcher shows new semester name
    await expect(page.locator('header').getByText(semName).first()).toBeVisible();

    // Check Dashboard page
    await page.goto('/dashboard');
    await expect(page.getByText(semName).first()).toBeVisible();
    await expect(page.getByText('Mục tiêu: 3.88').first()).toBeVisible();
  });

  test('BUG 02: bảo vệ an toàn dữ liệu khi xóa học kỳ', async ({ page }) => {
    await page.goto('/settings');
    const timestamp = Date.now().toString().slice(-4);
    const emptySemName = `Kỳ Trống ${timestamp}`;

    // Create an empty semester
    await page.getByRole('button', { name: 'Tạo học kỳ mới' }).first().click();
    await page.getByLabel('Tên học kỳ *').fill(emptySemName);
    await page.getByLabel('Ngày bắt đầu *').fill('2026-09-01');
    await page.getByLabel('Ngày kết thúc *').fill('2027-01-15');
    await page.getByRole('button', { name: 'Tạo học kỳ' }).click();
    await expect(page.getByText(emptySemName)).toBeVisible();

    // The current semester delete button should be disabled
    const currentSemDeleteBtn = page.locator('button[title="Không thể xóa học kỳ hiện tại"]').first();
    await expect(currentSemDeleteBtn).toBeDisabled();

    // The empty non-current semester CAN be deleted with confirmation dialog
    await page.getByRole('button', { name: `Xóa ${emptySemName}` }).click();
    await expect(page.getByText('Xác nhận xóa học kỳ')).toBeVisible();
    await page.getByRole('button', { name: 'Xóa học kỳ' }).click();

    // Verify it is removed
    await expect(page.getByText(emptySemName)).not.toBeVisible();
  });

  test('BUG 05: quy trình chuyển tiếp học kỳ mới (Semester Rollover)', async ({ page }) => {
    await page.goto('/settings');
    const timestamp = Date.now().toString().slice(-4);
    const rolloverName = `Học kỳ Chuyển Tiếp ${timestamp}`;

    // Open rollover modal
    await page.getByRole('button', { name: 'Chuyển tiếp học kỳ mới' }).click();
    await expect(page.getByText('Quy trình chuyển tiếp sang Học kỳ mới')).toBeVisible();
    await expect(page.getByText('Cam kết bảo toàn dữ liệu học vụ')).toBeVisible();

    await page.getByLabel('Tên học kỳ mới *').fill(rolloverName);
    await page.getByLabel('Mục tiêu GPA cho học kỳ mới (Thang 4.0)').fill('3.95');
    await page.getByRole('button', { name: 'Khởi động học kỳ mới' }).click();

    // Verify new semester is created and marked current
    await expect(page.getByText(rolloverName)).toBeVisible();
    await expect(page.getByText('Mục tiêu GPA: 3.95')).toBeVisible();

    // Verify Navbar shows the newly transitioned semester
    await expect(page.locator('header').getByText(rolloverName).first()).toBeVisible();
  });
});

