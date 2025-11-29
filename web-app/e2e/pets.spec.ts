import { test, expect } from '@playwright/test';

test.describe('ペット一覧機能', () => {
  test('トップページが表示される', async ({ page }) => {
    await page.goto('/');

    // ページタイトルを確認
    await expect(page).toHaveTitle(/OnlyCats/);

    // ヘッダーが存在することを確認
    await expect(page.getByRole('banner')).toBeVisible();

    // フッターが存在することを確認
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('猫一覧ページが表示される', async ({ page }) => {
    await page.goto('/cats');

    // ページが読み込まれたことを確認
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('猫図鑑ページが表示される', async ({ page }) => {
    await page.goto('/portal');

    // ページが読み込まれたことを確認
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('スキップリンクが機能する', async ({ page }) => {
    await page.goto('/');

    // Tabキーでスキップリンクにフォーカス
    await page.keyboard.press('Tab');

    // スキップリンクがフォーカスされていることを確認
    const skipLink = page.getByRole('link', { name: 'メインコンテンツへスキップ' });
    await expect(skipLink).toBeFocused();

    // Enterでスキップ
    await page.keyboard.press('Enter');

    // メインコンテンツにスクロールしたことを確認
    await expect(page.locator('#main-content')).toBeVisible();
  });
});

test.describe('ナビゲーション', () => {
  test('ヘッダーナビゲーションが機能する', async ({ page }) => {
    await page.goto('/');

    // 猫を探すリンクをクリック
    await page.getByRole('link', { name: '猫を探す' }).first().click();
    await expect(page).toHaveURL(/\/cats/);
  });

  test('フッターナビゲーションが機能する', async ({ page }) => {
    await page.goto('/');

    // フッターまでスクロール
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // フッターのリンクが存在することを確認
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: '猫を探す' })).toBeVisible();
  });
});

test.describe('アクセシビリティ', () => {
  test('キーボードでナビゲーションできる', async ({ page }) => {
    await page.goto('/');

    // Tabキーで要素間を移動
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // フォーカス可能な要素にフォーカスされていることを確認
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });

  test('ARIAランドマークが存在する', async ({ page }) => {
    await page.goto('/');

    // 必須のランドマークが存在することを確認
    await expect(page.getByRole('banner')).toBeVisible(); // header
    await expect(page.getByRole('main')).toBeVisible(); // main
    await expect(page.getByRole('contentinfo')).toBeVisible(); // footer
  });
});
