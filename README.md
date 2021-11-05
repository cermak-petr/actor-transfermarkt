## Features
Using the **Transfermarkt scraper**, you can extract data from all transfermarkt.com pages and domains. It works best with *competition, club* or *player pages*, but supports other page types as well.

Transfermarkt Scraper **requires only the start page URL**. The page type will be determined automatically, and the scraper will extract all the sports data accordingly. It is fairly simple to use as it only has 3 other input parameters to work with, other than the start page URL.

**How to use the extracted Transfermarkt statistics data:**

-  **Scrape live scores** for the most accurate predictions of match outcomes
- **Monitor transfermarkt** and other soccer-related websites simultaneously and combine extracted data
-   **Collect the statistics** from the past games needed for analysis and sports results forecasts
-   **Create data-based rules** to form an accurate online sports betting strategy
-   **Optimize live monitoring** and analysis of what causes the changes in betting rates as well as what information influences betting decisions.

## Cost of usage

Using our basic plan, the scraper's run will cost you around **2.5 USD credits per 1000 scraped results**. For more details about the plans we offer, platform credits and usage, see the [platform pricing page](https://apify.com/pricing/actors).

If you're not sure how much credit you've got on your plan and whether you might need to upgrade, you can always check your limits in the *Settings* -> *Usage and Billing* tab in [your Console](https://console.apify.com/). The easiest way to know how many credits your actor will need is to perform a test run. 

## Tutorial

For a more detailed explanation on how to scrape Transfermarkt, read the [Transfermarkt scraper tutorial](https://blog.apify.com/how-to-scrape-transfermarkt/) on our blog.  For more ideas on how to use web scraping data, check out our  [industries pages](https://apify.com/industries)  for ways web scraping results are already being used across the projects and businesses of various scale and direction.

## Input parameters

The Transfermarkt Scraper accepts following parameters:

 - **startUrl** *(required)*: The start page URL, from which the scraper will be fending off.  
 - **parallels**:  Specifies how many parallel crawlers will be used; defaults to value 1. 
 - **crawlDepth**: defines how deep the crawler will navigate from the start page. Defaults to 1 (extracts data from the start page only), but if you set up a higher value, the crawler will go deeper into the links this page contains.  
 - **pageDepth**:  defines how far in pagination the run will be extended. By default it's set to unlimited - so if there's, say, 50 indexed pages of results, the crawler will not stop until it will finish scraping all of them.

### Example

```json
{
    "startUrls": [
        {
            "url": "https://www.transfermarkt.com/lionel-messi/profil/spieler/28003"
        }
    ],
    "proxyConfig": {
        "useApifyProxy": true
    },
    "crawlDepth": 1,
    "pageDepth": 1
};
```

## Output
The output from Transfermarkt Scraper is stored in the *Apify Dataset*. After the run is finished, you can choose to present and download the contents of the dataset in different data formats (JSON, XML, RSS, HTML Table...)

### Example

Here's an example output of the scraper when run with the input parameters from the previous example.

```javascript
{
  "id": "28003",
  "url": "https://www.transfermarkt.com/lionel-messi/profil/spieler/28003",
  "type": "player",
  "nameInHomeCountry": "Lionel Andrés Messi Cuccitini",
  "dateOfBirth": "Jun 24, 1987",
  "placeOfBirth": "Rosario",
  "age": "34",
  "height": "1,69 m",
  "citizenship": [
    "Argentina",
    "Spain"
  ],
  "position": "attack - Right Winger",
  "foot": "left",
  "playerAgent": "Relatives",
  "currentClub": "Paris Saint-Germain",
  "joined": "Aug 10, 2021",
  "contractExpires": "Jun 30, 2023",
  "contractOption": "Option for a further year",
  "outfitter": "adidas",
  "socialMedia": "",
}
```

## Other sports scrapers
We have other sport-related scrapers in stock for you; for instance, see this [Soccer Stats Scraper.](https://apify.com/glosterr/soccerstats-scraper#soccer-stats-scraper)

## Your feedback
We're always working on improving the performance of our actors. So if you've got any feedback about the work of our Transfermarkt API, do not hesitate to drop us a line in `support@apify.com`. If you do so much as to find a bug, please create an issue on the [Github page](https://github.com/cermak-petr/actor-transfermarkt) and we'll get to it.
