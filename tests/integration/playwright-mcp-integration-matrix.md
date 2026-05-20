# Playwright MCP Integration Matrix

Target: `https://flowways.vercel.app/`
Mode: manual automation via Playwright MCP tools

## Coverage Areas

1. App shell boot
- Page loads without crash.
- Header controls render.
- Search / add task input is visible and editable.

2. Core task creation
- Create a normal short task.
- Create a long task (stress line length/readability).
- Create a task with tags and symbols.

3. Classification behavior (high-variance prompts)
- Work-oriented task.
- Journal-like sentence.
- Ambiguous mixed-context sentence.
- Time/date-heavy sentence.

4. Card interaction
- Open/select a created card.
- Edit path availability.
- Mark/close action availability.

5. Search and filter loop
- Search by keyword returns matching card(s).
- Search by tag token returns expected card(s).
- Clear search restores full list.

6. Mobile usability (iPhone size)
- Resize viewport to `390x844`.
- No unusable overlap between search/actions and first card.
- Buttons remain tappable and visibly aligned.
- Input focus does not trigger disruptive zoom behavior.

7. Resilience checks
- Rapid action clicks do not break layout.
- Console has no repeated fatal runtime errors.

## Pass Criteria

- All core flows (create/search/interact) complete without reload loops or UI lock.
- Classification outputs remain sensible across versatile examples.
- Mobile layout stays readable, tap targets remain usable.
- No blocking console/runtime errors.
