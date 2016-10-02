var casper = require("casper").create({
  viewportSize: {width: 1366, height: 950}
});
var fs = require("fs");

casper.options.waitTimeout = 2000;
casper.userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.97 Safari/537.11");
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

var isVisible = function(){
  return this.evaluate(function(){
    $("#cards-holder .card-title").is(":visible") && $('#subcat-title [ng-bind^="displayProductCount"]').is(":visible")
  });
}
var searchResultsLoad = function() {
  return this.evaluate(function(){
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

var table=[];
var scrape = function(index, categories) {
  var category = categories[index];
  if(index >= categories.length){
    casper.run(function () {
      //if(table.length === categories.length){
      console.log(JSON.stringify(table, null, '\t'));
      fs.write('./out/table.json', JSON.stringify(table, null, '\t'), 'w');
      casper.done();
      //}
    })
  }
  else{
    if (category && category.h) {
      this.thenOpen(category.h, function() {
        this.echo("[GET] " + this.getCurrentUrl());
        this.waitFor(isVisible, function() {
          this.echo("[VISIBLE] count");
          this.waitFor(searchResultsLoad, function() {
            this.echo("[VISIBLE] items");
            var row = [];
            var categoryTitle = category.n;
            var products = page.evaluate(extractDetails);
            for (var i = 0;i < products.length;i++) {
              row.push(categoryTitle);
              row.push(products[i]);
            }
            table.push(row);
            casper.wait(100, function() {
              scrape(index + 1, categories);
            });
          });
        }, function() {
          this.captureSelector("./out/" + category.n + ".png".replace(/[^\x00-\x7F]/g, "-"), "body");
        });
      });
    }
    else{
      scrape(index + 1, categories);
    }
  }
};


var init = function (forest) {
  var randomCategories = [];
  for (var i = 0; i < forest.length; i++) {
    var tree = forest[i];
    var leaf = getRandomCategory(tree.l);
    randomCategories.push(leaf);
  }
  console.log(JSON.stringify(randomCategories));
  casper
    .start("http://sears.com", function () {
      this.echo('[START]' + this.getCurrentUrl());
    })
    .then(function () {
      scrape(0, randomCategories);
    })
};
var data = fs.read('./out/leaf.json');
forest = JSON.parse(data);
init(forest);

/*
   fs.readFile("./out/leaf.json", "utf8", function(err, data) {
   var forest = [];
   if (err) {
   return console.log(err);
   }
   forest = JSON.parse(data);
   init(forest);
   });
   */
