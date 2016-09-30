var system = require("system");
var page = require("webpage").create();
var toddler = require('./toddler')(page, system);

// C'mon start crawling.
toddler.crawl();


