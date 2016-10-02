module.exports = function(fs) {
  return {
    write: function(file, data){
      filePath = path.join(__dirname, '../out', file);
      fs.writeFile(filePath, JSON.stringify(data), function(err) { if(err) {
          return console.log(err);
        }
      });
    }
  };
}

