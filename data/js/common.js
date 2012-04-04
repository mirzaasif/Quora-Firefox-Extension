function sendMessage(message, response)
{
	chrome.extension.sendRequest(message, response);
}

function updateBadgeText(text)
{
	chrome.browserAction.setBadgeText({"text": text})
}

function openLink(link)
{
	url = "http://www.quora.com" + link;
	addon.port.emit("link", url);	
}

function openFullLink(link)
{
	addon.port.emit("link", link);
}