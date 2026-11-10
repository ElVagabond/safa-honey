import { test, expect } from '@playwright/test'

const errors = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', e => errors.push(e.message))
  page.on('response', r => { if (r.status() >= 400 && !/fonts\.(googleapis|gstatic)/.test(r.url())) errors.push(`${r.status()} ${r.url()}`) })
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text()) && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()) })
})
test.afterEach(() => expect(errors, 'no page errors').toEqual([]))

// Wait for the loader curtain to finish and leave the DOM.
async function open(page, hash = '') {
  await page.goto('./' + hash)
  await expect(page.locator('.loader')).toHaveCount(0, { timeout: 10_000 })
}

test('home shows the hero carousel with every jar', async ({ page }) => {
  await open(page)
  await expect(page).toHaveTitle(/Safa Honey/)
  await expect(page.locator('.cjar')).toHaveCount(7)
  await expect(page.locator('.rim-text')).toContainText('UNHEATED')
  await expect(page.locator('.hero-foot')).toContainText('Scroll to discover')
})

test('scrolling turns the carousel to the next honey', async ({ page }) => {
  await open(page)
  const name = page.locator('.hero-name')
  await expect(name).toContainText('Raw Forest Honey')
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 150); await page.waitForTimeout(60) }
  await expect(name).not.toContainText('Raw Forest Honey', { timeout: 5_000 })
})

test('clicking a jar opens its product page through the curtain', async ({ page }) => {
  await open(page)
  await page.locator('.cjar').first().evaluate(b => b.click())
  await expect(page).toHaveURL(/#raw-forest-honey$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Raw Forest Honey', { timeout: 5_000 })
  await expect(page.locator('.facts')).toContainText('₹400')
})

test('product page: add to cart, gallery drags, other honeys exclude this one', async ({ page }) => {
  await open(page, '#premium-sidr-honey')
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Premium Sidr Honey')
  await page.getByRole('button', { name: 'Add to cart' }).click()
  await expect(page.locator('.bag')).toHaveAttribute('aria-label', '1 items in cart')
  await expect(page.getByRole('status')).toContainText('Premium Sidr Honey added')

  const track = page.locator('.gallery-track')
  await track.scrollIntoViewIfNeeded()
  const box = await track.boundingBox()
  const before = box.x
  await page.mouse.move(box.x + 200, box.y + 100)
  await page.mouse.down()
  await page.mouse.move(box.x - 300, box.y + 100, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(800)
  expect((await track.boundingBox()).x).toBeLessThan(before - 50)

  const others = page.locator('.others .pcard')
  await expect(others).toHaveCount(4)
  await expect(others.filter({ hasText: 'Premium Sidr Honey' })).toHaveCount(0)
})

test('menu opens, navigates, and back returns home', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Menu' }).click()
  await expect(page.locator('#menu')).toBeVisible()
  await page.locator('#menu').getByText('Raw Acacia Honey').click()
  await expect(page).toHaveURL(/#raw-acacia-honey$/)
  await expect(page.locator('#menu')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Raw Acacia Honey')
  await page.goBack()
  await expect(page.locator('.cjar')).toHaveCount(7, { timeout: 5_000 })
})

test('pressing Back during the page transition still lands on the right page', async ({ page }) => {
  await open(page)
  await page.locator('.cjar').nth(2).evaluate(b => b.click())
  await page.waitForTimeout(300) // curtain is still rising
  await page.goBack()
  await expect(page).not.toHaveURL(/#premium-sidr-honey/)
  await expect(page.locator('.cjar')).toHaveCount(7, { timeout: 8_000 })
  await expect(page.locator('.ptitle')).toHaveCount(0)
})

test('unknown hash falls back to the home page', async ({ page }) => {
  await open(page, '#not-a-honey')
  await expect(page.locator('.cjar')).toHaveCount(7)
})

test('page never scrolls sideways', async ({ page }) => {
  for (const hash of ['', '#raw-wild-honey']) {
    await open(page, hash)
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(600)
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(over, `horizontal overflow on "${hash || 'home'}"`).toBeLessThanOrEqual(0)
  }
})

test('footer shows the wordmark and contact details', async ({ page }) => {
  await open(page)
  const foot = page.locator('footer.foot')
  await foot.scrollIntoViewIfNeeded()
  await expect(foot.locator('.giant')).toContainText('Safa Honey')
  await expect(foot).toContainText('info@safahoney.com')
  await expect(foot).toContainText('Kanakapura Road')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('content is reachable without smooth scrolling', async ({ page }) => {
    await open(page)
    expect(await page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(false)
    await page.locator('#pantry').scrollIntoViewIfNeeded()
    await expect(page.locator('#pantry .pcard')).toHaveCount(7)
  })
})

test('on phones the pantry is a swipeable row of cards', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only')
  await open(page)
  const row = page.locator('#pantry .pgrid')
  await row.scrollIntoViewIfNeeded()
  const { scrollW, clientW } = await row.evaluate(el => ({ scrollW: el.scrollWidth, clientW: el.clientWidth }))
  expect(scrollW).toBeGreaterThan(clientW * 3)
  await row.evaluate(el => el.scrollBy({ left: el.clientWidth, behavior: 'instant' }))
  await expect.poll(() => row.evaluate(el => el.scrollLeft)).toBeGreaterThan(100)
  await expect(page.locator('#pantry .swipe-hint')).toBeVisible()
})
