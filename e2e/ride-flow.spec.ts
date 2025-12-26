import { test, expect } from '@playwright/test';

test.describe('Ride Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 访问首页
    await page.goto('/');
  });

  test('should navigate to passenger service and show login', async ({ page }) => {
    // 点击“我是乘客”
    await page.click('text=我是乘客');
    
    // 应该显示访问控制卡片
    await expect(page.locator('text=访问控制')).toBeVisible();
  });

  test('should show error for invalid access code format', async ({ page }) => {
    await page.click('text=我是乘客');
    
    // 输入错误的访问码格式（非 UUID）
    await page.fill('input[placeholder*="请输入访问码"]', 'INVALID_CODE');
    
    // 监听对话框
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('无效的访问码格式');
      await dialog.accept();
    });

    await page.click('button:has-text("验证")');
  });

  test('should allow public access to view requests', async ({ page }) => {
    await page.click('text=我是乘客');
    
    // 点击公开访问
    await page.click('button:has-text("公开访问")');
    
    // 应该看到用车需求列表（即使是空的）
    await expect(page.locator('text=用车需求')).toBeVisible();
  });
});
