# GoLabour Smart Timesheet — single-page app

Version 1.0.2 opens directly on the familiar end-of-shift timesheet layout.
The Add GoLabour to your phone box sits above the worker fields. There are no
Home, Timesheet or Saved tabs and no bottom navigation bar.

## Publish to GitHub Pages

1. Extract `GoLabour_iPhone_App.zip`.
2. Open the existing `GoLabour` folder in the `Smart_Timesheet` repository.
3. Upload everything **inside** this ZIP's `GoLabour` folder to that same folder,
   including `icons`, `favicon.svg`, `favicon.ico`, `index.html`,
   `manifest.webmanifest`, `pwa.js`, `pwa.css` and `sw.js`.
4. Replace the existing files, commit the upload and wait for deployment.
5. Open the app online. If **Update now** appears, use it before filling in a
   new timesheet. Keep an exported PNG/PDF first if the current form is needed.

The website address remains:

https://golabour-smarttimesheet.github.io/Smart_Timesheet/GoLabour/index.html

The ZIP contains one `GoLabour` folder. Do not create a second `GoLabour` folder
inside the repository's existing one.

## Phone installation

Tap **Add GoLabour to your phone** near the top for instructions.

On iPhone, open the live link in Safari, choose **Share → Add to Home Screen**,
enable **Open as Web App** if shown, then tap **Add**. On Android, use Chrome's
**Add to Home screen / Install app** menu or the install prompt when available.

Open online once. Wait for **Offline ready** in the top status badge before
relying on offline use. Hours, signatures and image exports work offline after
the app is prepared. Sending through WhatsApp still needs a connection.

## Browser and phone icons

The Home Screen icons retain the full official GoLabour logo. Browser tab and
favourites icons use its distinctive go symbol, cropped from the same supplied
logo so it is readable at small sizes. Lettering and colours are not redrawn.

- `favicon.svg`: self-contained SVG with the original symbol embedded.
- `favicon.ico`: 16, 32 and 48-pixel browser fallbacks.
- `icons/favicon-32.png`: 32-pixel PNG browser fallback.
- `icons/apple-touch-icon.png`: iPhone Home Screen icon.
- Other `icons/icon-*` files: installable app icons.

Icon references include a new version query. Browsers may still retain a
previous favourite's cached icon. Reopen the updated page and, if needed, save
the favourite again. An existing iPhone Home Screen icon can also retain its
old image; add the updated page through Safari again to use the new icon.
Export important reports before removing an installed app or clearing its data.

## Timesheet workflow

1. Enter worker names, job site, date, start/finish times and break minutes.
2. Add notes if needed and obtain the supervisor's name and signature.
3. Save the signed photo, share it using the phone's share menu, or print/save
   the report as PDF. Include the invoice when sending to GoLabour.

Up to 15 workers can share one report if their site, date and hours match.
Add another worker stays below the last name. Beige fields and the dark
supervisor/Add Worker/Paid Hours colours are retained. Editing report details
after signing clears the old signature and requests a fresh sign-off.

## Local data

New visits start a fresh form. There is no new automatic draft saving and no
new device-copy saving button. Save the signed photo/PDF before closing the
page if the report must be kept. There is no account, cloud database, automatic
submission or cross-device sharing.

Existing copies and drafts from the earlier version are left untouched. Only
phones that already have readable copies show a collapsed **Previous copies
on this phone** section below the form. Open a copy there to export or share
it. Opening or editing it does not replace its stored original. The section is
hidden for new visitors, and there is no separate Saved screen.

## Validation

The release is checked in mobile Chromium emulation for the single-page
layout, top install box, install help, hours, additional workers, supervisor
signature, signed PNG export, native-share file payload, printable report,
offline restart, icon loading, and upgrade recovery of earlier local copies.
Native iPhone installation, browser favourite caching and WhatsApp's own share
menus still need a check on the actual phone/browser.

## Future updates

Increase the cache version in `sw.js` when publishing changes. Current cache
version is `v1.0.2`. This installs a complete new offline shell and offers an
update. Only this app path's older caches are removed; existing report data is
kept separately and this release never writes or deletes that data.

Invoice calculation and shift features can be added later without changing the
current timesheet link.
