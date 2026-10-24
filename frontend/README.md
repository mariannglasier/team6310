# CAC frontend foundation

Use Node.js 24.x and npm. From this directory:

```sh
npm ci
npm run dev
```

On PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`. See the [root README](../README.md) for route and project structure tables. The landing page is implemented; other pages remain placeholders. Gameplay, payment processing, and staff sign-in are not implemented.

## Environment and verification

Public placeholders run without Supabase credentials. Before using a backend service, copy `.env.example` to `.env.local` and supply the development project's URL and publishable key. Local environment files are ignored by Git. Never put a privileged key in frontend configuration. `services/supabase.ts` lazily loads the existing validated client in `lib/supabaseClient.ts`.

For an explicit read-only connectivity diagnostic, start Vite, open the local page,
and run this in the browser console:

```js
const { checkSupabaseConnection } =
  await import('/src/services/checkSupabaseConnection.ts')
await checkSupabaseConnection()
```

This reuses the configured client to list Storage buckets, returning only success
and HTTP status, never bucket metadata or configuration. It creates no resources
and does not run at application startup. Success verifies this API request, even
when no buckets exist; it does not verify application tables or RLS. A 401/403
indicates a credentials/access rejection; a null status means no HTTP status was
available. Client initialization rejects missing configuration before the request.

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run test:watch` watches tests; `npm run preview` serves a production build locally. CI results and deployed Cloudflare deep-link behavior must be checked separately.

## Shared UI

Import controls directly from `src/components/ui/`. Layout dimensions and variants reference the local Figma export; repository requirements control tokens, accessibility, and behavior. `ui.css` uses the tokens in `index.css`, responsive wrapping/grid layouts, and visible keyboard focus. Roboto is served from bundled Fontsource assets without a Google Fonts request.

| Component                                           | Usage                                                                                                                                                                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                            | Native button; `primary`, `secondary`, `text`, `danger` variants. Defaults to `type="button"`; use `type="submit"` deliberately. `loading` disables activation and sets `aria-busy`; callers provide meaningful button text. |
| `ButtonLink`                                        | Router link with button styling. Keep navigation as links and actions as buttons.                                                                                                                                            |
| `Form`, `TextField`, `TextAreaField`, `SelectField` | Native form semantics and input props; fields require a visible label. Optional hints/errors are associated with unique IDs. Use select children for options.                                                                |
| `RadioGroup`                                        | Controlled native radio cards with explicit `value: string \| null`, visible selected text, disabled/required states, and group errors. Selection invokes only the caller's callback.                                        |
| `Dialog`                                            | Controlled `open`, `title`, `description`, `onDismiss`, and optional children. Native modal behavior; Close/Escape request dismissal. Parent must set `open` false. Focus starts on Close and returns to the trigger.        |
| `SetupProgress`                                     | `step={1 \| 2 \| 3 \| 4}` for Introduction, Household, CAC support, Review. Noninteractive; states are expressed in text and `aria-current`.                                                                                 |
| `Navigation`                                        | Labeled router navigation from `{to, label}` items with active-link semantics. Used by `AppLayout`.                                                                                                                          |
| `PageSection`                                       | One page-level heading per route; supports an optional eyebrow. `PlaceholderPage` wraps it for unfinished pages.                                                                                                             |

Example (inside a router for links):

```tsx
<Form onSubmit={handleSubmit}>
  <TextField label="Title" name="title" required hint="Use a short title" />
  <Button type="submit" loading={saving}>
    Save
  </Button>
</Form>
```

The field components present caller-provided validation errors; they do not implement financial or authorization rules. The dialog intentionally performs no save/delete operation itself. No forms collect player finances or staff credentials in the placeholder pages.

## Domain, state, and services

- `types/domain.ts`: initial persona, scenario, choice, committed decision, snapshot, and result read models. Every edition record carries `versionId`; support availability/use are separate. `usdCents()` accepts only safe integer cents. This is representation validation, not an authoritative financial calculation engine.
- `state/simulationState.ts`: a pure UI reducer with restoration status, selected choice, error, and committed snapshot. Selection does not change money, decisions, assistance use, or progress. Loading/errors prevent selection; unknown choices and selections in ended runs are ignored. Request IDs prevent stale restore results from replacing newer state.
- `hooks/useSimulation.ts`: explicit restore and select callbacks; no automatic network calls or local-storage persistence. Restoration clears temporary choices on success and preserves the prior committed snapshot on failure.
- `services/simulationService.ts`: initial start/restore/submit interface. The default implementation raises `ServiceUnavailableError`; no method fabricates a successful run. Submit accepts IDs, edition, and request ID, never a client balance.
- `services/supabase.ts`: centralized lazy client entry point. Final RPC names, DTO validation, content relationships, and error mapping belong in future adapters here.

The read models and service contract are scaffolding, not finalized SQL/API schemas. Day ranges, edition/choice relationships, ownership, current scenario, support eligibility, affordability, and atomic/idempotent updates must be validated at the protected backend boundary. Extend the types from approved specifications as that work is implemented; never treat prototype fixtures as approved inputs. Browser state or a run ID alone is not authorization.

## Evidence and limits

### Landing-page browser verification

Run `npm run test:e2e` with Google Chrome installed. Playwright uses the local Chrome channel in headless mode and starts Vite at `127.0.0.1:4173`. The suite checks 1440px desktop, 768px tablet, 390px mobile, and 320px narrow-mobile layouts, asset loading, overflow/card overlap, console errors, keyboard/Play navigation, and external Learn/Donate navigation. External responses are intercepted, so these tests verify destinations without loading a third-party payment form. Screenshots are written under ignored `test-results/` directories.

The page's team-supplied copy lives in `src/pages/public/landingContent.ts`. Its approved external URLs live in `src/app/externalLinks.ts`. The logo is copied from the export; `src/assets/foodpantry2.png` is copied unchanged from the supplied `design/assests/foodpantry2.png`. The photo has no caption. The shared header in `layouts/AppLayout.tsx` contains only the logo and Learn About CAC, Explore Data, and Donate controls on every route. Its responsive styles live in `layouts/AppLayout.css`, so future pages inherit the same appearance. Both header/footer logo links return to the application landing route `/`. The hero provides Start simulation, Join a group, and a smaller Host a group link; `/data` remains a reserved destination reaching the fallback. Feature content remains unchanged; placeholders use the same shared header. The explanation cards use decorative house, receipt, and bar-chart icons. The layout follows repository tokens and team revisions rather than claiming pixel identity with the original prototype.

Tests cover route loading/history, keyboard navigation, the closed dashboard boundary, buttons, field associations, radio keyboard selection, dialog lifecycle wiring/focus restoration, progress semantics, service failure, and reducer separation/stale responses. Dialog methods are shimmed in jsdom: real browser focus containment, inert background behavior, and narrow-screen layout still require browser verification. No claim of pixel parity, backend policy enforcement, real Auth, or deployment is made by these tests.

The original export remains unchanged in `design/figma-prototype/`. It is outside the frontend build and supplies basic layout reference only.

The footer in `layouts/AppLayout.tsx` is shared by every route, including placeholders. Its complete responsive styling lives in `layouts/AppLayout.css`; future pages inherit the same CAC logo, tagline, contact links, future resource links, and Tax ID automatically.
