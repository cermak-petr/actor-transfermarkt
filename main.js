const Apify = require('apify');

const { log } = Apify.utils;

/**
 * @param {import("puppeteer").ElementHandle<Element>} element
 * @param {string} attr
 */
async function getAttribute(element, attr) {
    try {
        const prop = await element.getProperty(attr);
        return (await prop.jsonValue()).trim();
    } catch (e) {
        return null;
    }
}

/**
 * @param {import("puppeteer").ElementHandle<Element>} element
 */
async function getText(element) {
    return getAttribute(element, 'textContent');
}

/**
 * @param {string} url
 */
function extractId(url) {
    const match = url.match(/[a-z]+\/(\d+)/);
    return match ? match[1] : null;
}

/**
 * @param {import("puppeteer").Page} page
 * @param {string} selector
 * @param {boolean} [isTable]
 */
async function extractHeader(page, selector, isTable) {
    const result = {};
    const rows = await page.$$(selector + (isTable ? ' tr' : ' p'));
    for (const row of rows) {
        const cells = await row.$$(isTable ? 'th, td' : 'span');
        if (cells.length > 1) {
            const name = convertName(await getText(cells[0]));
            const rText = (await getText(cells[1])).split(/\s\s/);
            result[name.slice(0, name.length - 1)] = rText.length > 1 ? rText : rText[0];
        }
    }
    return result;
}

/**
 * @param {import("puppeteer").ElementHandle<Element>} row
 * @param {{ id?: any; url?: any; }} record
 */
async function addRowId(row, record) {
    let id = null;
    let url = null;
    const links = await row.$$('a[id]');
    for (const link of links) {
        const href = await getAttribute(link, 'href');
        const nId = extractId(href);
        if (nId) {
            if (id === null || nId === id) {
                id = nId;
                url = href;
            } else {
                return;
            }
        }
    }
    if (id) {
        record.id = id;
        record.url = url;
    }
}

/**
 * @param {import("puppeteer").ElementHandle<Element>} cell
 */
async function extractImageCell(cell) {
    const imgs = await cell.$$('img');
    if (imgs.length === 0) {
        return null;
    }
    if (imgs.length > 1) {
        const arr = [];
        for (const img of imgs) {
            arr.push(await getAttribute(img, 'alt'));
        }
        return arr;
    }
    return getAttribute(imgs[0], 'alt');
}

/**
 * @param {import("puppeteer").Page} page
 * @param {string} selector
 * @param {boolean} iGenerate
 * @param {number[]} iColumns
 */
async function extractTableHeaders(page, selector, iGenerate, iColumns) {
    const headers = await page.$$(`${selector} > thead th`);
    for (let i = 0; i < headers.length; i++) {
        const hText = (await getText(headers[i])).trim();
        if (!hText || hText.length < 1) {
            const title = await headers[i].$('[title]');
            if (title && iGenerate) {
                iColumns.push(i);
            }
            headers[i] = title
                ? convertName(await getAttribute(title, 'title'))
                : '_i';
        } else {
            if (iGenerate) {
                iColumns.push(i);
            }
            headers[i] = convertName(hText);
        }
    }
    return headers;
}

/**
 * @param {import("puppeteer").Page} page
 * @param {string} selector
 * @param {number[]} [iColumns]
 * @param {number[]} [iRowCells]
 */
async function extractTable(page, selector, iColumns, iRowCells) {
    const result = [];
    const iGenerate = !iColumns;
    if (iGenerate) {
        iColumns = [];
    }
    const headers = await extractTableHeaders(
        page,
        selector,
        iGenerate,
        iColumns,
    );
    const rows = await page.$$(
        `${selector} > tbody > tr:not(.show-for-small-table-row)`,
    );
    for (const row of rows) {
        const cells = await row.$$(':scope > td');
        if (cells.length < 2) {
            continue;
        }
        const record = {};
        await addRowId(row, record);
        for (const [i, index] of (iRowCells || iColumns).entries()) {
            if (!cells[index]) {
                continue;
            }
            const iCells = await cells[index].$$('table td');
            if (iCells && iCells.length > 0) {
                const recordArr = [];
                for (const iCell of iCells) {
                    const content = await iCell.$(':scope > :first-child');
                    const iText = (await getText(content || iCell)).trim();
                    if (iText.length > 0 && iText !== '-') {
                        recordArr.push(iText);
                    }
                }
                record[headers[iColumns[i]]] = recordArr;
            } else {
                const rText = (await getText(cells[index])).split(/\s\s/);
                const fText = rText.length > 1 ? rText : rText[0].trim();
                if (fText === '' || fText === '-') {
                    record[headers[iColumns[i]]] = await extractImageCell(
                        cells[index],
                    );
                } else {
                    record[headers[iColumns[i]]] = fText;
                }
            }
        }
        result.push(record);
    }
    return result;
}

/**
 * @param {string} name
 */
function convertName(name) {
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const split = name.trim().split(/[\-\s]/);
    let result = '';
    for (let i = 0; i < split.length; i++) {
        split[i] = split[i]
            .replace('ø', 'avg')
            .replace('#', 'number')
            .replace(/\(|\)/g, '');
        if (split[i].match(/[a-zA-Z\-]+/)) {
            result
                += result.length > 0
                    ? capitalize(split[i])
                    : split[i].toLowerCase();
        }
    }
    return result;
}

/**
 * @param {import("puppeteer").Page} page
 * @param {Apify.RequestQueue} requestQueue
 * @param {{ [x: string]: any; pageDepth?: any; crawlDepth?: any; }} userData
 * @param {string} selector
 * @param {number} dType
 */
async function enqueueLinks(page, requestQueue, userData, selector, dType) {
    const links = await page.$$(selector);
    log.info(`found subpage links: ${links.length}`);
    for (const link of links) {
        const href = await getAttribute(link, 'href');
        if (href) {
            await requestQueue.addRequest(
                new Apify.Request({
                    url: href,
                    userData: dType
                        ? {
                            pageDepth: userData.pageDepth + 1,
                        }
                        : {
                            crawlDepth: userData.crawlDepth + 1,
                        },
                }),
            );
        }
    }
}

Apify.main(async () => {
    /**
     * @type {any}
     */
    const input = await Apify.getValue('INPUT');

    if (!input.startUrls) {
        throw new Error('Missinq "startUrls" attribute in INPUT!');
    }
    if (!input.crawlDepth) {
        input.crawlDepth = 1;
    }
    if (!input.pageDepth) {
        input.pageDepth = 99999999;
    }

    // Check and fix startUrls
    const startUrls = input.startUrls.map((url) => {
        const req = url.url
            ? url
            : {
                url,
            };
        req.userData = {
            pageDepth: 1,
            crawlDepth: 1,
        };
        return req;
    });

    // Create RequestList
    const requestList = await Apify.openRequestList('startUrls', startUrls);

    // Create RequestQueue
    log.info('opening request queue');
    const requestQueue = await Apify.openRequestQueue();

    const proxyConfiguration = await Apify.createProxyConfiguration(
        input.proxyConfig,
    );

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        requestQueue,
        useSessionPool: true,
        proxyConfiguration,
        handlePageTimeoutSecs: 300,
        handleRequestTimeoutSecs: 60,
        handlePageFunction: async ({ page, request }) => {
            page.on('console', (msg) => {
                for (let i = 0; i < msg.args.length; ++i) {
                    log.info(`${i}: ${msg.args[i]}`);
                }
            });

            await page.waitForSelector('body', {
                timeout: 60000,
            });

            if (
                input.crawlDepth > 1
                && request.userData.crawlDepth < input.crawlDepth
            ) {
                await enqueueLinks(
                    page,
                    requestQueue,
                    request.userData,
                    '#yw1 table.items > tbody :not(.hide-for-small) > a:not(.hide-for-small)',
                    0,
                );
            }
            if (
                input.pageDepth > 1
                && request.userData.pageDepth < input.pageDepth
            ) {
                await enqueueLinks(
                    page,
                    requestQueue,
                    request.userData,
                    '.page a',
                    1,
                );
            }

            if (
                input.extractLevels
                && input.extractLevels.indexOf(request.userData.crawlDepth) < 0
            ) {
                return;
            }

            const rObj = {};
            const pageId = extractId(request.url);
            if (pageId) {
                rObj.id = pageId;
            }
            rObj.url = request.url;

            if (request.url.match(/\/wettbewerb\//)) {
                if (
                    input.extractOnly
                    && input.extractOnly.indexOf('competition') < 0
                ) {
                    return;
                }
                rObj.type = 'competition';
                log.info(`competition page open: ${request.url}`);
                const result = Object.assign(
                    rObj,
                    await extractHeader(page, '.profilheader', true),
                );
                result.clubs = await extractTable(page, '#yw1 table.items', [
                    1,
                    3,
                    4,
                    5,
                    6,
                    7,
                ]);
                await Apify.pushData(result);
            } else if (request.url.match(/\/verein\//)) {
                if (
                    input.extractOnly
                    && input.extractOnly.indexOf('club') < 0
                ) {
                    return;
                }
                rObj.type = 'club';
                log.info(`club page open: ${request.url}`);
                const result = Object.assign(
                    rObj,
                    await extractHeader(page, '.dataDaten'),
                );
                result.players = await extractTable(page, '#yw1 table.items', [
                    0,
                    1,
                    3,
                    5,
                ]);
                await Apify.pushData(result);
            } else if (request.url.match(/\/spieler\//)) {
                if (
                    input.extractOnly
                    && input.extractOnly.indexOf('player') < 0
                ) {
                    return;
                }
                rObj.type = 'player';
                log.info(`player page open: ${request.url}`);
                log.info('extracting player info...');
                const result = Object.assign(
                    rObj,
                    await extractHeader(page, '.auflistung', true),
                );
                log.info('extracting transfer info...');
                result.transfers = await extractTable(
                    page,
                    '.transferhistorie table',
                    [0, 1, 2, 4, 6, 7],
                    [0, 1, 5, 9, 10, 11],
                );
                log.info('extracting carreer stats...');
                result.careerStats = await extractTable(
                    page,
                    '#yw1 table.items',
                    [0, 2, 3, 4, 5],
                    [1, 2, 3, 4, 5],
                );
                await Apify.pushData(result);
            } else if (await page.$('#yw1 table.items')) {
                log.info(`other page open: ${request.url}`);
                const result = Object.assign(rObj, {
                    data: await extractTable(page, '#yw1 table.items'),
                });
                await Apify.pushData(result);
            } else {
                log.info(`unsupported page open: ${request.url}`);
                await Apify.pushData({
                    url: request.url,
                    error: 'Page type not supported.',
                });
            }
        },
        handleFailedRequestFunction: async ({ request }) => {
            log.info(`Request ${request.url} failed 4 times`);
        },
        preNavigationHooks: [
            async ({ page }, gotoOptions) => {
                await Apify.utils.puppeteer.blockRequests(page);
                gotoOptions.waitUntil = 'networkidle2';
            },
        ],
        launchContext: {
            stealth: true,
        },
    });

    log.info('running the crawler');
    await crawler.run();
});
