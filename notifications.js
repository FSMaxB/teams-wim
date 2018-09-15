'use strict';

let settings = {
	ignoredConversations: [],
	ignoredUsers: [],
	onlyImportant: false,
};

browser.storage.local.get().then(loadedSettings => {
	settings = loadedSettings;
});

browser.storage.onChanged.addListener((changes, areaName) => {
	if (areaName === 'local') {
		for (const key in changes) {
			settings[key] = changes[key].newValue;
		}
	}
});

class EventMessage {
	constructor(eventMessage) {
		this.id = eventMessage.id;
		this.type = eventMessage.resourceType;
		this.resource = eventMessage.resource;
	}
}

class NewMessage {
	constructor(resource) {
		this.threadtype = resource.threadtype;
		this.type = resource.type;
		this.messagetype = resource.messagetype;
		this.contentType = resource.contenttype;
		this.sender = resource.imdisplayname;
		this.content = resource.content;
		this.sendTime = resource.composetime;
		this.receiveTime = resource.originalarrivaltime;
		this.properties = resource.properties;
		this.conversationLink = resource.conversationLink;
	}

	get conversation() {
		const conversationIdRegex = /conversations\/([0-9a-z:\-_]*)@/;
		const conversationIdMatch = this.conversationLink.match(conversationIdRegex);
		if (Array.isArray(conversationIdMatch) && (conversationIdMatch.length === 2)) {
			return conversationIdMatch[1];
		}

		return null;
	}

	get plainContent() {
		return this.content.replace(/<[^>]*>/g, '');
	}

	get isImportant() {
		if (this.properties === undefined) {
			return false;
		}

		return this.properties.importance === 'high';
	}

	get isTeamMessage() {
		return this.threadtype === 'space';
	}

	get isChatMessage() {
		return this.threadtype === 'chat';
	}
}

function receive(json) {
	if (json.eventMessages !== undefined) {
		const eventMessages = json.eventMessages;
		eventMessages
			.map(json => new EventMessage(json))
			.forEach(eventMessage => {
				if (eventMessage.type === 'NewMessage') {
					const newMessage = new NewMessage(eventMessage.resource);
					if ((newMessage.type === 'Message') && (newMessage.messagetype.includes('Text'))) {
						let title = 'New ';
						if (newMessage.isImportant) {
							title += 'IMPORTANT ';
						}
						if (newMessage.isTeamMessage) {
							title += 'team ';
						} else if (newMessage.isChatMessage) {
							title += 'chat ';
						}
						title += `message from ${newMessage.sender}`;

						browser.notifications.create({
							type: 'basic',
							'title': title,
							'message': newMessage.plainContent,
						});
					}
				}
			});
	}
}

function listener(details) {
	const url = details.url;
	if (!url.includes('poll')) {
		return;
	}
	let filter = browser.webRequest.filterResponseData(details.requestId);
	let decoder = new TextDecoder('utf-8');

	let json = '';

	filter.ondata = event => {
		json += decoder.decode(event.data, {stream: true});
		filter.write(event.data);
	};

	filter.onerror = function () {
		filter.disconnect();
	};

	filter.onstop = function () {
		filter.disconnect();
		receive(JSON.parse(json));
	};
}

browser.webRequest.onBeforeRequest.addListener(
	listener,
	{urls: ['https://*.teams.microsoft.com/*'], types: ['xmlhttprequest']},
	['blocking']
);
