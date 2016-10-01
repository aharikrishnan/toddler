var system = require("system");
var page = require("webpage").create();
  var fs = require('fs');
var toddler = require('./toddler')(page, system, fs);
// C'mon start crawling.
toddler.crawl();


