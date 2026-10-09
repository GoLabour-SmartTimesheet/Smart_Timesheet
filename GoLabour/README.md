# GoLabour — End-of-Shift Timesheet (group workers update)

This is the working GoLabour Timesheet (including the fixed **Save signed photo** preview and the **Company name:** box), now with a group-timesheet option.

## What's new

- Start with **one empty Worker full name** field.
- Tap **+ Add another worker** to add more names (up to 15). Remove a name with the **Remove** button.
- All listed workers share **one location, shift date, start, break, finish, calculated hours and supervisor approval**.
- **One signature** approves the whole group. Every name appears in the **photo**, **WhatsApp-shared image**, and **Print / Save as PDF** versions.
- Both supervisor full name and **Company name:** remain side by side.
- Inputs start blank for each new timesheet. The final WhatsApp tip still ends: *Important: Send your completed, signed timesheet together with your invoice.*

**Important:** Use one group timesheet only when every worker has exactly the same location, shift date, start time, break minutes and finish time. If their shifts differ, use separate timesheets. All workers in a group receive the same calculated hours.

## Update GitHub Pages

1. Extract the ZIP.
2. At <https://github.com/iroves/go>, replace the three files in the repository root: `index.html`, `style.css` and `app.js`.
3. Commit the changes and wait for GitHub Pages to deploy.
4. Refresh <https://iroves.github.io/go/index.html> and test adding two workers, signing and saving a photo.

No backend required. This website runs locally in the worker's browser and does **not** automatically send or centrally save the timesheet. Workers must share the signed image with their WhatsApp group. Signatures are not independently authenticated.
