const widgets = require("widget");
const tabs = require("tabs");
const timer = require("timer");
const data = require("self").data;
const ss = require("simple-storage");

var md5 = require("./md5");

var pageMod = require("page-mod");

var Request = require("request").Request;

var result = null;

var popup = require("panel").Panel({
  width:402,
  height:190,
  contentURL: data.url("popup.html")
});

popup.on("show", function() {
	settings = getSettings();
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


function run()
{
	getResult();	
}

var getResult = function()
{
	Request({
	  url: "http://api.quora.com/api/logged_in_user?fields=inbox,notifs",
	  onComplete: function (response) {
	  	 var lastResult = JSON.parse(response.text.match(/{.*}/));
	  	 if(lastResult != null)
	  	 {
	  	 	result = lastResult;
	  	 	update();
	  	 }
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
	link = "http://www.quora.com/board/bookmarklet?v=1&url="+encodeURIComponent(url);	
	//opup.port.emit("post-page-pop", link);
	tabs.open(link);	
}

require("context-menu").Item({
  label: "Post to Quora"
}).on("click", function()
{
	postToQuora();
});
timer.setInterval(run, 30000);
run();

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
    
    data = new Object();
    data.file = data.url("css/content.css");
    data.settings = getSettings();
    worker.port.emit("load", data);
    
    worker.port.on("recommendation", function(title)
    {
    	getRecommendation(title, worker);
    });
  }
});

function getRecommendation(title, obj)
{
	if(title == "" || title == null)
	{
		return;
	}
	
	var cache = checkCache("Title:"+title);
	console.log(cache);
	
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

function updateCache(title, value)
{
	
	key = md5.hex_md5(title);
	
	date = new Date();
	time = date.getTime();
	
	if(ss.storage.cache == null)
	{
		ss.storage.cache = new Array();
	}	
	
	obj = {"data": data, "time": time};
	
	ss.storage.cache[key] = obj;
}

function checkCache(title)
{
	
	if(ss.storage.cache == null)
	{
		return null;
	}
	
	key = md5.hex_md5(title);
	
	item = ss.storage.cache[key];
	
	if(item == null || item == undefined)
	{
		return null;
	}
	
	date = new Date();
	time = date.getTime();
	
	if(item.time < (time - (1000 * 3600)))
	{
		return null;
	}else
	{
		return item.data;	
	}	
	return null;
}


