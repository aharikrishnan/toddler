module.exports = function(fs) {
  return {
    write: function(file, data){
      //var filePath = path.join(__dirname, '../out', file);
      var filePath = ['/home/hari/toddler/out', file].join('/')
      fs.writeFile(filePath, JSON.stringify(data), function(err) { if(err) {
          return console.log(err);
        }
      });
    }
  };
}

