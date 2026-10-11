function getVideoMessage(id, title, url, publishedAt){
    return  `
@all ou @todos
testando:
id: ${id}
title: ${title}
url: ${url}
publishedAt: ${publishedAt}
    `;
}

module.exports = { getVideoMessage }