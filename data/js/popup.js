var result = null;
var settings = null;
var recommendedLinksNumber = 0;

addon.port.on("show", function(data)
{
	result = data.result;
	settings = data.settings;
	onLoad();
});

addon.port.on("search-result", function(data)
{
	showSearchSuggestion(data.result, data.time, data.query);
});

addon.port.on("post-page-pop", function(link)
{
	window.open(link,'_blank','toolbar=0,scrollbars=no,resizable=1,status=1,width=430,height=400');
});

addon.port.on("recommendation-success", function(data)
{
	recommendationResult(data);
});

function recommendationResult(data)
{
	$("#charm_hidden_result").html(data.html);
  	var responseData = new Object();
  	responseData.board = [];
  	responseData.topic = [];
  	responseData.question = [];
  	responseData.profile = [];
  	responseData.all = [];
  	
  	$("#charm_hidden_result a").each(
  		function()
  		{
  			href = $(this).attr("href");
  			text = $(this).find('.text').text();
			des = $(this).find('.desc').text();
			if(des == "")
			{
				des = $(this).find('.faded').text();
				index = text.lastIndexOf(des);
				if(index > -1)
				{
					text = text.substr(0, index - 1);
				}
			}
			img = $(this).find('img');
			if(img.length > 0)
			{
				img = img.attr("src");
			}else
			{
				img = null;
			}
			
			if(href != "" && href != "#")
			{
				obj = {"url": href, "title": text, "des": des, "img": img};
			
				type = "Etc";
				if($(this).parent().hasClass("board"))
				{
					responseData.board[responseData.board.length] = obj;
					type = "Board";
				}else if($(this).parent().hasClass("topic"))
				{
					responseData.topic[responseData.topic.length] = obj;
					type = "Topic";
				}else if($(this).parent().hasClass("question"))
				{
					responseData.question[responseData.question.length] = obj;
					type = "Question";
				}else if($(this).parent().hasClass("profile"))
				{
					responseData.profile[responseData.profile.length] = obj;
					type = "Profile";
				}
				
				if(des == "")
				{
					des = type;
				}
				
				obj = {"url": href, "title": text, "des": des, "img": img, "type": type};
				
				responseData.all[responseData.all.length] = obj;	
			}	
  		}
  	);

    handleRecommendationData(responseData);	
}


function postThisPage()
{
	addon.port.emit("post-page");
}

function hide()
{
	$("#search_suggestion").css("display", "none");
	
	var views = safari.extension.popovers;
    for (var corey = 0; corey < views.length; corey++) 
    {
    	if(views[corey].identifier == "popup")
		{
			views[corey].hide();	
		}																	
    }
    result = null;
}

function updateHeight(val)
{
	
  if(val != null && val != undefined)
	{
		addon.port.emit("size-height", val);
	}else
	{
		height =  $(".container").height();
		if(height > 180)
		{
			diff = height - 180;
		}else
		{
			diff = 0;
		}
		if($("#search_suggestion").css("display") == "block" && height < 400)
		{
			//newHeight = height + $("#search_suggestion").height() - 40 - diff;
			newHeight = height + 300 - 40 - diff; 
		}else
		{
			newHeight = 0;
		}
		
		if(height < newHeight)
		{
			height = newHeight;
		}
		
		if(height < 180)
		{
			height = 180;
		} 
		addon.port.emit("size-height", height);
	}
}

function hideNotification()
{
	$("#notifications").css('display','none');
	//$("#recommendations").slideDown("fast");
	if(recommendedLinksNumber > 0)
	{
		$("#recommendations").css("display", "block");	
	}
	updateHeight();
}

function showNotification()
{
	$("#recommendations").css('display','none');
	//$("#notifications").slideDown("fast");
	$("#notifications").css("display", "block");
	updateHeight();
}

function search()
{
	query = $("#search_input").val();
	if(query == "")
	{
		return;
	}
	
	element = $(".selected");
	if(element.length > 0)
	{
		element.click();
	}else
	{
		sendMessage({"data":"search", "query":query}, function(){});
		hide();
	}
}

function update()
{
	if(result != null)
	{
		$("#item_login").css("display", "none");
		$("#item_about").css("display", "none");
		$("#item_sign_up").css("display", "none");
		
		$("#item_notification").css("display", "block");
		$("#item_inbox").css("display", "block");
		$("#item_profile").css("display", "block");
		
		name = result.name.split(" ")[0];
		$("#item_profile a").html(name);
		
		notification = parseInt(result.notifs.unseen_aggregated_count);
		inbox = parseInt(result.inbox.unread_count);
				
		if(inbox > 0)
		{
			$("#item_inbox_count").css("display", "block");
			$("#item_inbox_count").text(inbox);
		}else
		{
			$("#item_inbox_count").css("display", "none");	
		}
		
		if(notification > 0)
		{
			$("#item_notification_count").css("display", "block");
			$("#item_notification_count").text(notification);
			showNotifications();
			
		}else
		{
			$("#item_notification_count").css("display", "none");
			$("#notifications").css("display", "none");
		}
		
	}else
	{
		$("#item_login").css("display", "block");
		$("#item_about").css("display", "block");
		$("#item_sign_up").css("display", "block");
		
		$("#item_notification").css("display", "none");
		$("#item_inbox").css("display", "none");
		$("#item_profile").css("display", "none");
		
		$("#item_profile a").html();
		
		$("#item_notification_count").css("display", "none");
		$("#item_inbox_count").css("display", "none");	
	}
}

function showNotifications()
{
	var html = "";
	var count = 0;
	for (i = 0; i < result.notifs.unseen.length; i++)
	{
		html += "<div class='separator'>&nbsp;</div>";	
		html += "<div>"+result.notifs.unseen[i]+"</div>";
		html += "<div class='separator'>&nbsp;</div>";
		html += "<div class='separator'>&nbsp;</div>";
		html += "<div class='separator' style='border-top:1px solid #C7C7C7;'>&nbsp;</div>";
		count++;
	}	
	
	if (count > 0)
	{
		$("#notification_content").html(html);
		$("#notification_content a").each(
			function()
			{
				if($(this).attr("href") == "#") //this element for action button. we dont need it in extension
				{
					$(this).remove();
				}else
				{
					$(this).click(function(){openFullLink($(this).attr("data-url"))});	
					$(this).attr("data-url", $(this).attr("href"));
					$(this).attr("href", "#");
				}
			}
		);
	}else
	{
		html = "<div>There aren't any notifications at this moment.</div>";
		$("#notification_content").html(html);	
	}
}

function showProfile()
{
	if(result != null)
	{
		openFullLink(result.link);
	}
}


function handleRecommendationData(response)
{
	count = 0;
	html = "";
		
	for (i = 0; i < response.all.length; i++)
	{
		if(response.all[i].title != "")
		{
			url = "http://www.quora.com"+response.all[i].url;
		
			html += "<div class='separator'>&nbsp;</div>";	
			//html += "<div style='font-size:11px;'>"+response.all[i].des+"</div>";
			html += "<div class='separator'>&nbsp;</div>";
			html += "<div>"+response.all[i].des+": <a href='#' onclick='openLink(&quot;"+response.all[i].url+"&quot;)'>"+response.all[i].title+"</a></div>";		
			html += "<div class='separator'>&nbsp;</div>";
			
			count++;	
		}			
	}

	if(count > 0)
	{
		recommendedLinksNumber = count;
		$("#recommendation_content").html(html);
		//$("#recommendations").slideDown("fast");
		$("#recommendations").css("display", "block");	
	}	
	
	updateHeight();
}
function showRecommendationLink()
{
	addon.port.emit("recommedation");
	//safari.extension.globalPage.contentWindow.pop_recommendation(handleRecommendationData);
}

function onLoad()
{
	$("#recommendations").css("display", "none");
	$("#settings").css("display", "none");
	$("#notifications").css("display", "none");
	
	
	update();
	showRecommendationLink();
	
	if(settings.setting1)
	{
		$("#settings1").attr("checked", "checked");
	}else
	{
		$("#settings1").removeAttr("checked");
	}
	
	if(settings.setting2)
	{
		$("#settings2").attr("checked", "checked");
	}else
	{
		$("#settings2").removeAttr("checked");
	}
	
	$("#block_url").val(settings.block_url);
	
	$("#update_status").css("display", "none");
	
	updateHeight(180);
	
	
}

function handleArrows(code)
{
	var done = false;
	$(".suggestion_item").each(
		function()
		{
			if($(this).hasClass("selected") && !done)
			{
				if(code == 38)
				{
					next = $(this).prev();
				}else if(code == 40)
				{
					next = $(this).next();	
				}
				
				if(next.hasClass("suggestion_item"))
				{
					$(this).removeClass("selected");
					next.addClass("selected");
					item = document.getElementById(next.attr("id"));
					item.scrollIntoView(false);
				}
				
				done = true;
			}
		}
	);
}

var searchTimer = null;
var searchValue = "null";

function focusSearch()
{
	$('#search_suggestion').slideDown("fast",  updateHeight);
	searchTimer = setInterval("fetchSearchSuggesion();", 300)
}

function blurSearch()
{
	hideSuggestion();
	if(searchTimer != null)
	{
		clearInterval(searchTimer);	
		searchTimer = null;
	}
}

function fetchSearchSuggesion()
{
	
	query = $("#search_input").val().trim();
	
	if(query == searchValue)
	{
		return;
	}
	
	if(query == "")
	{
		searchValue = query;
		html = {"html":""};
		showSearchSuggestion(html);
		return;
	}
	
	searchValue = query;
	 
	d = new Date();
	
	time = d.getTime();
	
	data = new Object();
	
	data.query = query;
	data.time = time;
	
	//showSearchSuggestion(data, time, query);	
	
	
	addon.port.emit("search", data);
	
}

var lastUpdateTime = 0;

function showSearchSuggestion(data, time, query)
{
	if(time != null && time != undefined)
	{
		if(lastUpdateTime >= time)
		{
			return;
		}
	}else
	{
		d = new Date();
		time = d.getTime();
	}
	
	lastUpdateTime = time;
	
	
	$("#search_suggestion_original").html(data.html);
	
	$("#search_suggestion").html("");
	//link = array();
	count = 0;
	$("#search_suggestion_original a").each(
		function()
		{
			
			url = $(this).attr("href");
			text = $(this).find('.text');
			if(url != "#" && text.text() != "")
			{
				text = $(this).find('.text');
				des = $(this).find('.desc');
				img = $(this).find('img');
				if(count == 0)
				{
					div = "<div id='item_"+count+"' onclick='openLink(&quot;"+url+"&quot;)' class='suggestion_item selected'>";	
				}else
				{
					div = "<div id='item_"+count+"' onclick='openLink(&quot;"+url+"&quot;)' class='suggestion_item'>";
				}
				
				if(img.attr("src") != null)
				{
					div += "<div style='float:right;'><img src='"+img.attr("src")+"'/></div>"
				}
				div += "<div class='title'>"+text.html()+"</div>";
				div += "<div class='des'>"+des.text()+"</div>";
				div += "</div>";
				$("#search_suggestion").append(div);
				count++;
			}
		}
	);
	if(count == 0)
	{
		div = "<div class='note'>Find Questions, Boards, Topics and People</div>"
		$("#search_suggestion").append(div);
	}else
	{	
		if(query != null && query != undefined)
		{
			url = "/search?q="+query;
			div = "<div id='item_-1' onclick='openLink(&quot;"+url+"&quot;)' class='suggestion_item'>";
			div += "<div class='title'>Search: "+query+" on Quora</div>";
			div += "<div class='des'></div>";
			div += "</div>";
			$("#search_suggestion").append(div);
		}
	}
	
	$(".suggestion_item").each(
		function()
		{
			$(this).mouseover(
				function()
				{
					$(".selected").removeClass("selected");
					$(this).addClass("selected");
				}
			);
		}
	);
	updateHeight();
}

function hideSuggestion()
{
	$("#search_suggestion").slideUp("fast", updateHeight);
}


function onKeydown(e)
{
	if (!e) var e = window.event;
	if (e.keyCode) code = e.keyCode;
	else if (e.which) code = e.which;
	
	if(code == 38 || code == 40  || code == 37 || code == 39)
	{
		if(code == 38 || code == 40)
		{
			handleArrows(code);
			e.preventDefault();
			return true;
		}
	}
	return true;
}

function showSettings()
{
	$("#settings").css("display", "block");	
	updateHeight();
}

function hideSettings()
{
	$("#settings").css("display", "none");
	updateHeight();
}

function changeSettings()
{
	blockUrls = $("#block_url").val().trim();
	
	if($("#settings1").attr('checked') == "checked")
	{
		setting1 = true;
	}else
	{
		setting1 = false;
	}
	
	if($("#settings2").attr('checked') == "checked")
	{
		setting2 = true;
	}else
	{
		setting2 = false;
	}
	
	settings = {"setting1" : setting1, "setting2": setting2, "block_url" : blockUrls};
	
	addon.port.emit("settings-save", settings);	
	
	$("#update_status").fadeIn().delay(3000).fadeOut();
}
