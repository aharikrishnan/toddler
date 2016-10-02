var casper = require("casper").create({viewportSize:{width:1366, height:950}});
var fs = require("fs");
casper.userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.97 Safari/537.11");
casper.options.waitTimeout = 300000;
casper.options.stepTimeout = 300000;
casper.options.verbose = true;
casper.options.logLevel ="debug";
var getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};
var getRandomCategory = function(subCategories, depth) {
  var depth = depth || 0;
  if (depth > 10) {
    return{};
  }
  var node = subCategories[getRandomInt(0, subCategories.length)];
  if (node && /^http/.test(node.h)) {
    return node;
  } else {
    return getRandomCategory(subCategories, depth + 1);
  }
};
var searchResultsLoad = function() {
  return casper.wait(700).evaluate(function() {
    var elements =  $("#cards-holder .card-title").length && $('#subcat-title [ng-bind^="displayProductCount"]').length;
    if(!elements){
      return false;
    }
    var scrollStep = 200;
    var scroll = window.document.body.scrollTop + scrollStep;
    if (scroll >= document.body.scrollHeight) {
      scroll = scroll - 2 * scrollStep;
    }
    window.document.body.scrollTop = scroll;
    var length = $("#cards-holder .card-title").length;
    var totalItems = parseInt($('#subcat-title [ng-bind^="displayProductCount"]').text(), 10);
    console.log("[T]" + "length -> " + length + "  scroll top -> " + document.body.scrollTop + " scroll height -> " + document.body.scrollHeight);
    return length > Math.min(45, totalItems - 2);
  });
};
var extractDetails = function() {
  var titles = [];
  $("#cards-holder .card-title").each(function() {
    console.log("[T]" + "[R]" + $(this).text());
    titles.push($(this).text());
  });
  return titles;
};
var table = [];
var scrape = function(index, categories) {
  var category = categories[index];
  console.log("scrape "+ category.h)
  if (index >= categories.length) {
  console.log("DONE");
  console.log(JSON.stringify(table, null, "\t"));
  fs.write("./out/table.json", JSON.stringify(table, null, "\t"), "w");
  casper.done();
  } else {
    if (category && category.h) {
      casper.thenOpen(category.h, function() {
        this.echo("[GET] " + this.getCurrentUrl());
        this.waitFor(searchResultsLoad, function() {
          var total = this.evaluate(function(){
            return $("#cards-holder .card-title").length;
          })
          var row = [];
          var categoryTitle = category.n;
          var products = this.evaluate(extractDetails);
          for (var i = 0;i < products.length;i++) {
            row.push(categoryTitle);
            row.push(products[i]);
          }
          table.push(row);
          console.log(row.length)
          casper.wait(100).then(function() {
            scrape(index + 1, categories);
          })
        }, function() {
          this.captureSelector("./out/" + category.n + ".png".replace(/[^\x00-\x7F]/g, "-"), "body");
        }, 300000);
      });
    } else {
      scrape(index + 1, categories);
    }
  }
};
var init = function(forest) {
  var randomCategories = [];
  for (var i = 0;i < forest.length;i++) {
    var tree = forest[i];
    var leaf = getRandomCategory(tree.l);
    randomCategories.push(leaf);
  }
  console.log(JSON.stringify(randomCategories));
  console.log(randomCategories.length);
  scrape(0, randomCategories);
};

casper.start("http://www.sears.com/", function() {
  this.echo("[START]" + this.getCurrentUrl());
})
casper.then(function() {
var data = fs.read("./out/leaf.json");
forest = JSON.parse(data);
init(forest);
});
casper.run()
