# Daymark

Daymark is a responsive calendar-assistant prototype. Its week view lays out days as columns and hours vertically, with separate all-day items. The sample schedule includes classes, free-food listings, birthdays, holidays, family plans, and events suggested from other apps.

## Run

Open `index.html` in a browser. No build step or package install is needed.

## Personalize

Open the gear or **Personalize calendar** in the sidebar to set a display name, week start, food preferences, favorite contacts, and which kinds of suggestions to show. These preferences and demo calendar edits are saved in that browser’s local storage.

Suggestions remain drafts until approved. Sample “Messages”, Contacts, campus, holiday, Gmail, and Outlook items are fictional demo data. Use **Manage connections → Import text** to paste an appointment SMS into a local draft; the browser cannot read phone messages directly. The Google and Outlook buttons do not sign in or read live accounts.

## Calendar tools

The calendar displays the full day. Events longer than midnight continue into the next date, and custom durations can be set up to 168 hours. Event categories choose a default priority (deadlines urgent, appointments high, regular events/classes normal, focus/special items low); each event’s priority can be changed in its form. When events overlap, only the highest-priority ones appear in those time segments. Search for a hidden event by name to bring it into view. Drag an event’s bottom grip to resize it in 15-minute steps, or focus the grip and use the arrow keys. Use the calendar search box to filter by event name, notes, or source. Star an event to mark it special; **Show special** hides or reveals all starred entries, and the × control removes an event.

**Scan syllabus** accepts text, Markdown, CSV, searchable PDF, and DOCX. It extracts likely dated classes, deadlines, exams, and office hours into an editable review list before saving them. Scanned-image PDFs and arbitrary schedules may not be recognized reliably, so review every suggested title, date, and time. PDF/DOCX reading loads document parsers from a CDN; extracted document contents are handled in the browser and are not uploaded.

## Real integrations

Live Google/Outlook access needs provider OAuth registrations, consent and permissions, and a secure backend for tokens and sync. Direct phone SMS access needs a native mobile app and OS permissions; this browser demo supports manual paste only. Reading messages or contacts requires explicit user consent and careful privacy controls; do not place client secrets or access tokens in browser code.