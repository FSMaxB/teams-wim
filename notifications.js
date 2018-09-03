function listener(details) {
	const url = details.url;
	console.log("URL", url);
	if (!url.includes('poll')) {
		return
	}
	console.log("ID:", details.requestId);
	let filter = browser.webRequest.filterResponseData(details.requestId);
	let decoder = new TextDecoder("utf-8");

	let json = "";

	filter.ondata = event => {
        json += decoder.decode(event.data, {stream: true});
		filter.write(event.data);
	};

	filter.onerror = function () {
		filter.disconnect();
	};

	filter.onstop = function () {
        filter.disconnect();
		console.log(json);
        if (json.includes("NewMessage")) {
        	browser.notifications.create({
				'type': 'basic',
				//'iconUrl': ...,
				'title': 'New Message',
				'message': 'You\'ve got a new message in Microsoft Teams'
			});
		}
		//const parsed_json = JSON.parse(json);
		/*if (parsed_json.eventMessages !== undefined) {
			const messages = parsed_json.eventMessages;
			messages.forEach(message => {
				if (message.resourceType === "NewMessage") {
				    console.log("DETECTED MESSAGE");
					console.log(message.content);
				}
			});
		}*/
	};
}

browser.webRequest.onBeforeRequest.addListener(
	listener,
	{urls: ['https://*.teams.microsoft.com/*'], types: ['xmlhttprequest']},
	['blocking']
);
