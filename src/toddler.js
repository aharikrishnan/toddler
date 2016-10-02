module.exports = function(page, system, fs, out) {
  var args = system.args;
  var DEFAULT_OPTIONS = {url:undefined, pageNum:1, maxFails:3, maxPages:1};
  var getOptions = function() {
    var options = DEFAULT_OPTIONS;
    if (args.length > 1) {
      options.url = args[1];
      options.pageNum = parseInt(args[2], 10) || options.pageNum;
    } else {
      console.log("USAGE: phantomjs crawl.js <url> [page number]");
      phantom.exit();
    }
    return options;
  };
  var prepareBrowser = function() {
    page.viewportSize = {width:1200, height:800};
    page.settings.userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.82 Safari/537.36";
    page.onConsoleMessage = function(msg) {
      system.stderr.writeLine("[[console]]  " + msg);
    };
    page.onError = function(message, url, lineNumber) {
      system.stderr.writeLine("!!!!!!!!!! [[ERROR]]  " + msg);
      return true;
    };
    phantom.waitFor = function(callback) {
      do {
        this.page.sendEvent("mousemove");
      } while (!callback());
    };
    prepareBrowser = function() {
    };
  };
  var sleep = function(miliseconds, message) {
    console.log(message);
    var currentTime = (new Date).getTime();
    while (currentTime + miliseconds >= (new Date).getTime()) {
    }
  };
  var searchResultsLoad = function() {
    return page.evaluate(function() {
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
  var _crawl = function(options, pageNum, attempts, fails) {
    var url = options.url;
    var maxFails = options.maxFails;
    var maxPages = options.maxPages;
    pageNum = pageNum || 1;
    attempts = attempts || 0;
    fails = fails || 0;
    var currentPage = url.replace("PAGE_NUM", pageNum);
    if (pageNum > maxPages) {
      console.log("DONE");
      phantom.exit();
    }
    console.log("[T]  " + pageNum + "  " + JSON.stringify(options));
    if (fails > maxFails || attempts >= maxFails) {
      console.log("[T] [RESULT] [" + currentPage + "]  [failed] " + url);
      phantom.exit();
    }
    prepareBrowser();
    page.open(currentPage, function(status) {
      if (status !== "success") {
        sleep(2E3, "[retry] " + fails + " | " + currentPage + " status " + status);
        _crawl(options, pageNum, 0, fails + 1);
      } else {
        page.evaluate(function() {
          window.onerror = function() {
            console.log("Error");
            return true;
          };
          window.navigator.geolocation = {getCurrentPosition:function(success, failure) {
            success({coords:{latitude:54.0834, longitude:12.1004}, timestamp:Date.now()});
          }};
        });
        var url = page.evaluate(function() {
          return window.location.href;
        });
        console.log("[T]" + "[URL]" + url);
        if (url !== currentPage) {
          console.log("[T]" + "Trying " + attempts + " ..");
          sleep(2E3, "[retry] " + fails + " | " + currentPage + " Unable to access network " + status);
          console.log("[T] [RESULT] [" + currentPage + "]  [failed] " + url);
          _crawl(options, pageNum, attempts + 1, 0);
        }
        console.log("[T]" + "waiting");
        phantom.waitFor(function() {
          return page.evaluate(function() {
            return $("#cards-holder .card-title").is(":visible") && $('#subcat-title [ng-bind^="displayProductCount"]').is(":visible");
          });
        });
        console.log("[T]" + "READY 1!");
        phantom.waitFor(searchResultsLoad);
        console.log("[T]" + "READY 2!");
        console.log("[T][" + url + "]------------BEGIN " + pageNum + "-------------");
        var titles = page.evaluate(extractDetails);
        console.log("[T] [RESULT] [" + url + "]  " + JSON.stringify(titles));
        console.log("[T]" + "------------END-------------");
        _crawl(options, pageNum + 1, 0, 0);
      }
    });
  };
  var n2as = function(nodes) {
    return nodes.map(function(i, node) {
      return n2a($(node));
    }).get();
  };
  var walkNodes = function(childrens, callback){
    console.log('[WALK] length: '+ childrens.length)
    if (!node || node === []) {
      return;
    }
    for (var i = 0;i < childrens.length;i++) {
      walkTree(childrens[i], callback);
    }
  };
  var walkTree = function(node, callback) {
    console.log('[WALK] '+ JSON.stringify(node))
    if (!node || node === {}) {
      return;
    }
    callback(node);
    walkNodes(node.c, callback)
  };
  var _getTree = function(domain, siteMap, currentDepth, waitCallback, evalCallback, filterCallback, successCallback, depth) {
    if (currentDepth < 0) {
      return{};
    }
    console.log("[GET] " + siteMap);
    page.open(siteMap, function(status) {
      if (status !== "success") {
        console.log("[FAIL| " + siteMap + "] " + status);
        return{};
      } else {
        console.log("[FETCH]");
        var pageURL = page.evaluate(function() {
          return window.location.href;
        });
        if (pageURL !== siteMap) {
          console.log("[FAIL |" + siteMap + "]  [GOT | " + pageURL + "] trying again..");
          return _getTree(domain, siteMap, currentDepth, waitCallback, evalCallback, filterCallback, successCallback, depth);
        }
        console.log("[WAIT]");
        phantom.waitFor(function() {
          return page.evaluate(waitCallback);
        });
        console.log("[EVAL]");
        var nodes = page.evaluate(evalCallback);
        var callback = function(node) {
          var url = node._;
          if (filterCallback(node)) {
            if (!/^http/.test(url)) {
              url = "http://" + domain + "/" + url;
            }
            var subTree = _getTree(domain, url, currentDepth - 1, waitCallback, evalCallback, filterCallback, successCallback, depth);
            node.c = subTree.c;
          }
        }
        walkNodes(nodes, callback);
        if (currentDepth === depth) {
          successCallback(nodes);
          console.log("--------------------------------------------------------------------------------");
          console.log("[DONE]");
        }
        console.log(JSON.stringify(nodes));
        return nodes;
      }
    });
  };
  return{getTree:function(options) {
    prepareBrowser();
    options = options || {};
    options.depth = options.depth || 1;
    console.log("[START] " + JSON.stringify(options));
    var tree = _getTree(options.domain, options.url, options.depth, options.waitCallback, options.evalCallback, options.filterCallback, options.successCallback, options.depth);
  }, crawl:function(urls) {
    urls = urls || [];
    if (!urls.length) {
      var options = getOptions(!urls.length);
      _crawl(options, options.pageNum, 0, 0);
    } else {
      var options = DEFAULT_OPTIONS;
      for (var i = 0;i < urls.length;i++) {
        options.url = urls[i];
        _crawl(options, options.pageNum, 0, 0);
      }
    }
  }};
};

