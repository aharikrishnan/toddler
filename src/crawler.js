var casper = require("casper").create({viewportSize:{width:1366, height:950}});
var fs = require("fs");
casper.userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.97 Safari/537.11");
casper.options.waitTimeout = 360000;
casper.options.stepTimeout = 360000;
casper.options.verbose = true;
casper.options.logLevel ="debug";
var getAllCategories = function(subCategories, length) {
  var categories = [], n = subCategories.length;
  for(var i=0;i<n; i++){
    var node =subCategories[i];
    if (node && /^http/.test(node.h)) {
      categories.push(node);
    }
  }
  return categories;
};
var getCategories = function(subCategories, length) {
  var categories = [], n = subCategories.length, j=0;
  for(var i=0;i<Math.min(n, length); ){
    var node =subCategories[j];
    j = j+1;
    if (node && /^http/.test(node.h)) {
      categories.push(node);
        i= i+1;
    }
    else{
      n = n-1;
    }
  }
  return categories;
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
  //console.log(JSON.stringify(table, null, "\t"));
  //fs.write("./out/table.json", JSON.stringify(table, null, "\t"), "w");
  casper.done();
  } else {
    if (category && category.h) {
      casper.thenOpen(category.h, function() {
        this.echo("[GET] " + this.getCurrentUrl());
        if(category.h === this.getCurrentUrl()){
          this.waitFor(searchResultsLoad, function() {
            var total = this.evaluate(function(){
              return $("#cards-holder .card-title").length;
            })
            var grid=[];
            var categoryTitle = category.n;
            var products = this.evaluate(extractDetails);
            for (var i = 0;i < products.length;i++) {
              var row = []
            row.push(categoryTitle);
          row.push(products[i]);
          grid.push(row);
            }
            fs.write("./out/table.json", JSON.stringify(grid, null, "\t"), "a");
            table.concat(grid);
            casper.wait(500).then(function() {
              scrape(index + 1, categories);
            })
          }, function() {
            this.captureSelector("./out/" + category.n + ".timeout.png".replace(/[^\x00-\x7F]/g, "-"), "body");
            scrape(index + 1, categories);
          }, 360000);
        }
        else{
          this.captureSelector("./out/" + category.n + ".fail.png".replace(/[^\x00-\x7F]/g, "-"), "body");
          scrape(index + 1, categories);
        }
      });
    } else {
      scrape(index + 1, categories);
    }
  }
};
var init = function(forest) {
  var randomCategories = [], perCategory = 3;
  fs.write("./out/categories.json", "------------Init-------------\n", "a");
  for (var i = 0;i < forest.length;i++) {
    var tree = forest[i];
    categories  = tree.l || [];
    selectedCategories = getAllCategories(categories, perCategory);
    randomCategories = randomCategories.concat(selectedCategories);
    fs.write("./out/categories.json", JSON.stringify(tree.n, null, "\t") + "\n", "a");
    fs.write("./out/categories.json", JSON.stringify(selectedCategories, null, "\t") + "\n", "a");
    fs.write("./out/categories.json", "------------------------\n", "a");
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
