# GoLabour Smart Timesheet — iPhone home-screen app

This is a working, static web app for your existing GitHub Pages timesheet.
It uses the GoLabour dark green, sand, beige and cream layout, with Home,
Timesheet and Saved screens and a fixed bottom navigation bar.

## Upload to your existing GitHub Pages site

1. Extract `GoLabour_iPhone_App.zip`.
2. Open your `Smart_Timesheet` repository on GitHub, then open its `GoLabour` folder.
3. Choose **Add file → Upload files**.
4. Upload all the files **inside** this ZIP's `GoLabour` folder, including the
   `icons` folder. Keep them directly inside the repository's existing `GoLabour`
   folder so the current URL remains correct.
5. Commit the upload and wait for the GitHub Pages deployment to finish.

Your app link is:

https://golabour-smarttimesheet.github.io/Smart_Timesheet/GoLabour/index.html

The app changes appear on that link after the new files are uploaded.

## Install on your iPhone

1. Open the live link above in **Safari**.
2. Tap the page menu or **Share** button.
3. Choose **Add to Home Screen**.
4. Turn on **Open as Web App** if shown, then tap **Add**.
5. Open GoLabour from its new Home Screen icon while connected to the internet.
6. Wait for **Offline ready** before relying on offline access.

Use the `?` button inside the app to see these instructions again.
Installation uses the live HTTPS page. The ZIP supplies the files to publish.
An Apple Developer subscription and App Store submission are not required for
this home-screen web app.

## What works

- Home, Timesheet and Saved screens.
- Up to 15 workers on one report when their site, date and hours are identical.
- Add another worker stays below the last worker field.
- Beige input fields and dark green Add Worker / Supervisor / Paid Hours panels.
- Paid-hour calculations, including overnight shifts and break subtraction.
- Finger, stylus and mouse signature drawing.
- Signatures remain when the screen resizes or a stored draft is reopened.
- Editing report details clears the old signature and requests a new sign-off.
- Signed PNG image preview and download / native share where supported.
- Printable report for saving as PDF through the device's print/share interface.
- Optional draft saving on this device; **off by default** for shared phones.
- Keep up to 20 signed copies in Saved, open/export them later, or remove them.
- Offline use after the app shell has been cached during an online visit.
- Official GoLabour logo app icons, standalone display and safe-area spacing for iPhone screens.
- Explicit update prompt when a newer app version is ready.

## Data and sharing

The app has no login, server database or cloud synchronisation. Drafts and saved
copies are stored locally under this app's path. Clearing browser/app data can
remove them. Save the signed PNG or PDF elsewhere when a report must be kept.

“Keep a copy on this phone” stores a signed report locally. It does not submit it
to GoLabour or post it in a WhatsApp group. The worker selects the destination
and sends the report through their phone's share interface. Actual WhatsApp
delivery requires a connection. Continue the existing instruction to send the
completed timesheet together with the invoice.

If local storage is blocked or full, the form and image export continue working,
and a storage message appears. Old saved reports are not silently removed to
make room for new ones.

## Checks completed

The app was checked in Chromium with a 390 × 844 mobile viewport, plus 320-pixel
width and landscape layouts. Checks covered navigation, installation help,
draft opt-in/out, multiple workers, hours, sign-off, PNG generation, the share
file payload, printable/PDF layout, saved copies, draft/signature recovery,
offline restart and image export, storage failures, fresh sign-off after edits,
record removal/cancellation, reset and the 15-worker limit.

The native Safari installation and iPhone/WhatsApp share menus still need an
on-device check. Chromium emulation does not reproduce those native menus.

## Updating the app later

When changing the published files, increase the version in `sw.js` (for example,
`v1.0.1` to `v1.0.2`). This creates a complete new offline cache. The app offers an
Update button and preserves an enabled draft before reloading. Saved records
and drafts use separate storage keys from the cached app files.

### Logo icon update — version 1.0.1

The app icons use the full official logo from the supplied `logo.png`, without
redrawing or changing its lettering or colours. Only its transparent outer
padding is cropped. A dark green background keeps the pale logo readable.
The maskable icon keeps the logo inside the central safe area.

Upload the complete updated `GoLabour` folder contents to the existing folder,
including `icons`, `index.html`, `manifest.webmanifest` and `sw.js`. Open the app
online and tap **Update now** when offered. An existing iPhone Home Screen icon
may retain its old image; open the updated link in Safari and use **Add to Home
Screen** again to pick up the new logo. Before removing an existing installed
app or clearing its data, export any saved reports you need to keep.

## Main files

| File | Purpose |
| --- | --- |
| `index.html` | Home, timesheet form, saved screen and install help |
| `app.js` | Timesheet calculations, signatures, validation and exports |
| `pwa.js` | App navigation, optional drafts, saved copies and update handling |
| `style.css` / `pwa.css` | Original branding and mobile app layout |
| `manifest.webmanifest` | App identity and Home Screen settings |
| `sw.js` | Versioned offline app cache |
| `logo.png` / `icons/` | Local branding and app icons |

The older header decoration source files are retained with the supplied layout;
the new app does not require them for its workflow.
