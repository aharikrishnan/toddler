var fs = require("fs");

var extractLeaves= function(node){
  if(node && node.n.length){
    if(node.c.length === 0){
      return [{n: node.n, h: node.h}];
    }
    else{
      var leafNodes = [], leafNode;
      for(var i=0;i<node.c.length;i++){
        leafNode = extractLeaves(node.c[i]);
        leafNodes = leafNodes.concat(leafNode);
      }
      return leafNodes;
    }
  }
  return [];
};

var init = function(forest){
  var leafNodesByCategory = [];

  for(var i=0;i<forest.length; i++){
    var tree = forest[i];
    leafNodesByCategory.push({n:tree.n, l:extractLeaves(tree)});
  }

  fs.writeFile("./out/leaf.json", JSON.stringify(leafNodesByCategory, null, '\t'), function(err) {
    if(err) {
      return console.log(err);
    }
  });
};

fs.readFile("./out/forest.json", "utf8", function (err, data) {
  var forest = [];
  if (err) {
    return console.log(err);
  }
  forest = JSON.parse(data);
  init(forest)
});

