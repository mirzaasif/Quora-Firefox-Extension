var pageTitle = null;
var urlBlock = false;
var boardRecommendation = new Array();
var count = 0;
var settings = 0;
var urlBlock = true;

function onLoad()
{	
	self.port.on("load", function(data)
		{
			
			if(window.location != window.parent.location)
			{
				return; 
			}
			
			$(document).ready(function() {
				
				$('head').append('<link rel="stylesheet" href="'+data.file+'" type="text/css" />');
			
				//$("body").append("<div class='charm_quora' id='charm_quora'><div class='title'>Recommended Boards on Quora</div><div id='result' class='result'></div><div style='text-align:center; padding-bottom:4px;'><img src='"+closeIcon+"' width='16' title='Hide' style='cursor:pointer;' id='charm_hide'/>&nbsp;&nbsp;<img src='"+blockIcon+"' width='16' title='Never show recommendations on this site.' style='cursor:pointer;' id='charm_block'/></div><div style='text-align:center; color:#666; font-size:10px; clear:both;'>Charm for Quora</div></div>");
				//$("body").append("<div class='charm_quora' id='charm_quora'><div class='charm_quora_title'>Recommended Boards on Quora</div><div id='charm_result' class='charm_result'></div><div style='text-align:center; padding-bottom:4px;'><label id='charm_post' class='charm_quora_link' style=' cursor:pointer;' title='Post this page to a board on Quora'>Post</label><span style='color:#CCC;'> • </span><label id='charm_hide' class='charm_quora_link_alt' style=' cursor:pointer;' title='Hide this recommendation'>Hide</label></div><div style='text-align:center; padding-bottom:4px; cursor:pointer; display:block;' class='charm_quora_link_alt' id='charm_block' title='Add the domain for this page into the recommendation block list'>Block for this site</div><div style='text-align:center; color:#666; font-size:10px; clear:both;'>Charm for Quora</div></div>");
				$("body").append("<div class='charm_quora' id='charm_quora'><div class='charm_quora_title'>Recommended Boards on Quora</div><div id='charm_result' class='charm_result'></div><div style='text-align:center; padding-bottom:4px;'><label id='charm_post' class='charm_quora_link' style='cursor:pointer; float:none;' title='Post this page to a board on Quora'>Post</label><span style='color:#CCC;'> • </span><label id='charm_hide' class='charm_quora_link_alt' style='cursor:pointer; float:none;' title='Hide this recommendation'>Hide</label></div><div style='text-align:center; padding-bottom:4px; cursor:pointer; display:block;' class='charm_quora_link_alt' id='charm_block' title='Add the domain for this page into the recommendation block list'>Block for this site</div><div style='text-align:center; color:#666; font-size:10px; clear:both;'>Charm for Quora</div></div>");
				$("body").append("<div class='charm_hidden_result' id='charm_hidden_result'></div>");
				
				left = (parseInt($(window).width())-150);
				$("#charm_quora").css("left", left);
				$("#charm_block").click(blockSite);
				$("#charm_hide").click(hide);
				$("#charm_post").click(postQuora);
				
				try
				{
					pageTitle = $("meta[property=og\\:title]").attr("content");	
					
				}catch(e)
				{
					pageTitle = $(this).attr('title');
				}finally
				{	
					if(pageTitle == null || pageTitle == undefined)
					{
						pageTitle = $(this).attr('title');
					}
				}
				
				settings = data.settings;

				urlBlock = isURLBlocked(settings);
				
				if(!urlBlock)
				{
					if(settings.setting1)
					{
						self.port.emit("recommendation", pageTitle);
						getBoardRecommendationAdvaced(pageTitle);
					}
				}
			}); // Jquery ready
			self.port.on("recommendation-success", function(data)
			{
				recommendationResult(data);	
			});
			
			self.port.on("get-title", function()
			{
				if(!urlBlock)
				{
					self.port.emit("get-title-success", pageTitle);	
				}
			});
	}); // self port on load
	
}

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
    handleBoardRecommendationResponse(responseData);	
}

function handleBoardRecommendationResponse(response)
{
	documentUrl = document.location;
	
	for (var i = 0; i < response.board.length; i++)
	{
		var key = response.board[i].url;
		if(boardRecommendation[key] == null || boardRecommendation[key] == undefined)
		{
			boardRecommendation[key] = key;
			var url = "http://www.quora.com"+response.board[i].url;
			var name = response.board[i].title;
		
			if(url.toString().toLowerCase() != documentUrl.toString().toLowerCase())
			{
				div = "<a class='charm_result_item' href='"+url+"' target='_blank' title='Open "+name+" in a separate tab'><div class='charm_result_item' id='result_item_"+count+"' data-name='"+name+"'>"+name+"</div></a>";
				//div = "<div class='result_item' id='result_item_"+count+"' data-name='"+name+"'>"+name+"</div>";
				$(".charm_quora #charm_result").append(div);
				//$("#result_item_"+count).click(function(event){postQuora(event);});
				count++;	
			}		
		}
	}
	
	if(count > 0 && $(".charm_quora").css("display") == "none")
	{
		$(".charm_quora").css("display", "block");
	}
}
/*
function postQuora(event)
{
	name = $(event.currentTarget).attr("data-name");
	sendMessage({"data":"post", "name": name}, function(){});	
}
*/
function postQuora()
{
	self.port.emit("post-page");	
}

function getBoardRecommendationAdvaced(title)
{
	var words = title.match(/\b[\w]+\b/g);
	
	for (var i = 0; i < words.length; i++)
	{
		var word = words[i].trim();
		if(!isStopWord(word))
		{
			self.port.emit("recommendation",  word.toString());
		}
	}
}

onLoad();
/*
chrome.extension.onRequest.addListener(function(request, sender, sendResponse)
	{
		if(request.request == "title")
		{
			if(!urlBlock && pageTitle != null)
			{
				response = {"response":pageTitle};
				sendResponse(response);	
			}else
			{
				response = {"response":""};
				sendResponse(response);	
			}
		}else if(request.request == "post")
		{
			$(document).ready(function() 
				{
					name = request.name;
					$(".question_box").focus().val(name).keyup();
				}
			);
		}
	}
);
*/

function blockSite()
{
	domain = location.hostname;
	self.port.emit("block-domain", domain);
	
	$(".charm_quora #charm_result").append(domain+" has been blocked. You can undo this action from settings.");
	setTimeout(function()
	{
		hide();	
	}, 5000);
}

function hide()
{
	$("#charm_quora").fadeOut();
}

function isURLBlocked(settings)
{
	url = location.host;
	if(location.protocol == "https:" && settings.setting2 == true)
	{
		return true;
	}
	
	domain = location.hostname;
	
	domain = domain.replace(/www./i, "");
	
	domain2 = "\\*."+domain;
	
	split = domain.split(".");
	
	domain3 = domain.replace(split[0], "\\*");
	
	blockUrls = settings.block_url.replace(/www./i, "");
	blockUrls = blockUrls.replace(/http:/gi, "");
	blockUrls = blockUrls.replace(/https:/gi, "");
	blockUrls = blockUrls.replace(/\//g, "");
	
	
	//domain = domain.replace(/\./g, "\\.");
	domain2 = domain2.replace(/\./g, "\\.");
	domain3 = domain3.replace(/\./g, "\\.");
	
	
	try
	{
		var regex1 = new RegExp("^"+domain+"$","im");
		var regex2 = new RegExp("^"+domain2+"$","im");
		var regex3 = new RegExp("^"+domain3+"$","im");
		
		
		if((blockUrls.match(regex1) != null) || (blockUrls.match(regex2) != null) || (blockUrls.match(regex3) != null))
		{
			return true;
		}
	
		return false;
	}catch(e)
	{
		return true;
	}
}

