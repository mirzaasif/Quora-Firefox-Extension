const widgets = require("widget");
const tabs = require("tabs");
const timer = require("timer");
const data = require("self").data;
const ss = require("simple-storage");

var md5 = require("./md5");

var pageMod = require("page-mod");

var Request = require("request").Request;

var contextMenu = require("context-menu");

var result = null;

var popup = require("panel").Panel({
  width:402,
  height:190,
  contentURL: data.url("popup.html")
});

popup.on("show", function() {
	var settings = getSettings();
	data = new Object();
	data.result = result;
	data.settings = settings;
  	popup.port.emit("show", data);
});

popup.on("hide", function() {
  console.log("hide");
  popup.resize(popup.width, 190);
});

popup.port.on("settings-save", function(settings)
{
	saveSettings(settings);
});

var widget = widgets.Widget({
  id: "widget",
  label: "Charm for Quora",
  contentURL: data.url("widget.html"),
  width: 40,
  panel: popup
});

function run()
{
	getResult();	
}

var getResult = function()
{
	Request({
	  url: "http://api.quora.com/api/logged_in_user?fields=inbox,notifs",
	  onComplete: function (response) {
	  	var lastResult = null;
	  	try
	  	{
	  		 lastResult = JSON.parse(response.text.match(/{.*}/));	
	  	}catch(e)
	  	{
	  		
	  	}finally
	  	{
	  		result = lastResult;
	  	 	update();
	  	}
	  	 /*
	  	 if(lastResult != null)
	  	 {
	  	 	
	  	 }
	  	 */
	  }
	}).get();	
}

function update()
{
	if(result == null)
	{
		notification = 0;
		inbox = 0;
	}else
	{
		notifications = parseInt(result.notifs.unseen_aggregated_count);
		inbox = parseInt(result.inbox.unread_count);
		widget.port.emit("update", notifications);
	}
}

popup.port.on("link", function(url)
{
	tabs.open(url);
	popup.hide();
})

popup.port.on("size-height", function(height)
{
	popup.resize(popup.width, height+10);
	console.log("Set Height: "+height);
})

popup.port.on("search", function(data)
{
	Request({
	  url: 'http://www.quora.com/ajax/full_navigator_results?q='+encodeURIComponent(data.query)+'&data=%7B%7D&___W2_parentId='+Math.random()+'&___W2_windowId='+Math.random(),
	  onComplete: function (response) {
	  	data.result = response.json;
	  	popup.port.emit("search-result", data);
	  }
	}).get();
})


popup.port.on("post-page", function()
{
	postToQuora();
	popup.hide();
})

function postToQuora()
{
	url = tabs.activeTab.url;
	postLinkToQuora(url);
}

timer.setInterval(run, 30000);
run();
timer.setInterval(clearCache, 60 * 1000 * 10);

var workers = [];

pageMod.PageMod({
  include: "*",
  contentScriptFile: [data.url("js/lib/jquery-1.7.1.min.js"),
  					  data.url("js/lib/stopword.js"),
                      data.url("js/content.js")],
  onAttach: function(worker)
  {
    workers.push(worker);
    worker.on("detach", function()
    {
      var index = workers.indexOf(worker);
      if (index >= 0)
      {
      	workers.splice(index, 1);
      }
    });
    
    var d = new Object();
    d.file = data.url("css/content.css");
    d.settings = getSettings();
    worker.port.emit("load", d);
    
    worker.port.on("recommendation", function(title)
    {
    	getRecommendation(title, worker);
    });
    
    worker.port.on("post-page", function()
	{
		postToQuora();
	});
	
	worker.port.on("block-domain", function(domain)
	{
		var settings = getSettings(); 
		settings.block_url = domain + "\n" + settings.block_url;
		saveSettings(settings);
	});
	
	worker.port.on("get-title-success", function(title)
	{
		getRecommendation(title, popup);
	});
  }
});

popup.port.on("recommedation", function()
{
	console.log("recommedation");
	for each (var worker in workers)
	{
		if(worker.tab == tabs.activeTab)
		{
			worker.port.emit("get-title");
		}
	}
})


function getRecommendation(title, obj)
{
	if(title == "" || title == null || title == undefined)
	{
		return;
	}
	
	var cache = checkCache("Title:"+title);
	
	if(cache == null || cache == undefined)
	{
		Request({
		  url: 'http://www.quora.com/ajax/full_navigator_results?q='+encodeURIComponent(title)+'&data=%7B%7D&___W2_parentId='+Math.random()+'&___W2_windowId='+Math.random(),
		  onComplete: function (response) {
		  	 //getRecoomendationSuccess(response.json, obj);
		  	 obj.port.emit("recommendation-success", response.json);
		  	 updateCache("Title:"+title, response.json);
		  }
		}).get();	
	}else
	{
		obj.port.emit("recommendation-success", cache);
	}
}

function clearCache()
{
	if(ss.storage.cache == null)
	{
		return null;
	}
	
	console.log("clearCache");
	
	var date = new Date();
	var time = date.getTime();
	
	for each (var item in ss.storage.cache)
	{
		if(item.time < (time - (1000 * 3600)))
		{
			delete ss.storage.cache[item.key];
		}	
	}
}

function updateCache(title, value)
{
	
	var key = md5.hex_md5(title);
	
	var date = new Date();
	var time = date.getTime();
	
	if(ss.storage.cache == null)
	{
		ss.storage.cache = new Array();
	}	
	
	var obj = {"data": value, "time": time, "key": key};
	
	ss.storage.cache[key] = obj;
	
	//console.log(ss.storage.cache[key].value);
}

function checkCache(title)
{
	
	if(ss.storage.cache == null)
	{
		return null;
	}
	
	var key = md5.hex_md5(title);
	
	var item = ss.storage.cache[key];
	
	if(item == null || item == undefined)
	{
		return null;
	}
	
	var date = new Date();
	var time = date.getTime();
	
	if(item.time < (time - (1000 * 3600)))
	{
		return null;
	}else
	{
		return item.data;	
	}	
	return null;
}

function saveSettings(settings)
{
	ss.storage.settings = settings;
	console.log("Update settings");
}

function getSettings()
{
	if(ss.storage.settings == null || ss.storage.settings == undefined)
	{
		settins1 = true;
		setting2 = true;
		block_url = "*.google.com\n*.quora.com\n*.live.com\nmail.yahoo.com";
		item = {"setting1": settins1, "setting2": setting2, "block_url": block_url};
		ss.storage.settings = item;
		console.log("Default settings created");
	}
	return ss.storage.settings;
}

var myItem1 = contextMenu.Item({
  label: "Post this image to Quora",
  contentScript: 'self.on("click", function (node) {' +
                 '  self.postMessage(node.src);' +
                 '});',
  onMessage: function (url) 
  {
    postLinkToQuora(url);
  }           
});

var context1 = contextMenu.SelectorContext("img");
myItem1.context.add(context1);

var myItem2 = contextMenu.Item({
  label: "Post to Quora",
  contentScript: 'self.on("click", function (node) {' +
                 '  self.postMessage(document.URL);' +
                 '});',
  onMessage: function (url) 
  {
    postLinkToQuora(url);
  }           
});


function postLinkToQuora(link)
{
	link = "http://www.quora.com/board/bookmarklet?v=1&url="+encodeURIComponent(link);	
	//opup.port.emit("post-page-pop", link);
	tabs.open(link);		
}




