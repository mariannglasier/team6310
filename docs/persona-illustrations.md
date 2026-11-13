# Adding or replacing a persona illustration

Use this guide when you have a new household drawing, or want to replace an
existing one. You do not need to change the component that displays illustrations.
Artwork lives in the frontend; this procedure does not create a playable persona
or change any persona data, finances, or gameplay rules.

Each illustration is used in two ways:

- **Household card:** the wide picture above the household's name during selection.
- **Profile:** the small circle (or semi-wide oval) in individual and group play.

One SVG file holds the drawing and both views. The picture's shapes, colors and
lines are shared; only the framing changes.

## 1. Put the drawing in the right folder

Save SVG files in `frontend/src/assets/personas/`. Existing files are `alex.svg`,
`jordan.svg`, `patricia.svg`, `sofia.svg`, and `generic.svg`.

Use a short lowercase filename, such as `dana.svg`. Avoid spaces. To replace an
existing illustration, edit its file in place; its registration can stay as it is.
Keep `generic.svg`: it is the fallback for names without a registered picture.

SVG is a vector format. Use your drawing editor's SVG export, or copy an existing
file as a starting point. Include the colors and stroke settings inside the SVG;
an image cannot pick up the site's CSS rules for its internal drawing shapes.
Keep the artwork self-contained, without links to other image or font files.

## 2. Keep the wide household-card view

Open an existing SVG in a text editor. Its outside wrapper looks like this:

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 320 168"
     preserveAspectRatio="xMidYMax meet">
  <!-- The profile view goes here, followed by the drawing's shapes. -->
</svg>
```

Think of `viewBox="0 0 320 168"` as a drawing board 320 units wide and 168 units
high, starting at horizontal position 0 and vertical position 0. These units are
not screen pixels: the browser scales them to fit each card.

Keep this wide view for household cards. Centre the household within it, and put
the base of the figure near vertical position 168. `xMidYMax meet` keeps the
drawing horizontally centred and aligned to the bottom without stretching it.
Changing this outside view also changes household selection, so do not adjust it
just to fix the small profile.

## 3. Define the square profile view

Inside the wrapper, before the drawing, include:

```xml
<view id="profile"
      viewBox="60 -32 200 200"
      preserveAspectRatio="xMidYMax meet" />
```

The four numbers mean **left, top, width, height**. This example gives a square
200 units on each side, with its horizontal centre at 160. Its bottom is
`-32 + 200 = 168`, matching the figure's base. The negative top is intentional:
it leaves breathing room above the head while bringing the body to the bottom.

The household card loads `dana.svg`; a profile loads `dana.svg#profile`. Keep the
ID spelled exactly `profile`, or the small display will use the wide view again.
The site bottom-aligns profile images inside their existing containers. That
cannot remove blank space _inside_ a drawing, so the view's bottom must also
match the figure's base.

To fit a different drawing, choose a square side length **S** and a baseline
**B** (the vertical coordinate where the body ends). Set the top to **B − S**.
For a drawing centred at horizontal coordinate **C**, set the left to **C − S/2**.
A larger square shows more surroundings and makes the people smaller. A smaller
square zooms in. Do not stretch the shapes or change the global circle sizes.

## 4. Check households with more than one person

Use `jordan.svg` as a reference for two people. Its profile view is:

```xml
<view id="profile"
      viewBox="48 -57 224 224"
      preserveAspectRatio="xMidYMax meet" />
```

This wider square includes both Jordan and Maya. Both figures end at 167, so the
view ends at `-57 + 224 = 167`. Centre the composition around **both** people,
rather than centring only the adult's face. Keep every head, hairstyle, and face
inside the curved boundary. The circular crop naturally trims some clothing
near its lower corners; avoid cropping faces or hiding the second person.
Always inspect the 48px mobile profile as well as the larger desktop version.

## 5. Register the illustration and choose its background tone

Open `frontend/src/components/simulation/avatars.ts`. There are only two additions:

1. Import the SVG near the other imports.
2. Add one entry to `personaIllustrations`, containing the image and its tone.

Set `tone` to the actual six-digit hex color you want, starting with `#`, such as
`#e4ead9`. It sets the household-card background, not the colors of the people.
It is not a CSS class name or alias: the color is stored beside the image in this
registration and applied directly by `HouseholdCarousel.tsx`. You do not need to
edit a stylesheet or a separate list of color names. Profile containers keep
their shared background; their color does not come from `tone`.

For reference, the current colors are Alex `#dcebf9` (light blue), Jordan
`#fbe5e3` (light rose), Patricia `#e4ead9` (light green), Sofia `#ebe4f5`
(light violet), and generic `#e9e9e9` (light grey).

The entry's name is the lowercase **first word** of the persona's display name.
For example, `dana` matches `Dana`, `DANA Smith`, and `Dana & Lee`. Recognition
ignores surrounding spaces and splits at spaces, commas, and ampersands. Two
households sharing the same first word therefore share one illustration.
Unrecognized names use the generic image and its light-grey background.

The recognized-name type and image/tone lookup come from this registration.
Do not add a separate name list, type-union entry, tone list, or rendering branch.

## Example: a hypothetical persona named Dana

This example does **not** add Dana to the database or make her selectable in the
application. It shows how to prepare artwork if Dana is added separately.

1. Copy `frontend/src/assets/personas/generic.svg` to
   `frontend/src/assets/personas/dana.svg`.
2. Replace the copied drawing with Dana's illustration, retaining the outside
   `0 0 320 168` view. If her body ends at 168, the square profile view
   `60 -32 200 200` is a useful starting point. Adjust it if her composition needs
   more room. Keep the fills and strokes inside the file.
3. In `avatars.ts`, add this import:

   ```ts
   import dana from "../../assets/personas/dana.svg";
   ```

4. Add this line inside `personaIllustrations`, beside the existing households:

   ```ts
   dana: { src: dana, tone: '#e4ead9' },
   ```

That is the complete registration change. Leave the existing five registrations,
fallback, component, and CSS alone. No other TypeScript definition needs editing.

## 6. Verify the result before submitting

Start the frontend normally with `npm run dev` from `frontend/`. A new illustration
appears only when an existing selectable persona's name matches its registration;
adding the file does not create that persona. For a hypothetical example, inspect
the SVG by itself first, then use a mocked browser fixture with that name. Do not
rename real personas just to test artwork.

Check these views at **1440, 768, 390 and 320px** browser widths:

- Household selection: the wide composition, original card dimensions, background
  tone, name, and selection controls should still fit.
- Individual play: the figure should rest at the profile's bottom, with no empty
  strip below it and no clipped head or face.
- Group participant view: check the same framing; its semi-wide sidebar has a
  different available width from the individual sidebar.
- Multiple-person artwork: make sure every person is recognisable at mobile size.
- An unregistered name: it should still show the generic illustration.

The existing profile limits are 88px on wide screens and 48px on narrow screens;
the semi-wide frame is fluid, up to 160px wide with a 1.5 aspect ratio. Preserve
these dimensions and breakpoints. Inspect actual rendered pictures, not only
whether an image element exists.

Run the normal checks from `frontend/`:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e -- e2e/persona-avatars.spec.ts e2e/setup-stage.spec.ts e2e/financial-tracking.spec.ts
```

The browser tests use mocked API responses; they do not create database records.
`e2e/persona-avatars.spec.ts` lists the display names used by its fixtures. Add
Dana to that list when checking her artwork, so all four viewport projects cover
her household card and both profile contexts. Screenshots are written to the
Playwright output directory. If Chrome is unavailable and Chromium is installed,
set `LOCAL_CHROMIUM_PATH` to its executable when running the browser tests.

Prettier's default scan skips SVGs. If formatting an SVG explicitly, use
`npx prettier --parser html --write src/assets/personas/dana.svg` from `frontend/`.

# A Human Comments

Im pretty sure you can use .pngs in the avatars.ts file. I don't see why not.
