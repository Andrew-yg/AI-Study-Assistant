import { test, expect } from '@playwright/test'
import { mockChatApis, seedAuthState } from './utils/apiMocks'

const ASSISTANT_REPLY = 'Photosynthesis converts light energy into chemical energy that a plant stores as glucose.'

test.describe('Chat experience', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthState(page, 'playwright-token')
    await mockChatApis(page, { assistantMessage: ASSISTANT_REPLY })
  })

  test('renders conversation and streams assistant response', async ({ page }) => {
    await page.goto('/chat')

  await expect(page.getByText('Biology Review')).toBeVisible()
  await expect(page.getByText('Practice quizzes')).toBeVisible()
  await expect(page.getByText('Conversation Materials')).toBeVisible()

    const textarea = page.locator('textarea[placeholder^="Ask a question"]')
    await textarea.fill('Explain photosynthesis?')
    await page.locator('button.send-button').click()

  await expect(page.getByText(ASSISTANT_REPLY)).toBeVisible()
  await expect(page.getByText('Response telemetry')).toBeVisible()
  await expect(page.getByText('Referenced course materials')).toBeVisible()

    await expect(page.getByText('Saved quiz')).toBeVisible()
  })
})
