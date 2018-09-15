'use strict';
function listener(details) {
	const url = details.url;
	if (!url.includes('poll')) {
		return
	}
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
		const parsed_json = JSON.parse(json);
		if (parsed_json.eventMessages !== undefined) {
			const messages = parsed_json.eventMessages;
			messages.forEach(message => {
				if (message.resourceType === 'NewMessage') {
				    const resource = message.resource;
				    const sender = resource.imdisplayname;
				    const html_content = resource.content;
				    const content = html_content.replace(/<[^>]*>/g, '');
                    browser.notifications.create({
                        'type': 'basic',
                        //'iconUrl': ...,
                        'title': 'New Message from ' + sender,
                        'message': content
                    });
				}
			});
		}
	};
}

browser.webRequest.onBeforeRequest.addListener(
	listener,
	{urls: ['https://*.teams.microsoft.com/*'], types: ['xmlhttprequest']},
	['blocking']
);
