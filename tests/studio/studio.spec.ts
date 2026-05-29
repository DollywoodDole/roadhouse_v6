import { test, expect } from '@playwright/test'

const URL = '/studio'

test.describe('RoadHouse Studio', () => {
  test('1. Homepage loads', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveTitle(/RoadHouse Studio/i)
    // First hero line is always OPERATORS (scoped to data-hero-line)
    await expect(page.locator('[data-hero-line]').first()).toBeVisible()
    await expect(page.locator('[data-hero-line]').first()).toHaveText('OPERATORS')
  })

  test('2. Toggle — For Clients → For the House → back', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    // Default: client view — MARK (Brand service) is client-only
    await expect(page.locator('.studio-services-grid').getByText('MARK', { exact: true })).toBeVisible()

    // Click "For the House"
    await page.getByRole('button', { name: /for the house/i }).click()
    // House service: SIGNAL
    await expect(page.locator('.studio-services-grid').getByText('SIGNAL', { exact: true })).toBeVisible()

    // Click back to For Clients
    await page.getByRole('button', { name: /for clients/i }).click()
    await expect(page.locator('.studio-services-grid').getByText('MARK', { exact: true })).toBeVisible()
  })

  test('3. Case study visible in client mode, hidden in house mode', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    // Client mode (default) — Motors case study visible
    await expect(page.getByText('RoadHouse Motors', { exact: true })).toBeVisible()

    // Switch to house mode
    await page.getByRole('button', { name: /for the house/i }).click()
    await expect(page.getByText('RoadHouse Motors', { exact: true })).not.toBeVisible()
  })

  test('4. Process section — all 5 steps visible', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    await page.locator('#process').scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)

    const process = page.locator('#process')
    // Scope all checks to #process to avoid collisions with hero/services
    for (const name of ['DISCOVERY', 'PROPOSAL', 'DELIVERY', 'GROW']) {
      await expect(process.getByText(name, { exact: true })).toBeVisible()
    }
    // BUILD step — scoped to #process
    await expect(process.locator('[data-process-step]').nth(2).getByText('BUILD', { exact: true })).toBeVisible()
  })

  test('5. Industries grid — AUTOMOTIVE and AGRICULTURE visible', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    await page.locator('#house').scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)

    await expect(page.getByText('AUTOMOTIVE', { exact: true })).toBeVisible()
    await expect(page.getByText('AGRICULTURE', { exact: true })).toBeVisible()
  })

  test('6. Nav — RS mark and Enter ↗ CTA visible', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    const nav = page.locator('[data-studio-nav]')
    await expect(nav).toBeVisible()
    await expect(nav.getByText('RS')).toBeVisible()
    await expect(nav.getByText(/enter/i)).toBeVisible()
  })

  test('7. Stats strip — 7–21 and FIXED visible', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('.studio-stats-grid').getByText('7–21', { exact: true })).toBeVisible()
    await expect(page.locator('.studio-stats-grid').getByText('FIXED', { exact: true })).toBeVisible()
  })

  test('8. Mobile viewport — no overflow, toggle works', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(400)

    // Check no horizontal scroll
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflow).toBe(false)

    // Toggle works at mobile size
    await page.getByRole('button', { name: /for the house/i }).click()
    await expect(page.locator('.studio-services-grid').getByText('SIGNAL', { exact: true })).toBeVisible()
  })
})
