var casper = require('casper').create();
var fs = require('fs');
var forest, links=['http://www.sears.com/en_us/sitemap.html'], index=-1;
var domain = "www.sears.com";

function getLinks() {
  var n2a = function(node) {
    if (node.length) {
      var a = node.find(">a").first(), h = a.attr("href"), n = null, _ = null;
      if (/sitemap/.test(h)) {
        _ = h;
        a = node.find("> h2 > a").first();
        h = a.attr("href");
      }
      n = {n:a.attr("name") || a.text(), h:h, c:n2as(node.find(">ul>li")), _:_};
      return n;
    } else {
      return null;
    }
  };
  var n2as = function(nodes) {
    return nodes.map(function(i, node) {
      return n2a($(node));
    }).get();
  };
  var nodes = n2as($("section, #sitemap .has-columns ul.list-links > li"));
  return nodes;
}
var walkNodes = function(nodes, level){
  console.log('[WALK] length: '+ nodes.length);
  if (level < 0 || !nodes || !nodes.length) {
    return nodes;
  }
  for (var i = 0;i < nodes.length;i++) {
    walkTree(nodes[i], level -1);
  }
  return nodes;
};

var walkTree = function(node, level) {
  if (level < 0 && !node || node === {}) {
    return;
  }
  if(/sitemap/.test(node._)){
    var url = node._;
    if (!/^http/.test(url)) {
      url = "http://" + domain + "/" + url;
    }
    getPage(url, function(nodes){
      node._ = "";
      node.c = nodes;
      console.log("[PLUG] "+ JSON.stringify(nodes))
      fs.write('./out/tree.json', JSON.stringify(nodes, null, '\t'), 'a');
    })
  }
  walkNodes(node.c, level -1)
};

var getPage = function(link, callback){
  casper.thenOpen(link, function () {
    this.echo(this.getCurrentUrl());
  })
  .then(function(){
    var nodes = this.evaluate(getLinks);
    if(callback){
      callback(nodes)
    }
  })
}

casper
.start('http://www.sears.com')
.then(function(){
  getPage('http://www.sears.com/en_us/sitemap.html', function (nodes) {
    walkNodes(nodes, 2);
    forest = nodes;
  })
})
.run(function () {
  console.log(JSON.stringify(forest));
  fs.write('./out/data.json', JSON.stringify(forest, null, '\t'), 'w');
  casper.done();
});

