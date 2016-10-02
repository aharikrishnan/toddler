var out = require('../out/a.out');
var result = out.result;
var tree = out.tree;
var op=[];
for(var i=0;i < result.length;i++){
  var category = result[i];
  var url = category[0][0], name=tree[url];
  if(!name){
    console.log(" NOT FOUND "+ url);
    name = url;
  }
  var titles = category[1];
  for(var j=0;j<titles.length; j++){
    op.push([name, titles])
  }
}

console.log(op.length)
