'use strict';

const ignoredConversations = document.querySelector('#ignored-conversations');
const ignoredUsers = document.querySelector('#ignored-users');
const onlyImportant = document.querySelector('#important-only');
document.querySelector('#save').onclick = () => {
    const data = {
        ignoredConversations: ignoredConversations.value.split('\n'),
        ignoredUsers: ignoredUsers.value.split('\n'),
        onlyImportant: onlyImportant.checked,
    };

    browser.storage.local.set(data);
};

browser.storage.local.get().then((data) => {
    ignoredConversations.value = data.ignoredConversations.join('\n');
    ignoredUsers.value = data.ignoredUsers.join('\n');
    onlyImportant.checked = data.onlyImportant;
});
