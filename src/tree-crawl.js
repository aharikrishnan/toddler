var n2a = function (node) {
  if (node.length) {
    var a = node.find('>a').first();
    var n = {
      n: a.attr('name') || a.text(),
      h: a.attr('href'),
      c: n2as(node.find('>ul>li'))
    }
    return n;
  } else {
    return {};
  }
};
var n2as = function(nodes){
  return nodes.map(function (i, node) {
    return n2a($(node));
  }).get();
};
var tree = n2as($('section'));
JSON.stringify(tree)
