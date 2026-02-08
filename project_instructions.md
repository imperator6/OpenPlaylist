## PROJECT INSTRUCTIONS (GLOBAL – ALWAYS APPLY)

## Purpose
This file defines non-negotiable global rules for all code generated in this project.
All instructions below must be followed unless explicitly overridden.

## GENERAL PRINCIPLES
- Write clean, readable, maintainable code.
- Prefer clarity over cleverness.
- Follow modern best practices.
- Avoid unnecessary complexity or dependencies.

## FRONTEND & UI RULES
- All web pages MUST be mobile-first and responsive.
- The UI must work correctly on small screens (≥360px wide).
- No horizontal scrolling or zooming should be required on mobile.
- Do NOT use fixed widths for layout containers.
- Prefer CSS Flexbox and CSS Grid.
- Use relative units (%, rem, em, vw, vh) instead of px when possible.

## MOBILE USABILITY
- Inputs must not require retyping after form submission.
- Forms should preserve user input on validation errors.
- Touch targets must be finger-friendly (minimum ~44px height).
- Avoid hover-only interactions; mobile must be fully usable without hover.
- Text must remain readable without zooming.
- On iOS Safari, ensure input font size is 16px or larger to prevent auto-zoom.

## ACCESSIBILITY (A11Y)
- Use semantic HTML elements where possible.
- Ensure sufficient color contrast.
- Inputs must have labels.
- Buttons and interactive elements must be keyboard accessible.
- Avoid relying solely on color to convey information.

## CSS & LAYOUT
- Use mobile-first media queries (min-width).
- Avoid absolute positioning unless necessary.
- Avoid hard-coded heights that may break on small screens.
- Layout must adapt gracefully to different screen sizes.

## JAVASCRIPT
- Use modern JavaScript (ES6+).
- Avoid blocking the main thread.
- Do not break functionality on mobile devices.
- Handle errors gracefully.

## SPOTIFY API (SERVER-ONLY)
- All calls to the Spotify Web API MUST be done on the server (never in browser JS).
- The client may only call local server endpoints (e.g., /api/...) that proxy Spotify requests.
- Use server-side caching for frequently polled data (e.g., playback/queue) to reduce Spotify rate-limit risk.
- Never expose Spotify access tokens, refresh tokens, or client secrets to the client.
- If a new feature needs Spotify data, create/extend a server endpoint first, then update the client to use it.

## APP DOCUMENTATION (MANDATORY)
- Maintain a short, high-level app summary in APP_SUMMARY.md (Markdown).
- After any technical change, update APP_SUMMARY.md if behavior, routes, data flow, or UI features changed.
- Keep it concise and structured so another AI can rebuild the app from scratch.

## SERVER-SIDE LOGGING (MANDATORY)
- All server-side applications MUST implement structured logging.
- Use log levels consistently: DEBUG, INFO, WARN, ERROR.
- Do NOT use console.log for production logging.
- Whenever the server calls the Spotify API, emit a DEBUG log message that clearly indicates it is connecting to Spotify.
- Logs must include:
  - Timestamp (ISO 8601)
  - Log level
  - Service or module name
  - Message
- Errors MUST log:
  - Error message
  - Stack trace (when available)
  - Relevant request or operation context

## LOGGING IMPLEMENTATION PATTERN
This project uses a structured logging system in `server/server.js`:

**Available Functions:**
- `logDebug(message, context)` - For debugging information (e.g., state changes, detailed flow)
- `logInfo(message, context)` - For normal application flow (e.g., startup, successful operations)
- `logWarn(message, context, err)` - For recoverable issues (e.g., missing optional data, retries)
- `logError(message, context, err)` - For failures requiring investigation

**Usage Pattern:**
```javascript
// Simple log
logInfo("Server started successfully", { port: PORT });

// With context object
logDebug("activePlaylistImage overwrite in /api/queue/playlist/load", {
  old: previousValue,
  new: newValue,
  playlistId: playlistId
});

// With error
logWarn("Failed to persist session store", null, err);
logError("Spotify API request failed", { endpoint: "/v1/me/player" }, err);
```

**Context Parameter:**
- Pass an object with relevant key-value pairs
- Values are automatically JSON-stringified if objects
- Null values are logged as "null"
- Undefined values are skipped

**When to Use:**
- DEBUG: State changes, conditional branches, detailed flow tracking
- INFO: Successful operations, startup/shutdown, major milestones
- WARN: Unexpected but recoverable situations, missing optional data
- ERROR: Failures, exceptions, operations that need investigation

## SECURITY & PRIVACY (LOGGING)
- NEVER log sensitive data:
  - Passwords
  - Authentication tokens
  - API keys
  - Personal identifiable information (PII)
- Sanitize or redact user input before logging if necessary.
- Logging must not expose internal system secrets.

## LOGGING BEHAVIOR
- Use INFO logs for normal application flow.
- Use WARN logs for recoverable or unexpected situations.
- Use ERROR logs for failures that require investigation.
- Avoid excessive logging in high-frequency code paths.
- Logging must not significantly impact performance.


## OUTPUT EXPECTATIONS
- Generated code should be production-ready unless stated otherwise.
- Do not include placeholder TODOs unless explicitly requested.
- If assumptions are required, choose reasonable defaults and proceed.

## IMPORTANT
These rules have higher priority than individual task instructions.
If a task conflicts with these rules, ask me.




## PWA REQUIREMENTS
- PWA-enabled apps MUST include a valid `manifest.webmanifest` with app name, icons, `start_url`, `scope`, and display mode.
- Register a service worker for core static assets; do not cache `/api/*` responses unless explicitly required.
- Include install metadata on all entry HTML pages (`manifest`, `theme-color`, and Apple touch/meta tags).
- PWA features must degrade gracefully when service workers or install prompts are unsupported.
- When any cached static asset changes (HTML, CSS, JS), bump the `APP_CACHE` version string in `public/sw.js` so the service worker invalidates stale caches on the next install.
