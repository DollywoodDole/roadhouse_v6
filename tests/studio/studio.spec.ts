import { test, expect } from '@playwright/test'

const URL = '/studio'

test.describe('RoadHouse Studio', () => {

  test('1. Homepage loads — title + AFRAID OF / ARE WE. hero lines', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveTitle(/RoadHouse Studio/i)
    await expect(page.locator('[data-hero-line]').first()).toBeVisible()
    await expect(page.getByText('AFRAID', { exact: false })).toBeVisible()
    await expect(page.getByText('ARE WE', { exact: false })).toBeVisible()
  })

  test('2. Hero section is viewport-height locked', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    const hero = page.locator('#work')
    const [box, vh] = await Promise.all([
      hero.boundingBox(),
      page.evaluate(() => window.innerHeight),
    ])
    expect(box).not.toBeNull()
    // Height should be 100vh (within 10px tolerance for rounding)
    expect(box!.height).toBeGreaterThanOrEqual(vh - 10)
    expect(box!.height).toBeLessThanOrEqual(vh + 10)
  })

  test('3. WebGL canvas renders without console errors', async ({ page }) => {
    const webglErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('webgl')) {
        webglErrors.push(msg.text())
      }
    })

    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    const canvas = page.locator('canvas').first()
    await canvas.waitFor({ state: 'visible', timeout: 10000 })
    await expect(canvas).toBeVisible()
    expect(webglErrors).toHaveLength(0)
  })

  test('4. Toggle — For Clients shows Build / Mark / Move', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    // Default is client view
    const grid = page.locator('.studio-services-grid')
    await expect(grid.getByText('BUILD',  { exact: true })).toBeVisible()
    await expect(grid.getByText('MARK',   { exact: true })).toBeVisible()
    await expect(grid.getByText('MOVE',   { exact: true })).toBeVisible()
  })

  test('5. Toggle — For the House shows Signal / Produce / IP', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    await page.getByRole('button', { name: /for the house/i }).click()

    const grid = page.locator('.studio-services-grid')
    await expect(grid.getByText('SIGNAL',  { exact: true })).toBeVisible()
    await expect(grid.getByText('PRODUCE', { exact: true })).toBeVisible()
    await expect(grid.getByText('IP',      { exact: true })).toBeVisible()
  })

  test('6. House view — services grid has no client-only words', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    await page.getByRole('button', { name: /for the house/i }).click()

    const grid = page.locator('.studio-services-grid')
    await expect(grid.getByText('MARK', { exact: true })).not.toBeVisible()
    await expect(grid.getByText('MOVE', { exact: true })).not.toBeVisible()
  })

  test("7. Case study — visible in client mode, hidden in house mode, contains O'Brian", async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    // Client mode (default)
    await expect(page.getByText('RoadHouse Motors', { exact: true })).toBeVisible()
    await expect(page.getByText(/O'Brian/i)).toBeVisible()

    // House mode
    await page.getByRole('button', { name: /for the house/i }).click()
    await expect(page.getByText('RoadHouse Motors', { exact: true })).not.toBeVisible()
  })

  test('8. Stats strip — 7–21, FIXED, and 100% visible', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    const stats = page.locator('.studio-stats-grid')
    await expect(stats.getByText('7–21',  { exact: true })).toBeVisible()
    await expect(stats.getByText('FIXED', { exact: true })).toBeVisible()
    await expect(stats.getByText('100%',  { exact: true })).toBeVisible()
  })

  test('9. Process section — all 5 named steps visible', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    await page.locator('#process').scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)

    const process = page.locator('#process')
    for (const name of ['DISCOVERY', 'PROPOSAL', 'DELIVERY', 'GROW']) {
      await expect(process.getByText(name, { exact: true })).toBeVisible()
    }
  })

  test('10. Process BUILD step scoped — no collision with hero headline', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    await page.locator('#process').scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)

    // Step 3 (index 2) is BUILD — scoped to process grid, not the hero
    const buildStep = page.locator('#process [data-process-step]').nth(2)
    await expect(buildStep.getByText('BUILD', { exact: true })).toBeVisible()
  })

  test('11. Industries grid — 6 tiles, AUTOMOTIVE and AGRICULTURE visible', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    await page.locator('#house').scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)

    await expect(page.locator('[data-industry-tile]')).toHaveCount(6)
    await expect(page.getByText('AUTOMOTIVE',  { exact: true })).toBeVisible()
    await expect(page.getByText('AGRICULTURE', { exact: true })).toBeVisible()
  })

  test('12. Contact form — fields and submit button present', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    await page.locator('#contact').scrollIntoViewIfNeeded()

    await expect(page.locator('#studio-name')).toBeVisible()
    await expect(page.locator('#studio-email')).toBeVisible()
    await expect(page.getByRole('button', { name: /send brief/i })).toBeVisible()
  })

  test('13. Nav — Enter ↗ has role=button and is visible', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    const enterBtn = page.locator('[data-studio-nav]').getByRole('button', { name: /enter/i })
    await expect(enterBtn).toBeVisible()
  })

  test('14. Mobile — no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(400)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflow).toBe(false)
  })

  test('15. Ticker section — "In production" label visible', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('domcontentloaded')

    const label = page.getByText(/in production/i)
    await label.scrollIntoViewIfNeeded()
    await expect(label).toBeVisible()
  })

  test('16. Lenis wiring — no fatal JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(URL)
    await page.waitForTimeout(2000)

    const fatalErrors = errors.filter(e =>
      !e.includes('hydrat') &&
      !e.includes('Warning') &&
      !e.includes('bigint')
    )
    expect(fatalErrors.length).toBe(0)
  })

  test('17. Sticky hero — WebGL canvas persists after scrolling', async ({ page }) => {
    await page.goto(URL)
    await page.waitForSelector('canvas')

    await expect(page.locator('canvas').first()).toBeVisible()

    await page.evaluate(() => window.scrollBy(0, 900))
    await page.waitForTimeout(500)

    await expect(page.locator('canvas').first()).toBeVisible()
  })
})
