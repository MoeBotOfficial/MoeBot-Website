import { test, expect } from '@playwright/test';

test('首页导航与候补入口可用', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('猫猫的陪伴');
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '功能', exact: true }).click();
  await expect(page).toHaveURL(/\/features\/$/);
  await page.locator('.header-cta').click();
  await expect(page).toHaveURL(/\/beta\/$/);
  await expect(page.getByRole('status')).toContainText('登记即将开放');
  await expect(page.locator('form,input')).toHaveCount(0);
  await expect(page.getByText('登记入口尚未开放')).toHaveAttribute('aria-disabled', 'true');
});

test('Markdown 表格、代码复制和目录锚点', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/docs/developers/ci-cd/');
  await expect(page.locator('.prose table').first()).toBeVisible();
  const code = await page.locator('.prose pre code').first().textContent();
  await page.getByRole('button', { name: '复制代码', exact: true }).first().click();
  await expect(page.locator('.code-copy').first()).toHaveText('已复制');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
  const tocLink = page.locator('.docs-toc nav a').first();
  const anchor = await tocLink.getAttribute('href');
  await tocLink.click();
  expect(new URL(page.url()).hash).toBe(encodeURI(anchor!));
});

test('静态中文搜索和键盘关闭', async ({ page }) => {
  await page.goto('/docs/');
  await page.locator('.docs-search-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('searchbox').fill('插件');
  await expect(page.locator('.search-result').first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('status')).toContainText('找到');
  await page.locator('.search-result').first().click();
  await expect(page).toHaveURL(/\/docs\/.+/);
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('仓库 Mermaid 流程图可渲染', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/docs/developers/plugin-runtime/');
  await expect(page.locator('.doc-diagram svg')).toHaveCount(2, { timeout: 20000 });
  expect(errors).toEqual([]);
});

test('手机导航、文档目录与页面宽度', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/features/', '/plugins/', '/beta/', '/docs/developers/sdk/', '/docs/developers/plugin-runtime/']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: '打开导航' }).click();
  await expect(page.getByRole('navigation', { name: '手机导航' })).toBeVisible();
  await page.getByRole('navigation', { name: '手机导航' }).getByRole('link', { name: '文档', exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/$/);
  await page.locator('#docs-menu-toggle').click();
  await expect(page.locator('#docs-sidebar')).toBeVisible();
  await page.locator('#docs-sidebar').getByRole('link', { name: '快速开始', exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
});
