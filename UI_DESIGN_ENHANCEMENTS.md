# QACopilot UI Design and Enhancement Document

This document describes the current UI design direction for QACopilot and lists practical enhancements that can improve usability, clarity, reliability, and future product value.

## 1. Product Purpose

QACopilot is a QA productivity tool that helps users:

- Upload and index requirement documents in a Knowledge Base.
- Generate structured QA test cases from a requirement prompt.
- Review previous test case generations.
- Select specific generated test cases.
- Generate automation scripts for the selected test cases.
- Configure AI providers and API keys securely.

The UI should feel like a focused QA automation workspace: dark, technical, clear, and fast to scan.

## 2. Current UI Design Direction

The app currently uses a dark dashboard layout with:

- A persistent left sidebar for navigation.
- A main content area for each workspace.
- Strong card borders and shadows for a brutalist control-panel style.
- Indigo, cyan, emerald, amber, and rose status colors.
- Compact tables for QA data.
- Clear workflow pages: Test Cases, Test Scripts, Knowledge Base, and AI Settings.

This direction works well for a QA tool because it feels operational and task-focused instead of like a marketing site.

## 3. Main Navigation Structure

### Sidebar

The sidebar contains:

- Product identity: QACopilot.
- Main pages:
  - Test Cases
  - Test Scripts
  - Knowledge Base
  - AI Settings
- AI Engine status card.
- User profile/logout area.

### Recommended Sidebar Enhancements

- Add small unread/status indicators for pages that need attention, such as unrefreshed Knowledge chunks.
- Show the selected provider status more clearly:
  - Configured
  - Missing key
  - Saved in database
  - Session-only key
- Add collapse/expand behavior for smaller laptop screens.
- Add tooltip labels for icon-only controls if the sidebar becomes collapsible.

## 4. Test Cases Page

### Current Purpose

The Test Cases page is the core generation workspace. It allows the user to enter a requirement and generate a QA test case matrix.

### Current UI Areas

- Requirement Input card.
- AI Context Enrichment card.
- RAG Knowledge Context result area.
- Generation History section.
- Generated Test Case table.
- Export Excel and Export PDF actions.

### Current Strengths

- The flow is easy to understand: input requirement, generate, review output.
- The history table allows users to switch between previous generations.
- The selected test case table title now shows which generation is currently being viewed.
- The history search helps users find old generated test cases quickly.

### Recommended Enhancements

- Add a requirement template picker:
  - Login flow
  - Registration flow
  - Checkout flow
  - Search/filter flow
  - API validation flow
- Add generation quality controls:
  - Short / Standard / Detailed
  - Functional only / Functional + edge cases / Full QA suite
  - Include accessibility checks
  - Include security checks
- Add editable test case rows so users can refine AI output before export or script generation.
- Add duplicate detection for similar generated test cases.
- Add tags or labels for test case sets.
- Add a preview drawer when clicking a test case row.
- Add bulk actions:
  - Select rows
  - Export selected
  - Send selected to Test Scripts
  - Delete selected from history
- Add a generation confidence indicator based on whether Knowledge Base context was found.

## 5. Generation History Section

### Current Purpose

The Generation History section lets users view previous generated test case sets.

### Current Behavior

- Shows generated matrix title, number of test cases, timestamp, view action, and delete action.
- Rows can be tapped to view a selected test case set.
- Search bar filters history rows.

### Recommended Enhancements

- Add date filters:
  - Today
  - This week
  - This month
  - Custom range
- Add category filters based on contained test cases:
  - Positive
  - Negative
  - Validation
  - Edge
- Add rename support for generated history titles.
- Add pin/favorite support for important test case sets.
- Add compare mode between two generated test case sets.
- Add "last used in script generation" timestamp.

## 6. Test Case Table

### Current Purpose

The table displays the currently selected generated test case set.

### Current Columns

- TC_ID
- Category
- Summary
- Test Description
- Test Steps
- Expected

### Recommended Enhancements

- Add column controls to hide/show columns.
- Add table-level search.
- Add category filters.
- Add row expansion for long steps.
- Add inline editing.
- Add status per test case:
  - Draft
  - Reviewed
  - Approved
  - Sent to automation
- Add a "Copy test case" action per row.
- Add a "Generate script for this row" shortcut.

## 7. Test Scripts Page

### Current Purpose

The Test Scripts page generates automation scripts from selected generated test cases.

### Current UI Areas

- Automation Settings card.
- Generated Test Cases selection list.
- Code preview/editor output area.
- Download and copy actions.

### Current Behavior

- Users choose framework, language, target URL, browser mode, and viewport.
- Users must select at least one generated test case before script generation.
- Selected test cases are sent to the script generation API.

### Recommended Enhancements

- Add search within generated test cases.
- Add filters by category.
- Add "select only failed/edge/validation" quick actions.
- Add a selected-case summary panel.
- Add script preview tabs:
  - Test script
  - Page object
  - Fixtures
  - Setup notes
- Add a framework-specific validation checklist.
- Add lint/format button for generated script.
- Add support for multi-file script output.
- Add direct export options:
  - Download `.spec.ts`
  - Download ZIP
  - Copy to clipboard
  - Send to GitHub branch
- Add "regenerate script" with instruction prompt:
  - Make it more stable
  - Add retries
  - Add fixtures
  - Use data-testid selectors

## 8. Knowledge Base Page

### Current Purpose

The Knowledge Base page stores project documents and creates reusable context chunks for generation.

### Current UI Areas

- Knowledge metric cards.
- Knowledge Vectorization card.
- Upload Project Documents card.
- Indexed File Breakdown widget.
- SharePoint Crawler card.
- Knowledge Files table.

### Current Strengths

- Upload and chunk status are visible.
- Indexed File Breakdown helps users understand the document mix.
- Delete confirmation prevents accidental file deletion.
- Knowledge Files table supports searching.

### Recommended Enhancements

- Add drag-and-drop upload queue with per-file parsing status.
- Add document preview for parsed text.
- Add chunk preview for each uploaded file.
- Add "refresh chunks for this file only."
- Add file category labels:
  - Requirement
  - Design
  - API spec
  - Test data
  - Business rule
- Add source health indicators:
  - Parsed successfully
  - Needs chunking
  - Chunked
  - Failed parsing
- Add SharePoint authentication support if private SharePoint files are required.
- Add duplicate document detection.
- Add document versioning.
- Add "used in last generation" indicator.

## 9. AI Settings Page

### Current Purpose

The AI Settings page lets users select an AI provider and save API credentials.

### Current UI Areas

- Credentials Console header.
- Provider selection cards.
- API key input.
- Token status.
- Save and clear actions.

### Recommended Enhancements

- Add provider health check button.
- Add masked saved-key metadata:
  - Provider
  - Last updated
  - Stored securely
- Add model selector per provider.
- Add default model presets:
  - Fast
  - Balanced
  - High quality
- Add cost/speed warning per provider.
- Add per-provider saved status in every provider card.
- Add environment key detection:
  - Available from server env
  - Saved in database
  - Missing

## 10. Authentication and User Profile

### Current Purpose

The app includes login/register behavior and a user profile area in the sidebar.

### Recommended Enhancements

- Add password reset completion flow.
- Add profile settings page.
- Add organization/workspace support.
- Add role-based permissions:
  - Admin
  - QA lead
  - QA engineer
  - Viewer
- Add audit history for generated outputs and deleted knowledge files.

## 11. Visual Design Guidelines

### Color Usage

Use colors consistently:

- Indigo: primary actions and active states.
- Emerald: success, configured, ready.
- Amber: warning, needs action, pending chunking.
- Rose: destructive actions and errors.
- Slate: neutral labels, table text, secondary information.

### Layout Guidelines

- Keep dense operational screens compact and scannable.
- Use cards only for real workspace modules, not decorative sections.
- Keep action buttons near the content they affect.
- Keep destructive actions visually separate and confirm before execution.
- Avoid large marketing-style hero sections.

### Table Guidelines

- Use sticky headers when tables grow.
- Keep IDs and statuses easy to scan.
- Truncate long text with title tooltips or expandable rows.
- Put row-level actions on the right.
- Keep table controls above the table.

## 12. Interaction Guidelines

### Confirmations

Use confirmation dialogs for:

- Deleting knowledge files.
- Deleting generation history.
- Clearing all history.
- Clearing credentials.

### Empty States

Every empty state should explain:

- What is missing.
- What action the user should take next.

Example:

- "No source test cases found. Generate test cases first in the Test Cases workspace."

### Loading States

Use loading states for:

- Generating test cases.
- Generating scripts.
- Uploading files.
- Refreshing chunks.
- Exporting files.

## 13. Recommended Enhancement Roadmap

### Phase 1: Usability Polish

- Add table search and category filtering.
- Add generated test case row preview.
- Add search in Test Scripts generated test case list.
- Add provider key status per provider card.
- Add better empty states and inline guidance.

### Phase 2: Editing and Review

- Add editable generated test cases.
- Add review statuses.
- Add saved named test suites.
- Add pin/favorite support for history.
- Add per-file chunk preview.

### Phase 3: Automation Power Features

- Add multi-file script generation.
- Add framework-specific output templates.
- Add Playwright page object generation.
- Add script regeneration instructions.
- Add ZIP export.

### Phase 4: Team and Enterprise Features

- Add workspaces/projects.
- Add roles and permissions.
- Add audit logs.
- Add document versioning.
- Add integration with GitHub/Jira/TestRail.

## 14. Key UX Principles

- The user should always know what is selected.
- The user should always know what will be generated.
- AI output should be editable and reviewable.
- Destructive actions should be confirmed.
- Generated artifacts should be easy to export and reuse.
- Knowledge Base context should be visible enough to build trust.

## 15. Success Metrics

Track whether UI improvements are working by measuring:

- Time from requirement input to exported test cases.
- Time from generated test cases to automation script.
- Number of edited or approved test cases.
- Number of Knowledge Base documents reused in generation.
- Script generation success rate.
- User correction/regeneration rate.

## 16. Summary

QACopilot already has the foundation of a strong QA automation workspace. The next improvements should focus on making selection, review, editing, and reuse clearer. The highest-value enhancements are searchable/filterable generated test cases, editable output, better Knowledge Base transparency, and stronger script generation controls.
