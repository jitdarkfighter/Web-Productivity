Yes. With those decisions, the prompt is much more concrete. I'd give the developer/Claude this:
Build a Firefox WebExtension that acts as a browser wellbeing/activity tracker, similar to Samsung's Wellbeing tracker.
Core functionality
Track the user's browsing activity and provide daily analytics for each domain.
For each domain, track:
- Active time spent on the domain
- Number of visits
- Number of link clicks
Example dashboard:
Website        Time       Visits    Clicks
YouTube        42 min     18        35
Reddit         31 min     12        21
Google         18 min     25        14

Visit tracking
A visit should be recorded when:
- A new browser tab is opened and loads a URL.
- The user navigates to a different URL.
- The user navigates to a different page within the same domain.
Visits should ultimately be aggregated by domain.
For example:
youtube.com/
youtube.com/watch/abc
youtube.com/watch/xyz

should all contribute to the youtube.com statistics.
Time tracking
Track active time only.
Time should be counted only when:
- The tab is currently active.
- The browser window is active/visible.
Stop counting when:
- The user switches to another tab.
- The user switches to another window/application.
- The browser window becomes inactive.
If the user returns to the tab later, tracking should resume.
Example:
YouTube: 10 min
→ switch to Reddit
Reddit: 5 min
→ return to YouTube
YouTube: 5 min

Total YouTube time = 15 minutes.
Click tracking
Count link clicks only.
A click should be counted when the user clicks a link that causes a new page/URL to open or load.
The click should be attributed to the domain where the click occurred.
For example:
youtube.com
    ↓ click video
youtube.com/watch/123

adds 1 click to youtube.com.
Do not count:
- Buttons
- General mouse clicks
- Non-navigation interactions
If a link opens in a new tab, it should still count as a click for the originating domain.
Daily analytics
Analytics should be organized by day.
The current day's counters should reset at 12:00 AM local time.
Previous days should retain their final aggregated analytics, for example:
October 5
YouTube    42 min    18 visits    35 clicks
Reddit     31 min    12 visits    21 clicks

October 6
YouTube    15 min     7 visits    12 clicks

Storage & privacy
- All data must be stored locally on the user's machine using Firefox's storage APIs.
- No browsing history, analytics, URLs, or other tracking information should be sent to an external server.
- The extension should work completely offline.
- Data should persist across Firefox restarts.
UI
Provide a browser-extension popup showing:
- Today's total browsing time
- Today's statistics grouped by domain
- Time spent
- Visit count
- Click count
Also provide a way to view analytics from previous days.
Technical requirements
- Use the standard Firefox WebExtensions API.
- Use a background/service-worker component for tracking.
- Use appropriate browser APIs such as tabs, webNavigation, storage, and window/tab activity APIs where appropriate.
- Keep the code modular and well documented.
- Include instructions for loading and testing the extension temporarily in Firefox.
