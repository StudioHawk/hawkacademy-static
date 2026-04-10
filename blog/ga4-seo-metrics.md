---
title: "GA4 for SEO: The Metrics That Actually Matter"
title_tag: "GA4 for SEO: The Only Metrics That Matter (2026)"
meta_description: "Cut through the noise in Google Analytics 4. The organic search reports, engagement metrics, and conversion tracking that actually tell you if SEO is working."
slug: "/blog/ga4-seo-metrics/"
author: "Harry Sanders"
date: "2026-04-11"
category: "Analytics"
---

## TL;DR

- GA4 has hundreds of metrics. For SEO, you need five: organic sessions, engagement rate, key events (conversions), landing page performance, and revenue attribution.
- The default GA4 setup buries organic search data. You need to configure the traffic acquisition report and build one custom exploration to get useful SEO reporting.
- AI search traffic from ChatGPT and Perplexity is already hitting your site. If you are not tracking it, you are flying blind on a channel growing over 19x year-on-year.

## Most GA4 guides waste your time with metrics that do not matter

I have run an SEO agency with 120 people across four countries for over a decade. In that time I have sat through thousands of analytics reviews, and the single biggest problem is always the same: business owners drowning in data and starving for insight.

GA4 made this worse. Google rebuilt Analytics from scratch and the new interface confuses even experienced marketers. But the fix is straightforward. You do not need to learn every report. You need to know which five or six numbers actually tell you whether your SEO investment is paying off.

That is what this guide covers. No fluff, no 47-step walkthroughs. Just the reports and metrics that move the needle for organic search, including how to track the new wave of AI search traffic that most businesses are completely ignoring.

## Your organic traffic report is probably set up wrong

The first thing most people do in GA4 is check how much traffic they are getting from Google. The problem is GA4 does not make this easy by default.

If you go to Reports, then Acquisition, then Traffic acquisition, GA4 shows you "Session default channel group" as the primary dimension. That groups all your organic search traffic into one bucket, which is a start, but it hides the detail you need.

Change the primary dimension to "Session source / medium" instead. Now you can see `google / organic` as its own line, separate from `bing / organic`, `yahoo / organic`, and any other search engines sending you traffic.

This one change takes five seconds and immediately gives you a clearer picture. You can see sessions, engaged sessions, engagement rate, and conversions broken down by each traffic source. If you are running [SEO properly](/blog/beginners-guide-to-seo-2026/), Google organic should be one of your top three traffic sources.

For ongoing monitoring, save this view as a report and add it to your navigation. GA4 lets you customise your report library so you do not have to reconfigure the dimension every time.

## Engagement rate replaced bounce rate, and it is actually better

One of the biggest complaints about GA4 is that bounce rate disappeared. It is back now, but you should be paying more attention to engagement rate instead.

In GA4, an "engaged session" is one where the user did at least one of three things: stayed on your site for 10 seconds or more, triggered a key event (conversion), or viewed two or more pages. Engagement rate is the percentage of sessions that qualify.

This matters for SEO because it tells you whether your organic traffic is actually doing something useful. A page with 10,000 organic sessions and a 25% engagement rate is a problem. A page with 2,000 sessions and a 75% engagement rate is working.

For most business websites, a healthy engagement rate from organic search sits between 55% and 75%. Anything below 40% means your page is not matching the intent of the people clicking through from Google. Either the content does not deliver on what the title tag promised, or the page experience is poor. Check your [Core Web Vitals](/blog/core-web-vitals-checklist/) if engagement rate is low across the board, because slow pages kill engagement before users even read a word.

## Landing page performance tells you which pages earn their keep

The landing page report is where SEO analysis gets practical. Go to Reports, then Engagement, then Landing page.

This shows you every page on your site that people entered through, with sessions, engagement rate, and conversion data for each one. Filter by organic traffic (add a filter for Session default channel group equals Organic Search) and you immediately see which of your pages are actually attracting and converting search traffic.

Sort by sessions to find your highest-traffic entry points. Then look at engagement rate and conversions for each one. What you will usually find is that a small number of pages drive the vast majority of your organic value. Those are the pages to protect and optimise first.

Pages with high sessions but poor engagement or zero conversions are your biggest opportunities. The traffic is already there. You just need to improve the page experience, update the content, or refine the call to action.

**Why does this matter?** We used exactly this approach with Pet Insurance Australia. By identifying which organic landing pages drove the most quote requests and optimising those pages first, we turned organic traffic into measurable business growth. Read the full case study: Pet Insurance Australia - [https://studiohawk.com.au/case-studies/pet-insurance-australia](https://studiohawk.com.au/case-studies/pet-insurance-australia)

## Conversions are now "key events" and you must set them up manually

GA4 renamed conversions to "key events" in early 2024. The name change is cosmetic, but the bigger issue is that GA4 tracks almost nothing as a key event by default. If you have not configured them, your conversion data is empty and your organic traffic looks like it produces zero business results.

At minimum, you should mark these as key events:

- **Form submissions** (contact forms, quote requests, enquiry forms)
- **Phone call clicks** (tap-to-call events on mobile)
- **Purchase or checkout completion** (for ecommerce)
- **Email signups** (newsletter, lead magnets)
- **Key page views** (pricing page, demo request page)

To set these up, go to Admin, then Events. You will see a list of events GA4 is already collecting. Click "Mark as key event" next to any event that represents a real business outcome. If the event you need does not exist yet, you will need to create it using GA4's event builder or Google Tag Manager.

This is non-negotiable. Without key events configured, you cannot answer the most important question in SEO: is organic search generating leads and revenue? For a deeper dive into connecting analytics to business outcomes, see StudioHawk's [reporting and analytics overview](https://studiohawk.com.au/seo-services/reporting-analytics).

## The custom exploration every business owner should build

GA4's standard reports give you the basics. For a proper SEO performance view, you need one custom exploration. It takes 10 minutes to build and replaces hours of clicking around.

Go to Explore, then click "Create new exploration." Set it up with these parameters:

**Dimensions:** Session source/medium, Landing page, Device category

**Metrics:** Sessions, Engaged sessions, Engagement rate, Key events, Revenue (if applicable)

**Filter:** Session source/medium contains "organic"

This single exploration gives you a view of all organic traffic broken down by landing page, with engagement and conversion data for each. You can slice it by device to see whether mobile organic users behave differently from desktop users (they almost always do).

Save this exploration and check it weekly. That one report tells you more about your SEO performance than any automated PDF dashboard.

## You are probably missing AI search traffic entirely

Here is something most businesses have not caught up with yet. Tools like ChatGPT, Perplexity, Copilot, and Gemini are sending real traffic to websites, and GA4 does not surface it by default. It sits hidden in your referral data.

Across StudioHawk's client base, we have tracked AI search traffic growing rapidly year-on-year. ChatGPT alone accounts for the vast majority of AI referrals. The traffic converts, it generates revenue, and most businesses have no idea it is happening.

To check yours, go to Reports, then Acquisition, then Traffic acquisition. Change the dimension to Session source/medium and search for `chatgpt` in the filter bar. You should see entries like `chatgpt.com / referral`. Then search for `perplexity`, `copilot`, and `gemini` to catch the other AI sources.

For ongoing tracking, the best approach is a custom channel grouping. Go to Admin, then Data display, then Channel groups. Create a new channel group and add a channel called "AI Search" with the condition: Session source matches regex `chatgpt\.com|chat\.openai\.com|copilot\.microsoft\.com|gemini\.google\.com|perplexity\.ai|claude\.ai`. Now AI search shows up as its own channel in every standard report, right alongside Organic Search and Direct.

This is especially important if you are thinking about [how AI overviews are changing SEO](/blog/how-ai-overviews-changing-seo/). Tracking AI referral traffic is the first step to understanding your visibility in this new channel. For a more detailed breakdown of enterprise-level AI search analytics, see the [StudioHawk analytics blog](https://studiohawk.com.au/blog/enterprise-seo-analytics).

## GA4 numbers are the floor, not the ceiling

One thing to understand about all GA4 data: it undercounts. Ad blockers strip referrer information. Cookie consent banners prevent tracking. Users who hear about your brand in ChatGPT often Google your name directly rather than clicking the link, so GA4 credits the visit to branded organic or direct instead of AI search.

This means your GA4 organic traffic number is the minimum, not the maximum. The real impact of your SEO is larger than what analytics shows. Keep this in mind when reporting to stakeholders. GA4 is the best measurement tool we have, but it captures a portion of the full picture.

**Why does this matter?** When Shiels experienced a traffic drop, analytics was the diagnostic tool that identified the issue and tracked recovery. Without properly configured GA4 reporting, the drop would have gone unnoticed for weeks longer. Read the full case study: Shiels - [https://studiohawk.com.au/case-studies/shiels](https://studiohawk.com.au/case-studies/shiels)

## The five numbers to check every Monday morning

If you do nothing else, open GA4 on Monday morning and check these five things for the previous seven days, filtered to organic traffic:

1. **Total organic sessions** compared to the same period last month. Trending up or down?
2. **Engagement rate** across organic traffic. Holding steady above 55%?
3. **Key events from organic** compared to last month. Are conversions growing in line with traffic?
4. **Top 10 organic landing pages.** Any new pages breaking into the top 10? Any regular pages dropping off?
5. **AI search referrals.** Any meaningful traffic from chatgpt.com or perplexity.ai?

That check takes five minutes. Do it consistently and you will spot problems early, catch opportunities faster, and always have a clear answer when someone asks whether SEO is working. For more context on the metrics that matter beyond GA4, see the Google Analytics [support documentation](https://support.google.com/analytics).

## FAQ

### Do I need GA4 set up differently for SEO compared to paid ads?

The base setup is the same, but the reports you use are different. For SEO, your primary focus is the traffic acquisition report filtered to organic sources, the landing page report, and a custom exploration connecting organic sessions to key events. Paid ads teams focus more on campaign-level attribution, which uses a different set of dimensions.

### How long does GA4 take to show data after setup?

GA4 starts collecting data immediately after the tracking code is installed, but there is a processing delay of 24 to 48 hours before it appears in reports. For a brand new setup, give it a full week of data collection before drawing any conclusions. Historical data from Universal Analytics does not transfer into GA4.

### Why does my organic traffic in GA4 not match Google Search Console?

They measure different things. Search Console counts clicks on your search result in Google. GA4 counts sessions that actually reach your site and trigger the tracking script. The gap comes from users who click but hit the back button before the page loads, ad blockers that prevent GA4 from firing, and cookie consent banners that block tracking. Search Console numbers are typically 10% to 30% higher than GA4 for the same period.

### Can I track which keywords bring organic traffic in GA4?

Not directly. Google encrypts search queries, so GA4 shows most organic keywords as "(not provided)." For keyword data, use [Google Search Console](/blog/beginners-guide-to-seo-2026/) alongside GA4. Search Console shows clicks and impressions by query. GA4 shows what users did after they arrived. Together they give you the full picture.

### What is the difference between "users" and "sessions" in GA4?

A user is a unique person visiting your site. A session is a single visit. One user can have multiple sessions. For SEO reporting, sessions is usually the more useful metric because it reflects how many times people entered your site from search results. User counts are useful for understanding audience size but can be unreliable due to cross-device tracking limitations.
