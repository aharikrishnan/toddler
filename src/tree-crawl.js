var system = require("system");
var page = require("webpage").create();
var fs = require("fs");
var toddler = require("./toddler")(page, system, fs);
var out = require("./out")(fs);
var evalCallback = function() {
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
  var tree = n2as($("section, #sitemap .has-columns ul.list-links > li"));
  return tree;
};
var waitCallback = function() {
  console.log("[VISIBLE]");
  return $("section, #sitemap .has-columns ul.list-links > li").is(":visible");
};
var filterCallback = function(node) {
  return/sitemap/.test(node._);
};
var tree = toddler.getTree({
  domain: "www.sears.com",
  url: "http://www.sears.com/en_us/sitemap.html",
  depth: 1,
  waitCallback: waitCallback,
  evalCallback: evalCallback,
  filterCallback: filterCallback,
  successCallback: function (tree) {
    out.write("tree.json", tree);
  }
});
