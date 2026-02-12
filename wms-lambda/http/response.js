function json(statusCode, body, extraHeaders = {}) {
    return {
        statusCode,
        headers: {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "https://d2ma7m4rhtxjvb.cloudfront.net",
            "Access-Control-Allow-Headers": "Authorization,Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            ...extraHeaders,
        },
        body: JSON.stringify(body),
    };
}

module.exports = { json }