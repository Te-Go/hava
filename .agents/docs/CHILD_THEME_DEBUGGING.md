---
# **Child Theme Debugging and Triage Manual**

**Target Environment:** Hostinger Cloud Professional + LiteSpeed Web Server + GeneratePress Child + React Injection

---

## **Section 1: The Core Cache Triage Protocol**

Because our architecture relies on multi-tiered server edge caching and deterministic file serialization, cache desynchronization is the most common cause of "missing" code updates or broken frontend elements. If you push an update but see an old layout, follow this exact chain of command.

### **1.1 Server-Level Cache Invalidation (LiteSpeed Edge)**

* **The Issue:** LiteSpeed continues to serve the stale HTML shell compiled before your Git push, rendering your frontend updates invisible.

* **The Debugging Routine:**
1. Log into the WordPress Admin dashboard.
2. In the top admin bar, hover over the **LiteSpeed Cache** icon and click **Purge All**.
3. If a specific virtual route is stuck, verify that your backend PHP hydrator is successfully issuing cache tags by checking your server headers for `X-LiteSpeed-Tag`.
4. *Terminal Override:* If the WordPress admin area is inaccessible, open your Antigravity terminal and execute an administrative flush via the Hostinger hPanel Cache Command console to force the edge nodes to drop their memory states.

### **1.2 Relational Object Cache Flushing (Redis / Memcached)**

* **The Issue:** The WordPress REST API or structural database lookups are serving old data states stuck in your server's RAM proxy.

* **The Debugging Routine:**
1. Navigate to **LiteSpeed Cache > Toolbox > Object Cache**.
2. Verify the status reads **"Connection Passed"**.
3. Click **Flush Object Cache**. This cleans out stale memory segments without putting load on your SSD.

### **1.3 CSS Template Cache Clears**

* **The Issue:** Your child theme’s `style.css` updates are ignored by user viewports due to strict browser caching files.
* **The Debugging Routine:**
* Never hardcode static styles without a version controller. Ensure your agent writes a dynamic asset version hook in `functions.php` that links file output to the last modified file timestamp:

```php
wp_enqueue_style('generatepress-child', get_stylesheet_directory_uri() . '/style.css', array(), filemtime(get_stylesheet_directory() . '/style.css'));
```

## **Section 2: System Blueprint for Common Migration Failures**

| Symptoms / Error Output | Root Cause Analysis | Corrective Triage Steps |
| :--- | :--- | :--- |
| **Site displays a white screen or throws a 500 Server Error immediately after activating the child theme.** | **Boilerplate Syntax Error:** Missing or broken opening/closing PHP blocks in the child theme’s `functions.php`, or a file path conflict with the parent theme directory. | 1. Access your Hostinger hPanel File Manager.<br>2. Open `wp-content/themes/generatepress-child/functions.php`. <br>3. Confirm the file starts with `<?php` and contains no accidental trailing spaces outside the tags. <br>4. Check the server error log (`wp-content/debug.log`) for the exact broken line number. |
| **Googlebot registers a "Soft-404" or indexation block on your virtual URLs.** | **Header Drop Mismatch:** The child theme template loaded successfully via the filter, but failed to override the default WordPress initialization status. | 1. Open `wp-content/themes/generatepress-child/functions.php`. <br>2. Ensure the `template_include` filter explicitly declares `global $wp_query; $wp_query->is_404 = false; status_header(200);` right before returning the template file. |
| **React UI widgets render as completely blank blocks with zero layout structure.** | **Path Resolution Failure:** The custom plugin or theme is searching the *parent* directory instead of the child path, causing it to miss the core file. | 1. Run the Antigravity validation command: `/grill-me Search codebase for template directory calls.` <br>2. Ensure the code uses `get_stylesheet_directory()` (points to child theme) instead of `get_template_directory()` (points to parent theme). |
| **The layout shifts violently during loading screens, failing Core Web Vitals targets.** | **Skeleton Height Mismatch:** The child theme's template markup does not match the dimensions mapped by your React components. | 1. Cross-reference your child theme template with the Fixed-Slot Contracts table. <br>2. Confirm the exact CSS slot variable matches the target asset (e.g., `style="--sinan-slot-height: 250px;"` for traffic layouts). |
| **Specific components break during execution, causing the entire webpage to freeze.** | **Missing Error Isolation Bounds:** The React layout bundle crashed because an array field returned an unexpected null property value, and it wasn't isolated. | 1. Inspect the browser console via Antigravity's integrated debugger tool. <br>2. Verify that every custom frontend script block is enclosed within a high-level `<WidgetErrorBoundary>` wrapper. |

---

## **Section 3: Antigravity Automated Repair Routines**

As a solo operator, you don't need to manually patch these issues. Use these pre-built workspace slash commands to force your agents to locate and resolve alignment errors automatically:

*   **To debug template path anomalies:**
    > `/goal Scan our theme templates and plugin files. Ensure all internal path references to 'template-weather-hub.php' utilize 'get_stylesheet_directory()' to guarantee they point exclusively to our active child theme folder.`
*   **To resolve Core Web Vitals layout shift issues:**
    > `/browser Test our live virtual endpoints under mobile throttling simulations. Identify any elements causing layout movements greater than 0.05 and automatically correct the parent child-theme skeleton CSS variables to lock the geometry layout contracts.`
*   **To check compliance loops:**
    > `/goal Verify that our custom KVKK script protection helper function wraps all dynamic programmatic ad containers within our child theme templates to ensure absolute script isolation before cookie consent triggers.`
