---
title: "Core Web Vitals: A Practical Optimisation Checklist for Business Owners"
title_tag: "Core Web Vitals Checklist: Fix LCP, CLS & INP (2026)"
meta_description: "Step-by-step guide to diagnose and fix Core Web Vitals issues. Plain English explanations of LCP, CLS, and INP with exact fixes for business owners."
slug: /seo-guides/core-web-vitals-checklist/
author: "Harry Sanders"
date: "2026-04-11"
category: "Technical SEO"
---

## TL;DR

- Core Web Vitals measure three things: how fast your page loads (LCP), how stable the layout is while loading (CLS), and how quickly buttons respond when clicked (INP).
- You can test all three for free using Google's PageSpeed Insights. The fixes are mostly image compression, font loading, and lazy-loaded content pushing things around.
- Slow sites lose rankings and conversions. Fix the biggest metric first, not all three at once.

---

After auditing over 50,000 hours' worth of websites at StudioHawk, I can tell you the single most common technical SEO problem we find is poor Core Web Vitals. Not thin content. Not missing meta descriptions. Speed and stability.

Google uses Core Web Vitals as a ranking signal. That is not speculation. They confirmed it. But rankings aside, slow pages lose customers. A page that takes four seconds to load will haemorrhage visitors before they even see your product.

This checklist walks you through exactly what each metric means, how to test it, and the specific fixes that work. No developer jargon, no vague advice. Just the steps.

If you are brand new to SEO, start with our [beginner's guide to SEO in 2026](/seo-guides/beginners-guide-to-seo-2026/) for the full picture before diving into technical metrics.

## Your Site Speed Affects Rankings More Than You Think

Google has three Core Web Vitals metrics. Each one measures a different part of the user experience. Here is what they actually mean in plain English.

**LCP (Largest Contentful Paint)** measures how long it takes for the biggest visible element on your page to finish loading. That is usually your hero image or main headline. Google wants this under 2.5 seconds.

**CLS (Cumulative Layout Shift)** measures how much the page jumps around while it loads. You know when you go to tap a button and an ad shoves it down the page? That is a layout shift. Google wants this score below 0.1.

**INP (Interaction to Next Paint)** replaced the old FID metric in 2024. It measures how long it takes for the page to respond after someone clicks, taps, or presses a key. Google wants this under 200 milliseconds.

All three metrics matter. But LCP is the one I see fail most often on business websites, so that is where we will start.

## How to Test Your Core Web Vitals in Under Two Minutes

Open [Google PageSpeed Insights](https://pagespeed.web.dev/) and paste in your homepage URL. Hit analyse. You will get two sets of results.

The top section shows **field data** from real users who visited your site over the past 28 days. This is what Google actually uses for ranking decisions.

The bottom section shows **lab data** from a simulated test. This is useful for diagnosing problems but does not directly affect rankings.

Look at the field data first. Each metric will show green (good), orange (needs improvement), or red (poor). Focus on whichever metric is red. If nothing is red, focus on orange.

You can also check Core Web Vitals inside Google Search Console under the Experience section. This gives you a site-wide view rather than page by page.

For a deeper look at how to read these reports and connect them to your broader analytics, see our guide on [GA4 SEO metrics that actually matter](/seo-guides/ga4-seo-metrics/).

## LCP Failures Are Almost Always an Image Problem

Nine times out of ten, a slow LCP score comes down to images. The hero image on your homepage is probably a 3MB PNG that your web designer uploaded in 2021 and nobody has touched since.

Here is the fix, step by step:

1. **Identify the LCP element.** PageSpeed Insights tells you exactly which element is your LCP. Scroll down to the diagnostics and look for the entry labelled "Largest Contentful Paint element."
2. **Compress the image.** Convert it to WebP format. A 2MB JPEG becomes a 200KB WebP with virtually no visible quality loss. Tools like Squoosh (free, browser-based) handle this in seconds.
3. **Set explicit width and height.** Add width and height attributes to your image tag so the browser reserves space before the image loads. This prevents layout shifts too.
4. **Preload the hero image.** Add a preload link in your page's head section. This tells the browser to start downloading the hero image immediately rather than waiting until it discovers it in the HTML.
5. **Serve images from a CDN.** If you are not using a content delivery network, your images are being served from one server location. A CDN puts copies closer to your visitors.

If your LCP element is text rather than an image, the problem is usually web fonts. The browser downloads the font file before rendering the text, which delays everything. The fix is to add `font-display: swap` to your font declarations so the browser shows a fallback font instantly, then swaps in your custom font once it loads.

**Why does this matter?** We worked with an ecommerce brand whose product pages were loading in over 4 seconds on mobile. Image optimisation alone cut that to 1.8 seconds. Here's why: faster load times directly correlate with lower bounce rates and higher conversion. Read the full case study: Hush Puppies — [https://studiohawk.com.au/case-studies/hush-puppies](https://studiohawk.com.au/case-studies/hush-puppies)

## Layout Shifts Destroy Trust Before Users Notice Them

CLS is the most frustrating metric because it is invisible to you during testing but painfully obvious to real users on slower connections.

The most common causes of layout shifts on business websites:

**Images without dimensions.** If you do not specify width and height on your images, the browser does not know how much space to reserve. When the image finally loads, everything below it jumps down. Fix: add explicit `width` and `height` attributes to every image.

**Late-loading ads or embeds.** Google Maps iframes, YouTube embeds, and ad units that load after the page content will shove everything around. Fix: reserve the space with a CSS container that has a fixed aspect ratio before the embed loads.

**Web fonts causing text reflow.** When a custom font loads and replaces the fallback font, the text changes size slightly, shifting everything below it. Fix: use `font-display: swap` and choose fallback fonts that closely match your custom font's metrics.

**Dynamically injected content.** Chat widgets, cookie banners, and notification bars that slide in after load push content down. Fix: reserve space for these elements in your initial layout, or overlay them on top of existing content rather than inserting them into the document flow.

Here is my rule of thumb: if you load your page on a fast connection and everything looks fine, test it again with Chrome DevTools throttled to a slow 3G connection. That is where the layout shifts reveal themselves.

## INP Is the Metric Most Businesses Ignore

INP (Interaction to Next Paint) is the newest Core Web Vital and the one I see the most confusion around. It measures responsiveness. When a user taps a button, how long until something visually changes on screen?

Poor INP scores usually come from heavy JavaScript blocking the main thread. In practical terms, that means your site has too many scripts fighting for the browser's attention when someone tries to interact.

Common fixes:

**Defer non-critical JavaScript.** Analytics scripts, chat widgets, and marketing tags do not need to load before the page is interactive. Add `defer` or `async` attributes so they load in the background.

**Break up long tasks.** If you have JavaScript functions that take over 50 milliseconds to execute, they block user interaction. Modern frameworks can split these into smaller chunks using techniques like `requestIdleCallback` or web workers.

**Reduce third-party scripts.** Every tracking pixel, A/B testing tool, and social sharing widget adds JavaScript. Audit your tag manager and remove anything you are not actively using. I have seen sites with 40+ marketing tags where the team only uses five of them.

For most business websites running on WordPress, Shopify, or similar platforms, the biggest INP win comes from simply removing unused plugins and deferring tag manager scripts. You do not need a developer for that.

## Mobile Performance Is Where Most Sites Actually Fail

Google uses mobile-first indexing, which means it evaluates the mobile version of your site for rankings. Yet most business owners only check their site on desktop.

Run your PageSpeed test on the mobile tab, not desktop. The scores will almost certainly be worse. Mobile devices have less processing power, slower connections, and smaller screens that make layout shifts more noticeable.

Key mobile-specific optimisations include keeping [mobile SEO factors](https://studiohawk.com.au/seo-guides/7-mobile-seo-factors-for-ecommerce) front of mind:

- Serve appropriately sized images. A 1920px-wide hero image on a 375px-wide phone screen is wasteful. Use responsive images with `srcset` to serve smaller files on smaller screens.
- Minimise render-blocking CSS. On mobile, every kilobyte matters. Inline your critical CSS and defer the rest.
- Test on real devices. Emulators are useful, but nothing replaces loading your site on an actual mid-range Android phone.

**Why does this matter?** Technical optimisation across an ecommerce site drove measurable revenue growth when we paired Core Web Vitals fixes with broader site architecture improvements. Read the full case study: Shoes & Sox — [https://studiohawk.com.au/case-studies/shoes-and-sox](https://studiohawk.com.au/case-studies/shoes-and-sox)

## A Monthly Vitals Check Takes Ten Minutes

Core Web Vitals are not a set-and-forget project. New content, plugin updates, and design changes can regress your scores overnight. I recommend a simple monthly check:

1. Open PageSpeed Insights. Test your homepage, your top landing page, and one product or service page.
2. Check Search Console. Look at the Core Web Vitals report under Experience. If new "poor" URLs have appeared, investigate what changed.
3. Review your tag manager. Has anyone added new scripts this month? If so, check whether they affected INP.
4. Test on mobile. Always. Every time.

This ties into broader [site architecture and crawl budget](/seo-guides/site-architecture-crawl-budget/) principles. A fast, well-structured site is easier for both users and search engines to navigate.

If you want to build these habits into a proper workflow, the [ecommerce SEO skill](https://hawkacademy.co/claude-seo-skills/ecommerce-seo-audit) inside Hawk Academy walks you through technical audits step by step.

## FAQ

### Do Core Web Vitals directly affect Google rankings?

Yes. Google confirmed Core Web Vitals as a ranking signal in 2021 and has continued to refine how they are measured. They are part of the broader page experience signals. A page with poor vitals will not outrank an identical page with good vitals, all else being equal. That said, content relevance still matters more than speed alone.

### Which Core Web Vital should I fix first?

Fix whichever metric is in the red zone first. If multiple metrics are red, start with LCP because it has the largest impact on perceived load time and typically the most straightforward fix (image optimisation). CLS is next because it affects user trust. INP is last because it usually requires JavaScript changes that may need a developer.

### Can I pass Core Web Vitals on WordPress or Shopify?

Absolutely. Both platforms can achieve green scores across all three metrics. The keys are using a lightweight theme, compressing images, limiting plugins to only what you need, and deferring non-critical scripts. Most poor scores on these platforms come from bloated themes or excessive third-party plugins, not the platform itself.

### How often does Google update Core Web Vitals data?

The field data in PageSpeed Insights is based on a rolling 28-day window from the Chrome User Experience Report. Changes you make today will not show up in field data for roughly a month. Lab data updates immediately when you re-test. Search Console updates its Core Web Vitals report periodically but not in real time.

### What is a good LCP score for an ecommerce site?

Google considers LCP under 2.5 seconds to be good. For ecommerce specifically, I aim for under 2 seconds on product pages because faster load times have a direct, measurable impact on conversion rates. Anything over 4 seconds is a revenue problem, not just an SEO problem.
