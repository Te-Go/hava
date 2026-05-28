# Hub Strategy Profile: Weather Network (hava-durumlari.tr)
Reference Document: "Web App Strategy: Turkish Market"

## 1. Intent & Monetization Paradigm
* Core Objective: Capture massive long-tail geographical search traffic to build an authoritative traffic base. Target high user retention metrics (3.0+ page views per session).
* Primary Monetzation: Phase 1 Google AdSense/Ezoic transitioning to premium ad networks.

## 2. Specific Feature Injections
* Programmatic Layouts: Implement "Havadan Konuşalım" conversational summaries generated programmatically.
* Localized Data Elements: Inject specialized widgets for coastal nodes, such as sea-water temperatures and marine wind matrices.
* Traffic Funneling (The Value Loop): Implement Contextual Neural Widgets. If the Centralized Data Engine detects an active >1% drop in precious metals via the Gold Hub API, inject an inline widget between paragraph blocks: "Piyasalarda hava nasıl? Gram Altın %1.2 düştü. Alım fırsatı mı? Canlı grafiği inceleyin."
* City Classification Matrix: Map out an automated city routing profile (`city-profiles.php`) that classifies Turkish regions into specific arrays:
  * `istanbul`: Classified as `['metro', 'coastal']` — activates traffic, ferry, bosphorus, and air-quality modules.
  * `ankara`: Classified as `['metro', 'inland']` — activates traffic, air-quality, and heating-index modules.
  * `antalya`: Classified as `['coastal', 'tourism']` — activates marine, uv-index, and beach-score modules.
  * `erzurum`: Classified as `['mountain']` — activates winter modules like ski-conditions, avalanche-risk, and heating-index.
  * `_default`: A standard fallback system targeting `['inland']` to output basic forecasts and regional text summaries.
* The Vitality UI Signal: Implement a lightweight `VitalityPulse` component. If the payload's `lastUpdated` timestamp is under 10 minutes old ($< 600000\text{ ms}$), render a green, CSS-animated blinking live dot wrapped in a text tag reading `CANLI`. If the data age exceeds 10 minutes, automatically convert the indicator to a muted grey text block displaying exactly how many minutes ago the data was captured (e.g., `X dk önce`).
* Widget Geometry Constraints: Enforce the explicit height contract table during frontend rendering to eliminate visual jumps:
  * Hero Module: Fixed at `320px`.
  * Traffic Widget: Fixed at `250px` (Accommodates 4 route items, exactly 45px each).
  * Marine Widget: Fixed at `220px` (Accommodates 3 ocean metrics, exactly 60px each).
  * Forecast Grid: Fixed at `600px` (Accommodates a 7-day extended grid, exactly 80px per row).
* User-Triggered Expansion Layouts: If a list contains more records than the fixed slot allows (e.g., more than 4 routes in the Traffic widget), the additional items must remain hidden. The agent must code a user-triggered button (e.g., `+X daha fazla`). Because this expansion is initiated manually by a user click, it is completely immune to negative Core Web Vitals CLS penalties.
