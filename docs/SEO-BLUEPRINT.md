# Hava Durumu SEO Blueprint

**Document Purpose:** Canonical reference for SEO strategy, AI citation optimization, and zero-click visibility across the Turkish weather platform.

---

## Table of Contents

1. [Zero Click SEO Strategy](#zero-click-seo-strategy)
2. [City Weather Page Reference Template](#city-weather-page-reference-template)

---

# Zero Click SEO Strategy

## Overview

This section defines our **AI-optimized, zero-click SEO strategy** specifically designed for:

- Turkish weather search intent
- AI Overview citation optimization
- React + WordPress (GeneratePress One) architecture
- Scalable implementation (81 cities → districts)

---

# City Weather Page Reference Template

**(Turkey – SEO + AI Citation Optimized)**

---

## 1. URL & Indexing Rules (Non-Negotiable)

**Primary URL**

```
/hava-durumu/{sehir-slug}/
```

**Optional timeframes (indexable if needed later):**

```
/hava-durumu/{sehir-slug}/yarin/
/hava-durumu/{sehir-slug}/hafta-sonu/
```

**Canonical**

* Self-canonical for each URL
* No parameterized canonicals

**Indexing**

* Index city pages
* Noindex UI-only parameter states

---

## 2. `<head>` Requirements (SEO Trust Layer)

### Required Meta

* `<title>`
  `{Şehir} Hava Durumu | Bugün, Yarın ve Hafta Sonu Tahmini`
* `<meta description>`
  155–160 chars, generated daily, includes city + timeframe

### Required Structured Data (Injected by PHP)

* `WeatherForecast`
* `Place` (city entity)
* `FAQPage` (only if FAQ rendered)
* `dateModified` (ISO, updated daily)

---

## 3. Page Body Structure (Strict Order)

---

## H1 — Page Identity

```html
<h1>{Şehir} Hava Durumu</h1>
```

Optional suffix (not keyword stuffed):

> Bugün, Yarın ve Hafta Sonu Tahmini

---

## 4. Answer-First Summary Block (AI Primary Target)

**Position:** Immediately under H1  
**Length:** 2–3 sentences (40–60 words)  
**Regenerated:** Daily  
**Visible HTML (not JS-only)**

**Purpose:**
This is the block most likely to be **quoted by AI Overviews**.

**Example (structure, not content):**

> Bugün {Şehir}'de hava {durum}. Gün içinde sıcaklık {min}° ile {max}° arasında olacak. Yağış ihtimali %{x} civarında, rüzgâr {yon} yönünden {hiz} km/sa hızla esecek.

---

## 5. Timeframe Forecast Sections (Answer Blocks)

Each section is **independently quotable**.

---

### H2 — Bugün {Şehir}'de Hava Nasıl?

**Content rules**

* 40–70 words
* City name repeated once
* Includes:

  * dominant weather
  * temperature range
  * rain signal (yes/no)
  * practical implication (kısa)

---

### H2 — Yarın {Şehir}'de Hava Nasıl Olacak?

Same rules, but must include:

* **Change vs today** (artıyor / azalıyor / benzer)
* Explicit "yarın" signal

---

### H2 — Hafta Sonu {Şehir} Hava Durumu

* Aggregate view
* Mention both Saturday/Sunday if applicable
* Highlight risk (yağış, rüzgâr, sıcaklık farkı)

---

## 6. Weather Metrics Grid (Existing Component)

**Source of truth:**

* PHP pre-rendered commentary
* React hydration for UX only

**Metrics shown**

| Metric | Turkish Label |
|--------|---------------|
| Temperature | Sıcaklık |
| Feels like | Hissedilen |
| Cloud cover | Bulutluluk |
| Precipitation | Yağış |
| Wind | Rüzgâr |
| Humidity | Nem |
| UV Index | UV |
| Air Quality | HKİ |
| Pressure | Basınç |
| Day length | Gün süresi |

**SEO rule**

* Each metric commentary must be **visible HTML**
* No "display:none" for crawlable text

---

## 7. Günlük Özet (Human Trust Layer)

**H2 — Günlük Hava Özeti**

* 1 short paragraph (30–50 words)
* Written in plain Turkish
* Slight editorial tone
* Includes:

  * city name
  * date reference

This block improves **EEAT perception**.

---

## 8. FAQ Section (AI Expansion Engine)

**Rendered only if ≥ 2 questions available**

### H2 — {Şehir} Hava Durumu Hakkında Sık Sorulan Sorular

**Rules**

* Max 3–4 questions
* Each question:

  * explicit
  * city + timeframe specific

**Example structure**

```
Q: Yarın {Şehir}'de yağmur yağacak mı?
A: ...
```

**Schema**

* `FAQPage`
* Only if content is visible

---

## 9. Forecast Confidence & Update Metadata (EEAT Gold)

**Position:** Bottom of page  
**Must be visible**

**Includes**

* Son güncelleme zamanı
* Veri kaynağı (meteorolojik model)
* Kısa güven notu

**Example structure**

> Bu hava tahmini {tarih} tarihinde güncellenmiştir. Tahminler meteorolojik modellere dayanmaktadır ve kısa süreli değişiklikler gösterebilir.

---

## 10. Internal Linking (Entity Reinforcement)

At page bottom or sidebar:

* Yakındaki şehirler
* Aynı bölge şehirleri
* "Türkiye Hava Durumu" ana sayfa

**Rule**

* Use exact city names
* No generic anchor spam

---

## 11. React / WordPress Responsibility Split

| Layer | Responsibility |
|-------|---------------|
| WordPress (PHP) | HTML, text, schema, SEO |
| React | Interactivity, tabs, charts |
| Data | PHP prefetch + hydration |

React **must never**:

* Generate primary text
* Modify `<head>`
* Hide SEO-critical content

---

## 12. Anti-Duplication Safeguards (Built-in)

Active in `weatherCommentary.ts`:

* Deterministic templates
* City flavor injection
* Date-based openers
* Confidence modifiers

---

## 13. Template Advantages (Summary)

This template:

* Matches Turkish search intent perfectly
* Is optimized for:

  * classic rankings
  * AI Overviews
  * zero-click visibility
* Scales cleanly
* Is resilient to Google updates
* Is structurally superior to competitor "auto articles"

---

## 14. Competitor-Derived Enhancements

Based on competitor analysis, the following enhancements increase ranking potential:

### A. Forecast Summary Table (Snippet Opportunity)

Add a concise HTML table below answer blocks:

| Metric | Değer |
|--------|-------|
| En Yüksek | {high}° |
| En Düşük | {low}° |
| Yağış İhtimali | %{rainProb} |
| Rüzgâr | {windDir} {windSpeed} km/sa |

**Why**: Competitors rank well with tables. Google indexes these for rich snippets.

### B. Temporal Freshness Signals

Include date/time in every H2 heading:

```html
<h2>Bugün İstanbul'da Hava Nasıl? (21 Aralık 2024)</h2>
```

**Why**: Date stamps signal freshness, improving crawl priority.

### C. City + Region Entity Headings

Include province/region for improved geodata entity signals:

```html
<h2>Bugün Ordu – Çaybaşı Hava Durumu</h2>
<h2>Bugün Kayseri – Merkez Hava Durumu</h2>
```

**Requires**: City-to-region mapping in `cityData.ts`

### D. Forecast Accuracy Tags (EEAT)

Add qualitative accuracy indicator with source attribution:

```html
<span class="accuracy-tag">📊 Meteorolojik Modellere Dayalı Tahmin</span>
```

**Note**: Avoid marketing claims like "%96 doğru" without data backing. Use factual source attribution.

---

## Final Recommendation

Adopt this as the **single canonical City Page Reference Template**.

Everything else (articles, commentary, UI experiments) should **conform to this structure**, not compete with it.

---

# WordPress + GeneratePress Implementation Guide

A concrete, step-by-step implementation guide for generating city + timeframe weather pages in WordPress with GeneratePress.

---

## A. Core Architecture Decision

**ONE canonical city page**, with timeframe variants handled via URL paths (not parameters).

**Resulting URLs:**

```
/hava-durumu/ankara/                → Today (default)
/hava-durumu/ankara/yarin/          → Tomorrow
/hava-durumu/ankara/hafta-sonu/     → Weekend
```

All three are:
- Server-rendered
- Use the same PHP template
- Share the same city entity
- Differ only by timeframe context

---

## B. Step-by-Step Implementation

### STEP 1: Create the City Taxonomy

**1.1 Register taxonomy (functions.php)**

```php
register_taxonomy('sehir', ['post'], [
  'label' => 'Şehirler',
  'public' => true,
  'hierarchical' => false,
  'rewrite' => [
    'slug' => 'hava-durumu',
    'with_front' => false
  ],
  'show_in_rest' => true,
]);
```

**1.2 City term meta (store per-city data)**

- `latitude` / `longitude`
- `plate_code`
- `region`

---

### STEP 2: Define Timeframe Routing

**2.1 Register rewrite rules**

```php
add_action('init', function () {
  add_rewrite_rule(
    '^hava-durumu/([^/]+)/?(yarin|hafta-sonu)?/?$',
    'index.php?sehir=$matches[1]&timeframe=$matches[2]',
    'top'
  );
});
```

**2.2 Register query var**

```php
add_filter('query_vars', function ($vars) {
  $vars[] = 'timeframe';
  return $vars;
});
```

---

### STEP 3: Create the City Weather Template

**File:** `/wp-content/themes/generatepress_child/taxonomy-sehir.php`

**3.1 Resolve timeframe**

```php
$timeframe = get_query_var('timeframe') ?: 'today';

if (!in_array($timeframe, ['today', 'yarin', 'hafta-sonu'])) {
  $timeframe = 'today';
}
```

---

### STEP 4: Generate Weather + Commentary (Server-Side)

**4.1 Fetch city metadata**

```php
$term = get_queried_object();
$lat = get_term_meta($term->term_id, 'lat', true);
$lon = get_term_meta($term->term_id, 'lon', true);
```

**4.2 Fetch weather data (cached)**

```php
$weather_data = weather_get_cached_data($lat, $lon);
```

**4.3 Generate commentary (existing engine)**

```php
$commentary = weather_generate_commentary($weather_data, $timeframe);
```

---

### STEP 5: Render SEO-Critical HTML

> [!IMPORTANT]
> All of this must be **visible HTML** — not JS-only.

```html
<h1><?= esc_html($term->name); ?> Hava Durumu</h1>

<div class="answer-first">
  <?= esc_html($commentary['answerBlock']); ?>
</div>

<h2>Bugün <?= esc_html($term->name); ?>'de Hava Nasıl?</h2>
<p><?= esc_html($commentary['timeframeBlock']['content']); ?></p>

<!-- Forecast Summary Table -->
<table class="forecast-table">
  <?php foreach ($commentary['forecastTable'] as $row): ?>
  <tr>
    <td><?= esc_html($row['metric']); ?></td>
    <td><?= esc_html($row['value']); ?></td>
  </tr>
  <?php endforeach; ?>
</table>
```

---

### STEP 6: Inject Schema (PHP Only)

```php
add_action('wp_head', function () use ($commentary, $term) {
  echo weather_generate_schema($commentary, $term);
});
```

Includes:
- `WeatherForecast`
- `Place`
- `FAQPage` (conditional)
- `dateModified`

---

### STEP 7: Hydrate React (UX Only)

```html
<script>
window.TedderConfig = {
  city: <?= json_encode($term->slug); ?>,
  timeframe: <?= json_encode($timeframe); ?>,
  weather: <?= json_encode($weather_data); ?>,
  commentary: <?= json_encode($commentary); ?>
};
</script>
```

React reads → enhances → **does not replace text**.

---

## C. Implementation Examples

### Example 1: `/hava-durumu/istanbul/`

| Property | Value |
|----------|-------|
| Taxonomy | `sehir = istanbul` |
| Timeframe | `today` (default) |
| Template | `taxonomy-sehir.php` |
| Canonical | `/hava-durumu/istanbul/` |

**Ranks for:** "İstanbul hava durumu", "İstanbul bugün hava nasıl"

---

### Example 2: `/hava-durumu/ordu/yarin/`

| Property | Value |
|----------|-------|
| Taxonomy | `sehir = ordu` |
| Timeframe | `yarin` |
| Template | Same template |
| Canonical | `/hava-durumu/ordu/yarin/` |

**Ranks for:** "Ordu yarın hava durumu", "Yarın Ordu'da yağmur var mı"

---

## D. Architecture Summary

| Element | Role |
|---------|------|
| `sehir` taxonomy | City entity |
| Rewrite rules | Timeframe routing |
| Single template | Maintain consistency |
| Commentary engine | Unique, fresh text |
| Schema injection | AI + SERP visibility |
| React | UX enhancement only |

---

## E. Why This Approach Works

This approach:
- ✅ Matches top Turkish competitors structurally
- ✅ Exceeds them semantically
- ✅ Scales cleanly to 81 cities
- ✅ Avoids content duplication
- ✅ Maximizes AI citation probability

> You are implementing a **city entity system**, not article pages — which is exactly what Google expects for weather.

