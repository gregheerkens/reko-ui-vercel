# E2E Test Scenarios for Add Book Page

These test scenarios can be implemented using either:
- **Jest + React Testing Library** (recommended - stays in current test ecosystem)
- **Cypress** (separate tool - true browser E2E testing)

## Recommendation: Jest + React Testing Library

Since we're already using Jest, we recommend implementing these as **integration tests** using:
- Jest (existing)
- React Testing Library (already installed)
- MSW (Mock Service Worker) for API mocking

**Pros:**
- ✅ Same test runner as unit tests
- ✅ Faster execution
- ✅ Easy CI/CD integration
- ✅ Can share mocks and utilities
- ✅ No additional tooling needed

**Cons:**
- ⚠️ Not true browser E2E (uses jsdom)
- ⚠️ Requires API mocking

## Alternative: Cypress (Optional)

If you need true browser E2E testing later:

**Setup Required:**
1. Install Cypress: `npm install --save-dev cypress`
2. Initialize Cypress: `npx cypress open`
3. Create `cypress.config.ts` in the frontend directory
4. Add script: `"test:e2e": "cypress run"` to package.json

**Pros:**
- ✅ Real browser testing
- ✅ Great debugging tools
- ✅ Visual test runner
- ✅ Can test actual network requests

**Cons:**
- ⚠️ Separate tool/commands
- ⚠️ Different syntax from Jest
- ⚠️ Slower execution
- ⚠️ More complex CI setup

## Test Scenarios

### 1. Happy Path: ISBN Lookup → Populate → Assign Traits → Submit

**Steps:**
1. Navigate to `/add` page (should redirect to login if not authenticated)
2. Login if needed
3. Enter a valid ISBN (e.g., "9780143127741" for "The Great Gatsby")
4. Click "Lookup" button
5. Verify book metadata is populated (title, authors, etc.)
6. Select expressions for all 50 traits
7. Click "Create Book" button
8. Verify redirect to `/books/[id]` page
9. Verify book details are displayed correctly

**Expected Result:** Book is created successfully and user is redirected to book detail page.

### 2. Manual JSON Entry Happy Path

**Steps:**
1. Navigate to `/add` page
2. Login if needed
3. Click "Show Advanced JSON Entry" button
4. Enter valid JSON matching CreateBookDto structure
5. Click "Create Book from JSON" button
6. Verify redirect to `/books/[id]` page

**Expected Result:** Book is created from JSON and user is redirected to book detail page.

### 3. Malicious JSON Rejection

**Steps:**
1. Navigate to `/add` page
2. Login if needed
3. Click "Show Advanced JSON Entry" button
4. Enter JSON with:
   - Script tags: `{"title": "<script>alert('xss')</script>", ...}`
   - Invalid properties: `{"title": "Test", "maliciousField": "value", ...}`
   - Schema injection attempts
5. Click "Create Book from JSON" button

**Expected Result:** 
- Script tags are sanitized or rejected
- Invalid properties are rejected with error message
- Error message is displayed clearly

### 4. Empty Trait Selection Rejection

**Steps:**
1. Navigate to `/add` page
2. Login if needed
3. Enter ISBN and populate metadata
4. Leave some traits unselected
5. Click "Create Book" button

**Expected Result:** 
- Form validation error is displayed
- Error message indicates which traits are missing
- Book is not created

### 5. Bad ISBN Lookup Handling

**Steps:**
1. Navigate to `/add` page
2. Login if needed
3. Enter invalid ISBN format (e.g., "12345")
4. Click "Lookup" button

**Expected Result:** 
- Error message: "Invalid ISBN format"
- Form remains usable for manual entry

**Steps (continued):**
5. Enter valid ISBN format but non-existent ISBN (e.g., "9999999999999")
6. Click "Lookup" button

**Expected Result:**
- Error message: "Book not found for this ISBN"
- Form remains usable for manual entry

### 6. Pre-existing ISBN Checking (if applicable)

**Steps:**
1. Create a book with ISBN "9780143127741"
2. Navigate to `/add` page
3. Enter the same ISBN
4. Click "Lookup" button
5. Try to create the book again

**Expected Result:**
- If duplicate ISBN checking is implemented, appropriate error message
- Otherwise, book creation proceeds (backend may handle duplicates)

### 7. Form Validation

**Steps:**
1. Navigate to `/add` page
2. Login if needed
3. Try to submit form without:
   - Title
   - Authors
   - All trait selections

**Expected Result:**
- Appropriate validation errors for each missing field
- Form does not submit

### 8. Network Error Handling

**Steps:**
1. Navigate to `/add` page
2. Login if needed
3. Open browser DevTools → Network tab → Set to "Offline"
4. Try to lookup ISBN or submit form

**Expected Result:**
- Appropriate error message displayed
- Form remains usable when network is restored

### 9. Authentication Flow

**Steps:**
1. Logout if logged in
2. Navigate to `/add` page directly

**Expected Result:**
- Redirected to `/login` page
- After login, redirected back to `/add` page (or stays on intended page)

### 10. Trait Selection UI

**Steps:**
1. Navigate to `/add` page
2. Login if needed
3. Verify all 50 traits are displayed
4. Verify trait order matches Genome Dictionary order (1-50)
5. Select different expressions for traits
6. Verify color indicators appear
7. Verify tooltips show trait and expression descriptions

**Expected Result:**
- All 50 traits visible and selectable
- UI is responsive and usable
- Visual feedback for selections

## Implementation Notes

### Jest Implementation (Recommended)
These scenarios should be implemented as integration tests in:
- `__tests__/integration/add-book.integration.test.tsx` (already started)
- Use MSW for API mocking: `npm install --save-dev msw`

### Cypress Implementation (Optional)
If using Cypress, implement in:
- `cypress/e2e/add-book.cy.ts`

## Current Status

✅ Integration test structure exists in `__tests__/integration/add-book.integration.test.tsx`
✅ Unit tests completed for components
⏳ Full integration test implementation (can expand existing file)
⏳ Cypress setup (optional, only if true browser E2E needed)

