# GoLabour Smart Timesheet + Invoice Calculator

Version 1.2.0 has three separate pages: Timesheet, Calculator and Invoice.
The app keeps its existing logo, beige fields and charcoal panels. Exported
invoices have no GoLabour logo and place INVOICE at the top left.

## Upload to GitHub Pages

1. Extract `GoLabour_Complete_App_v1_2_0.zip`.
2. Open the existing `GoLabour` folder in your `Smart_Timesheet` repository.
3. Upload all contents of this ZIP’s `GoLabour` folder into that existing folder.
   Include `invoice.js`, `invoice.css`, the `icons` folder and all updated files.
4. Replace existing files, commit and wait for the GitHub Pages deployment.
5. Open online. Use **Update now** if shown, before filling a new timesheet.
   Export the current signed timesheet and save any invoice calculation first.

The address stays the same:
https://golabour-smarttimesheet.github.io/Smart_Timesheet/GoLabour/index.html

Confirm `invoice.js` and `invoice.css` appear next to `index.html` in the uploaded GitHub folder. The offline cache in `sw.js` must say `v1.2.0`. If those files are missing or the version is `v1.0.2`, the old release is still published.

There is only one `GoLabour` folder in the ZIP. Do not put it inside another
`GoLabour` folder. Preview pictures are separate downloads, not website files.

## Timesheet

The timesheet opens first. Its worker fields, additional-worker button,
supervisor sign-off, paid-hours calculation and PNG/print-to-PDF exports are
retained. Up to 15 workers can share a report only when the job, date and hours
match. Breaks are deducted and overnight shifts are supported. Editing details
after signing requires fresh sign-off.

Use the top **Calculator** and **Invoice** buttons to switch pages. Switching keeps the
current timesheet, signature and calculation in memory. Use **Timesheet** or
**Timesheet** to return. Browser back/forward also switches pages.
Each fresh visit still starts a blank timesheet; export it before closing.

Earlier saved timesheet copies remain in the collapsed **Previous copies on
this phone** section. This release never replaces or deletes their data.

## Calculator page

Enter each shift’s job name, job date, paid hours and hourly rate. Add another
shift stays below the last entry. Repeat any day and enter any number of
shifts, across different jobs and weeks. Enter decimal paid hours after removing
unpaid breaks: 8 hours 30 minutes is 8.5. Each shift has its own rate.
Amounts are rounded to cents per shift before being added together.

The calculator does not require a worker name, ABN or bank details. Its exported
photo includes only job/date/hour/rate/amount rows and the calculated total;
there are no FROM, BILL TO, ABN or payment-details blocks.

**Save calculation on this phone** keeps the current entries for later.
Reopen them in **Saved calculations on this phone**. Saving an opened copy
updates that copy; Start a new calculation begins another calculation.
There is no automatic saving on every keystroke. Previously saved calculations
from version 1.1.0 remain readable, including their old invoice job amounts.

**Create invoice using these amounts** copies only job names, dates and amounts
into the separate Invoice page. The hours and rates remain in the calculator.
The app asks before replacing existing invoice entries. After copying, edits
in either page are independent: use the copy button again if you want the
invoice to reflect later calculator changes.

## Invoice page

Enter your name, ABN, bank account name, BSB and account number, and set the
invoice date. Save my details remembers these fields on this phone.
The ABN is checked for 11 digits and its checksum, not current registration.

The fixed bill-to details are:

GoLabour Solutions
ABN: 82 676 721 136
invoice@golabour.com.au

For each job, enter its name/location, date and total dollar amount.
There are no hours or hourly-rate fields on this page. You can create an invoice
without using the calculator, or choose **Use calculator amounts**.

The actual invoice includes the worker’s name/ABN, invoice date, fixed bill-to
details, job names/dates/amounts, final total and bank details. It has no logo,
no hours or rates, no invoice number and no added GST. INVOICE is at the top left.

The invoice page includes GoLabour’s full supplied group-message instructions:
email recipient; Sunday 11:59 pm deadline; late invoices in the next payment
cycle; Wednesday payments; Zoho Invoice recommendation with a link; required
worker and job details; unpaid breaks; timesheets being separate from invoices;
and returned corrections by Tuesday 11:59 pm for Thursday payment. These
instructions are displayed on the page, not printed on the exported invoice.

The layout was reviewed against Zoho Invoice’s minimalist sample:
https://www.zoho.com/invoice/invoice-templates/sample/zoho-invoice-minimalist-template.pdf

## Saving and sending

- **Save calculator photo**: a readable breakdown of jobs, dates, paid hours,
  rates and amounts for checking or sharing with an accountant.
- **Save invoice photo**: opens a high-resolution PNG preview. On iPhone,
  touch and hold the picture and choose Save to Photos, or use
  **Save to Photos / Share** and select Save Image. A download can instead go
  into Files > Downloads. The website cannot write directly into Photos.
- **Save invoice PDF**: generates a real A4 PDF download directly, including
  multiple pages when needed. It works offline after the app is prepared.
- Long invoices have numbered pages in both formats. For photos, save every
  page; the PDF includes them all in one file.
- **Email invoice to GoLabour**: save the prepared PDF, then open an email with
  GoLabour’s address, subject and message already filled in. Attach the saved
  PDF and signed timesheets before sending. A website cannot attach a file to
  a `mailto:` link or automatically send it.
- On phones with file sharing, **Share PDF through your phone** sends the PDF
  into the share menu. Select the email app and enter GoLabour’s address;
  the share API cannot force the email recipient.

The Invoice page displays GoLabour’s supplied deadlines: Sunday 11:59 pm for Wednesday
payment; returned corrections by Tuesday 11:59 pm for Thursday payment. Late
initial invoices go into the next payment cycle. Follow updated company
instructions if its schedule changes. The app does not submit automatically
or guarantee a payment date.

## Phone installation and offline use

The **Add GoLabour to your phone** box remains near the top of the timesheet.
On iPhone, open the live address in Safari, select Share > Add to Home Screen,
and enable Open as Web App if shown. On Android, use Chrome’s Add to Home
screen / Install app option. Help is available through the header’s ? button.
The Home Screen and browser icons use the official GoLabour logo.

Open online once and wait for **Offline ready**. All three pages, saved local
calculations and photo/PDF exports then work offline. Email and WhatsApp
sending require a connection. Service-worker cache version is `v1.2.0`.
An app update preserves saved calculations and older timesheet copies.

Data stays in this browser on this phone; there is no account, cloud sync,
remote backup, accountant portal or automatic submission. Clearing browser
storage, switching browsers or using another phone will not show these saved
calculations. Export records you want to keep independently.

## Verification

Checked with mobile browser automation for repeated shifts on the same day,
different rates, exact cent rounding, validation, saved-data recovery, safe
storage failure, PDF/PNG generation, long-document pagination, addressed
email and file-sharing payloads, narrow/landscape layouts, offline reopening,
and upgrading from the previous version without losing older timesheet copies.
Native iPhone Photos, Mail and third-party email sharing menus still need a
check on your actual phone. Demo previews use sample payment details and
should not be submitted as real invoices.
