var casper = require("casper").create({
    viewportSize: {width: 1366, height: 950}
});
var fs = require("fs");
 
casper.options.waitTimeout = 5000;

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
  return $("#cards-holder .card-title").is(":visible") && $('#subcat-title [ng-bind^="displayProductCount"]').is(":visible");
}
var searchResultsLoad = function() {
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
};
var extractDetails = function() {
  var titles = [];
  $("#cards-holder .card-title").each(function() {
    console.log("[T]" + "[R]" + $(this).text());
    titles.push($(this).text());
  });
  return titles;
};

var scrape = function(categories){
  var table=[];
  console.log('[START]')
  casper.start("http://sears.com",function(){
    this.echo(this.getCurrentUrl());
  });
  casper.each(categories, function(casper,category){
    if(category.h){
      this.echo("[TODO] "+category.h);
      casper.thenOpen(category.h, function(){
        this.echo("[GET] "+this.getCurrentUrl());
        casper.waitFor(isVisible, function(){
          this.echo("[VISIBLE] count");
          casper.waitFor(searchResultsLoad, function() {
            this.echo("[VISIBLE] items");
            //this.captureSelector('yoursitelist.png', 'ul.your-list');
            var row = []
            var categoryTitle = category.n;
          var products = page.evaluate(extractDetails);
          for(var i=0;i<products.length;i++){
            row.push(categoryTitle);
            row.push(products[i]);
          }
          table.push(row);
          });
        },
        function(){
          this.captureSelector('./out/'+category.n+'.png'.replace(/[^\x00-\x7F]/g, "-"), 'body');
        })
      })
    }
  });
  casper.run(function(){
          //if(table.length === categories.length){
            console.log(JSON.stringify(table, null, '\t'));
            fs.write('./out/table.json', JSON.stringify(table, null, '\t'), 'w');
            casper.done();
          //}
  })
}

var init = function(forest) {
  var randomCategories = [];
  for (var i = 0;i < forest.length;i++) {
    var tree = forest[i];
    var leaf = getRandomCategory(tree.l);
    randomCategories.push(leaf);
  }
  console.log(JSON.stringify(randomCategories));
  scrape(randomCategories);
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
