# act-transfermarkt
Apify actor-crawler providing an API for the transfermarkt.com website.

This actor can extract data from transfermarkt.com pages. It works best with competition, club or player pages, but is also capable of extracting some data from most (if not all) other page types. It requires only the start page url, it will determine the page type by itself and extract the data accordingly.

**INPUT**

Input is a JSON object with the following properties:

```javascript
{ 
    "startUrl": START_URL,
    "parallels": PARALLEL_CRAWLERS,
    "crawlDepth": MAX_CRAWLING_DEPTH,
    "pageDepth": MAX_PAGINATION_DEPTH,
    "puppeteerOptions": LAUNCH_PUPPETEER_OPTIONS
}
```

__startUrl__ is the only required attribute. This is the start page URL.  
__parallels__ specifies how many parallel crawlers will be used, defaults to 1.  
__crawlDepth__ defines how deep the crawler will navigate from current page, by default it will extract only the start page. 
__pageDepth__ defines how many pages in the pagination it will navigate to, by default unlimited.  
__puppeteerOptions__ is a PuppeteerCrawler parameter [launchPuppeteerOptions](https://www.apify.com/docs/sdk/apify-runtime-js/latest#LaunchPuppeteerOptions).
