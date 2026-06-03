# 🗺️ GOLDEN MASTER SEO & PRE-PRODUCTION EXECUTION BLUEPRINT

**Project:** Hava Durumlari Data Engine & React Hub

**Target:** 2M+ Monthly Visitors | Sub-Second Latency | High-Volume EMD SEO

---

## 🟡 PHASE 1: Environment & Pipeline Separation

*Before executing new code, we must establish a safe Staging environment so the master branch can be tested without breaking the live preview.*

* [ ] **1.1 Provision Staging Subdomain:** In Hostinger hPanel, create `staging.hava-durumlari.tr`.
* [ ] **1.2 Clone the Database & Files:** Duplicate the current WordPress installation to the staging subdomain.
* [ ] **1.3 HTTP Basic Auth Shield:** Secure the staging subdomain with an `.htaccess` password to prevent Googlebot from accidentally indexing your staging site and causing duplicate content penalties.
* [ ] **1.4 Split the GitHub Actions Pipeline:** Update `.github/workflows/deploy.yml` to trigger deployments to the `staging` Hostinger directory when code is pushed to `main`, and only deploy to the `public_html` production directory when a specific GitHub Release or `production` branch is merged.

---

## 🟢 PHASE 2: Core Architecture Finalization & Debt Purge

*Ensure the new Virtual Route Interceptor is running cleanly with zero legacy interference.*

* [ ] **2.1 Validate Virtual Route Interceptor:** Ensure `sinan-weather-bridge.php` successfully catches `/hava-durumu`, `/deniz-suyu-sicakligi`, and `/kayak-merkezleri` natively returning a `200 OK` header without requiring WordPress Database pages.
* [ ] **2.2 Execute Technical Debt Purge:** Permanently delete legacy `pre_get_posts` hooks, `add_rewrite_rule` functions, and `redirect_canonical` overrides from the codebase.
* [ ] **2.3 Purge WordPress Anchor Pages:** Delete the dummy "Hava Durumu" page from the WP Admin dashboard and flush permalinks one final time to clear the `.htaccess` file.

---

## 🔵 PHASE 3: Dynamic SEO & JSON-LD Schema Engine

*Inject hyper-specific Structured Data directly into the `<head>` based on the active routing vertical to dominate rich snippets.*

* [ ] **3.1 Build the SEO Swapper Logic:** Inside `sinan-weather-bridge.php` (via the `wp_head` hook), read the `$matched_vertical` and output distinct `<title>` and `<meta name="description">` tags.
* [ ] **3.2 Implement Weather Schema (`/hava-durumu`):** Inject standard `WebPage` and `Dataset` JSON-LD schema to signal localized meteorological data to Google.
* [ ] **3.3 Implement Ski Schema (`/kayak-merkezleri`):** Inject `SportsActivityLocation` and `Resort` JSON-LD schema, utilizing snow depth and open trail metrics dynamically pulled from the JSON payload.
* [ ] **3.4 Implement Marine Schema (`/deniz-suyu-sicakligi`):** Inject `FAQPage` schema automatically answering the query: *"What is the water temperature in {Location} today?"* using the live payload data.

---

## 🟣 PHASE 4: EMD (Exact Match Domain) Network Routing

*Leverage high-volume domains (e.g., `istanbul-hava-durumu.tr`) as aliases to the core engine without triggering duplicate content algorithms.*

* [ ] **4.1 Configure Cloudflare Reverse Proxy (Recommended):** Set up a Cloudflare Worker for the EMDs. When a user hits `istanbul-hava-durumu.tr`, the Worker fetches the HTML from `hava-durumlari.tr/hava-durumu/istanbul` but keeps the EMD URL in the user's browser.
* *Fallback (Hostinger Alias):* Park the EMD as a domain alias in Hostinger, mapping it to the primary `public_html` root.


* [ ] **4.2 Dynamic Canonical Alignment:** Update the PHP bridge so that if the request arrives via an EMD alias, the `<link rel="canonical">` tag reflects the EMD itself, instructing Google to index the EMD as an independent, highly authoritative micro-site.
* [ ] **4.3 Provision Edge SSL:** Ensure Strict HTTPS is forced across all EMD aliases via Cloudflare or Hostinger Auto-SSL.

---

## 🟠 PHASE 5: Security, Performance & Analytics

*Lock down the infrastructure for scale and commercial data gathering.*

* [ ] **5.1 Secure the REST API Trigger:** Update `tedder-data-engine.php` to require a secure Hash Token (e.g., `?cron_token=YOUR_SECURE_HASH`) before executing the `sync-weather` endpoint. This prevents malicious bots from pinging your API and draining server CPU.
* [ ] **5.2 Analytics & Cookie Compliance Sync:** Implement Google Tag Manager (GTM). Ensure that React's `CookieBanner.tsx` consent state (Accept/Reject) is correctly passed to the GTM `dataLayer` so that Analytics tags only fire if KVKK/GDPR consent is granted.
* [ ] **5.3 Automated Error Tracking:** Implement **Sentry.io** (or similar) into the Vite/React build to catch and log any client-side JavaScript crashes when interacting with the JIT caching system.
* [ ] **5.4 SSD I/O Stress Test:** Execute a simulated load test (e.g., Loader.io) sending 5,000 concurrent virtual users to a single district URL to verify the 20-minute Tier-2 JIT cache holds strong without locking PHP workers.

---

## 🔴 PHASE 6: Launch & Indexing Operations

*Push the structured assets into Google's crawling pipeline for rapid discovery.*

* [ ] **6.1 WordPress Footer & Legal Pages:** Publish standard WordPress pages (Contact, About, Privacy Policy, KVKK) and ensure the GeneratePress footer links correctly point to them without triggering the React application.
* [ ] **6.2 Automated XML Sitemap Generator:** Write a script that routinely compiles all 81 provinces, 900+ districts, sea temperatures, and ski resorts into a hierarchical, compressed `sitemap.xml` file.
* [ ] **6.3 Google Search Console (GSC) Registration:** Verify the primary `hava-durumlari.tr` domain AND all EMD properties inside GSC.
* [ ] **6.4 Google Indexing API Integration:** Connect a Node.js or PHP script to the Google Indexing API to push batches of the 900+ long-tail district URLs directly to Googlebot for immediate indexing, bypassing the organic wait time.
