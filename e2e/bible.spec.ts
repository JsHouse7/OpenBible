import { test, expect } from '@playwright/test'

test.describe('Bible reader', () => {
  test('shows reader chrome after load', async ({ page }) => {
    await page.goto('/bible')
    await expect(page.getByTestId('bible-scripture-header')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByTestId('bible-chapter-next')).toBeVisible()
  })

  test('deep link opens John chapter 3 verse 16', async ({ page }) => {
    await page.goto('/bible?book=John&chapter=3&verse=16')
    await expect(page.getByTestId('bible-scripture-header')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByTestId('bible-verse-16')).toBeVisible()
    await expect(page.getByText(/For God so loved the world/i)).toBeVisible()
  })

  test('next chapter updates the URL and loads chapter content', async ({ page }) => {
    await page.goto('/bible?book=John&chapter=3')
    await expect(page.getByTestId('bible-scripture-header')).toBeVisible({ timeout: 60_000 })
    await page.getByTestId('bible-chapter-next').click()
    await expect(page).toHaveURL(/[?&]chapter=4(?:&|$)/)
    await expect(page.getByText(/When therefore the Lord knew/i)).toBeVisible({ timeout: 30_000 })
  })
})
