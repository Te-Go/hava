# Pre-Deployment Full Test Plan

This document outlines the comprehensive test plan to verify the application's readiness for deployment. This covers data integrity, business logic, UI/UX consistency, and critical SEO structures.

## Phase 1: Core Weather Data & Data Flow

### 1.1. Data Accuracy & Fallbacks
- [x] **Zero Value Handling**: Verify that 0°C temperatures, 0 UV Index, and 0mm Rain don't trigger "missing" fallbacks (e.g., ensure no 20°C / UV 5 defaults appear).
- [x] **Current Conditions**: Compare "Hero Dashboard" data with "Bento Grid" metrics (Wind, Humidity, Pressure) for consistency.
- [x] **Hourly Trend**: Check the hourly chart smooths correctly across midnight.
- [x] **Daily Forecast**: Verify the next 7 days in the list match the API expectations (no missed days).

### 1.2. Forecast Drawer (Detailed View)
- [x] **Open/Close Logic**: Click on every day in the 15-day list. Ensure:
  - The correct drawer opens.
  - No "wrong day" data is shown (verified by checking the date in the drawer header).
- [x] **Hourly Data in Drawer**: Ensure data populates for all 15 days (especially days 7-15).
- [x] **Legend**: Confirm the new legend (Temperature, Feels Like, Rain, Wind) appears and matches chart colors.

### 1.3. City & District Switching
- [ ] **City Search**: Search for "Istanbul", "Ankara", "Izmir". click result -> URL updates -> Data updates.
- [ ] **District Logic**: Navigate to a URL like /hava-durumu/istanbul/kadikoy. Verify:
  - Breadcrumb shows "İstanbul > Kadıköy".
  - Data is specific to Kadıköy coordinates (if API supports) or falls back gracefully.
- [ ] **Recent Cities**: Check that searching/visiting a city adds it to the "Last Visited" or local storage history.

## Phase 2: Business Logic & Verbal Summaries

### 2.1. "Havadan Konuşalım" (Smart Summaries)
- [x] **Smart Phrase Logic**:
  - Rain: If rain > 30%, verify phrase warns about rain/umbrella.
  - Wind: If wind > 30km/h, verify phrase warns about wind.
  - Heat/Cold: Verify extreme temp phrases trigger correctly.
- [x] **Commentary Grid**:
  - Verify "Sıcaklık", "Rüzgar", "Nem" cards show text descriptions matching the numeric data (e.g., "Nemli" for >60%).

### 2.2. FAQ Generation (SEOFAQSection)
- [x] **Dynamic Answers**: Read the FAQs for the current city.
  - "Bugün hava nasıl?": Answer must match current temp/condition.
  - "Hafta sonu nasıl?": Answer must accurately summarize Sat/Sun data (e.g., correct range).
  - "Yağmur var mı?": Answer must be "Evet" if rain prob > 30% in next 7 days, else "Hayır/Beklenmiyor".

### 2.3. Forecast Accuracy
- [x] **Accuracy Banner**: In 'Today' view, check if the "Tahmin Doğruluğu" banner appears (if data available).

## Phase 3: "Islands" (Specialized Widgets)

### 3.1. Tourism Konforu (Fixed)
- [x] **Consistency**: Verify again that Tourism temperature/UV matches the main dashboard exactly.
- [x] **Advice Logic**: Check if the text advice makes sense for the conditions (e.g., "Güneş kremi sürün" if UV > 5).

### 3.2. Traffic & Marine
- [x] **Traffic**: Check Istanbul (should show Traffic widget). Check a rural city (should correctly HIDE or show Hub data).
- [x] **Marine**: Check a coastal city (Izmir/Antalya) -> Marine widget appears. Check Ankara -> Marine widget HIDDEN.

### 3.3. New Islands (Ski, Agriculture, Fire)
- [x] **Ski**: Visit a ski city (Bursa/Uludağ, Erzurum/Palandöken). Verify Ski widget loads.
- [x] **Agriculture**: Visit an agricultural hub (Konya, Adana). Verify Agriculture widget loads.
- [x] **Fire Risk**: Verify logic (only shows if risk is high or in season? Check implementation).

## Phase 4: SEO & Metadata (Hybrid Approach)

### 4.1. WordPress Primary Pages (Major Cities & Legal)
- [x] **WP Meta & Titles**: Verify that RankMath/Yoast in WordPress outputs the correct `<title>` and `<meta description>` for these static pages (e.g., /istanbul, /gizlilik-politikasi) BEFORE React loads.
- [x] **React Override Prevention**: Ensure React (`react-helmet` or similar) does NOT overwrite the WordPress-generated SEO tags on these pages to prevent indexation conflicts.
- [x] **Static Schema**: Verify that WordPress provides the initial Schema.org markup for these major cities and footer pages.

### 4.2. React Dynamic Pages (Minor Cities)
- [x] **Dynamic Titles**:
  - Minor City: [City] Hava Durumu...
  - Tomorrow: [City] Yarınki Hava Durumu...
  - 15 Days: [City] 15 Günlük...
- [x] **Canonical Tags**: Ensure self-referencing canonicals are accurately generated via React for non-static minor cities.

### 4.3. Schema Markup (JSON-LD)
- [x] **WeatherForecast**: Verify structure includes valid dates, times, and location for dynamic pages.
- [x] **FAQPage**: Verify strictly matches the visual FAQ content.
- [x] **BreadcrumbList**: Verify hierarchy (Home > City > [District]).

## Phase 5: UI/UX & Responsive

### 5.1. Layout
- [ ] **Mobile View**: Resize browser to 375px/412px.
  - Check Ad placement (no overflow).
  - Check Forecast Drawer readability.
  - Check Island widgets stacking.
- [ ] **Desktop View**: Verify sidebar ads and grid layout.

### 5.2. Theme
- [ ] **Dark Mode**: Toggle theme. Check for unreadable text (e.g., dark text on dark background) in new areas like the Legend or Tourism widget.

## Phase 6: Edge Cases & Error Handling

### 6.1. Navigation
- [ ] **Back/Forward**: Navigate City A -> City B -> Back. Ensure City A data reloads without page refresh.
- [ ] **Direct URL Access**: Paste a deep link (e.g., /hava-durumu/ankara/15-gunluk) into a new tab. Verify it loads correctly.

### 6.2. Missing Data
- [ ] **Invalid City**: Try /hava-durumu/invalid-city-name. Verify graceful error or redirect (not crash).

## Phase 7: WordPress & Hostinger Integration

### 7.1. React & WP Handshake (Shortcode/Embed)
- [ ] **Data-City Attribute**: Verify that the WordPress shortcode correctly passes the city slug to the React app via `data-city` attribute upon mounting.
- [ ] **Routing Conflict Check**: Ensure navigating via React Router to a minor city doesn't trigger a WordPress 404, or correctly routes through a fallback page.

### 7.2. Hostinger Pro & LiteSpeed Caching
- [ ] **HTML Page Cache**: Verify the WordPress shell (header, footer, empty root div) is cached by LiteSpeed and delivered instantly (TTFB < 200ms).
- [ ] **API Freshness**: Verify that React API requests bypass LiteSpeed page caching and correctly fetch fresh weather data.
- [ ] **Asset Loading**: Verify that the generated Vite JS/CSS assets are correctly minified and served via Hostinger's CDN (with Brotli compression active).

## Phase 8: Junior Developer Guide: WP Hybrid Setup

This section outlines the exact steps for deploying the React app inside our WordPress/Hostinger environment. **Follow these steps carefully; missing one will break routing or SEO.**

### Step 1: Vite Build & Asset Pathing
- **Action:** Open `vite.config.ts`. Ensure `base` is set to the exact folder path where the React assets will live in the WordPress theme directory (e.g., `base: '/wp-content/themes/generatepress-child/react-app/'`).
- **Action:** Ensure `build.manifest: true` is set in Vite.
- **⚠️ Common Mistake:** Forgetting to update the base path. If you build with `base: '/'`, WordPress will look for `main.js` at the root of the domain, not in the theme folder, resulting in 404s and a blank white screen.

### Step 2: WordPress Shortcode Setup (Major Cities)
- **Action:** In WordPress, navigate to your major city pages (e.g., Pages -> "İstanbul Hava Durumu").
- **Action:** Insert the shortcode block: `[weather_app city="istanbul"]`.
- **Action:** Using RankMath/Yoast, manually write the SEO Title and Description for this page.
- **⚠️ Common Mistake:** Typos in the city slug within the shortcode. The slug must exactly match what the React app expects (e.g., "istanbul", not "Istanbul").

### Step 3: WordPress Minor City Catch-all Routing
- **Action:** In `functions.php`, register a rewrite rule to catch `/hava-durumu/(*)`. 
- **Action:** Point this rule to a specific PHP template (e.g., `single-hava-durumu.php`).
- **Action:** Inside that PHP template, output the HTML shell: `<div id="weather-app" data-city="<?php echo esc_attr($queried_city); ?>"></div>`.
- **Action:** Within the `<head>` of this template, echo out the dynamic `<title>` and `<meta description>` based on the `$queried_city` slug.
- **⚠️ Common Mistake:** Allowing React to handle the URL without a WordPress rewrite rule. If someone goes directly to `/hava-durumu/trabzon` and WordPress doesn't know about the route, it will return a 404 page before React even has a chance to load.

### Step 4: Building the API Proxy (Memcached Integration)
- **Action:** Create a custom REST API endpoint in `functions.php`: `/wp-json/custom-weather/v1/city/(?P<id>\w+)`.
- **Action:** In the endpoint callback, check `wp_cache_get( 'weather_' . $city_id )`.
- **Action:** If cache exists, return it. If not, make a `wp_remote_get()` call to your weather provider, store the result using `wp_cache_set(..., 1800)` (30 mins), and return it.
- **Action:** Update the Vite `.env` file so the React app calls `https://yourdomain.com/wp-json/custom-weather/v1/city/` instead of the 3rd party API.
- **⚠️ Common Mistake:** Exposing the primary API key in the React frontend. Never commit the 3rd party API key to the Vite project. The React app must only talk to the secure WordPress proxy.

### Step 5: Hostinger LiteSpeed Configuration
- **Action:** Go to LiteSpeed Cache settings in WP Admin -> Cache.
- **Action:** Enable "Cache REST API" and set the TTL to 10-15 minutes.
- **Action:** Verify that "Browser Cache" and "Object Cache" (Memcached/Redis) are turned ON.
- **⚠️ Common Mistake:** Caching the React HTML div, but forgetting to cache the actual REST API data. If 1,000 users load the cached page, but 1,000 API requests still hit the database/3rd party provider simultaneously, your server will crash.

---

## Strategic SEO & Performance Tuning (Beating the Competition)

To dominate established legacy weather sites, we must outperform them technically and semantically. 

### 1. Preload & Prefetching
- **Optimization:** In your `header.php`, add `<link rel="preload" href="/wp-content/themes/.../main.[hash].js" as="script">`. 
- **Impact:** Forces the browser to download the React app bundle immediately while downloading HTML, shaving 200-300ms off the Total Blocking Time (TBT).

### 2. Micro-Schema (Real-Time Markup)
- **Optimization:** Legacy sites often have static schema. Use your PHP template to output highly specific, real-time Schema.org markup. Include `expires` tags in the `WeatherForecast` schema so Googlebot knows exactly when to return for fresh data.
- **Impact:** Increases the chance of securing the "Featured Snippet" directly under the search bar for queries like "Istanbul saatlik hava durumu".

### 3. Server-Sent Events (SSE) / Lightweight Polling
- **Optimization:** Instead of polling the API every minute for severe weather updates on the frontend, use lightweight conditional requests (ETags). When the React app checks for updates, the PHP proxy should return a 304 Not Modified if the Memcached object hasn't changed.
- **Impact:** Zero payload size for repeat visitors, drastically lowering mobile bandwidth usage, a key metric for Core Web Vitals.

### 4. Semantic HTML within the React Mount Point
- **Optimization:** Don't leave the `<div id="weather-app"></div>` completely empty. Have PHP render the skeleton HTML and a basic `<h1>` and `<table>` of the weather directly inside the div. When React hydrates, it replaces the static HTML.
- **Impact:** Even if a search engine fails to execute JavaScript, or a mobile user has a terrible connection, the text content exists on the page at 0ms.

### 5. Localized AEO (Answer Engine Optimization)
- **Optimization:** Instead of generic summaries, focus heavily on the "Havadan Konuşalım" logic. Ensure these phrases read like native Turkish natural language, not robotic data points. 
- **Impact:** LLMs (like ChatGPT, Gemini, and Google SGE) scrape this text to answer user queries. If your site provides the clearest natural-language summary (e.g., "Bugün Kadıköy'de rüzgar lodos yönünden sert esiyor, şemsiye kullanmak zor olabilir"), AI engines will cite your domain as the source.

---

## Phase 9: The "Pre-Flight" Safety Protocol (Anti-Crash & Conflict Checks)

Before you hit "publish" on the live server, you must run an isolated Staging verification. This guarantees the React app, the WordPress proxy, and Hostinger caching do not collide.

### 9.1. Simulated Load Testing (The Traffic Test)
- [ ] **Apache Bench (ab) or k6 Test:** Do not test the homepage (WordPress handles that easily). You must load test your custom **REST API Endpoint**. Run a test that simulates 1,000 requests per second to `/wp-json/custom-weather/v1/city/istanbul`.
- [ ] **Memcached Verification:** During the load test, monitor your server CPU in Hostinger cPanel. If CPU spikes to 100%, Memcached is NOT working, and WordPress is bootstrapping PHP for every request. If CPU stays flat, your Memcached proxy is successful.
- [ ] **3rd Party API Monitor:** Log into your Weather API provider dashboard during the load test. Ensure only **ONE** request was registered for Istanbul, not 1,000. This confirms the proxy is shielding your API key and budget.

### 9.2. Data Flow Validation (The Freshness Test)
- [ ] **Cache Busting Simulation:** Trigger a manual cache clear in LiteSpeed or Memcached. Visit the React app. Verify the data instantly updates with the newest API payload.
- [ ] **Stale-While-Revalidate Check:** Write a script or have the proxy log when the data is forcibly refreshed in the background. If a user requests Istanbul exactly when the 30-minute cache expires, the proxy should instantly return the *stale* data to the user, and re-fetch the *fresh* data in the background (preventing a 2-second hang).

### 9.3. WordPress & React CSS/JS Conflict Resolution
- [ ] **CSS Scope Audit:** Ensure GeneratePress CSS does not bleed into the React app. Inspect the React components (like the Bento Grid or Drawers). Verify that global WP styles (like `.entry-content p`) haven't ruined the React layout.
- [ ] **React Prefixing:** Ensure Tailwind or pure CSS inside the React app is prefixed or strictly scoped to `#weather-app` so it doesn't accidentally style the GeneratePress header, footer, or sidebar menus.
- [ ] **JS Namespace Check:** Open the Chrome Console on the staging major city page. Ensure there are no JavaScript errors. Check that WordPress jQuery (if loaded by a plugin) and React are not conflicting. 

### 9.4. Fallback Execution (The "Worst Case Scenario")
- [x] **3rd Party API Outage Test**: Temporarily break your custom REST API (e.g., change the API key to a fake one). Load the React page. 
- [x] **Graceful Degradation**: Verify the React app DOES NOT crash to a white screen. It should elegantly display an offline message: "Hava durumu verileri şu anda güncelleniyor. Lütfen daha sonra tekrar deneyin," while the WordPress navigation and ads remain perfectly usable.
