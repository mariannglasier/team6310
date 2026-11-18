# Receipt recaps and direct decisions

The November 17 recap redesign follows the user's receipt reference. Saved scenario and bill decisions show a story, a signed cash-change summary, and a paper receipt with the chosen option, day, and saved balance when available. Job and interview results use a simple outcome and weekly-pay summary, without a receipt or cash-change box, following the user's correction. An ignored bill shows zero cash change and its outstanding amount separately.

General and CAC fact cards have distinct surfaces and topic headings. A statistic is emphasized within its original sentence, appearing once rather than repeated above the paragraph. Reporting years alone are never promoted as statistics. Regular mode continues to hide CAC passages. Interactive selection and focus colors use the brand red. Receipts use a compact width and tighter spacing to bring the facts higher on the page; they remain centered and narrow on mobile.

Activating a scenario choice, Pay/Ignore, job application, or interview clothing choice saves immediately through the existing protected action. The separate Submit button is removed. Pending actions lock repeat activation; receipts only appear after a confirmed save. Continue stays after the facts so the player can read the recap. Setup and administrative forms keep their own confirmation controls.

Employment application and interview recaps also place their facts inside the result panel above Start Day 1, Search open jobs, or Continue. Facts must precede the next-step action across recap screens.

Saved bill recaps omit the old Due Day/amount and Paid/ignored status lines beneath the receipt, which already conveys those details. Due information remains visible before choosing. Avoid redundant recap summaries while retaining the authored description and facts.

The user subsequently removed the decorative question illustrations. Questions use a centered, limited-width heading and description, generous spacing before the choices, and padded choice cards with left-aligned labels. Responsive margins provide breathing room without squeezing narrow mobile screens. Saved recaps retain their compact receipt layout and facts above Continue.

Validation: 471 frontend tests passed, with two existing skips. Formatting, lint, type checking and production build passed. Nine mocked browser cases exercised regular/CAC facts and bill decisions at desktop, mobile and 320px widths; desktop and narrow-mobile screenshots were inspected. The Windows browser runner required interruption during server shutdown after the cases completed. No Supabase schema changes or paid provider calls were needed for this presentation change.
