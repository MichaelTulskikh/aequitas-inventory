function parseJsonBody(event) {
    if (!event.body) return {};
    try {
        return JSON.parse(event.body);
    } catch {
        throw { statusCode: 400, message: "Invalid JSON body" };
    }
}

function getQueryParam(event, key) {
    return (event.queryStringParameters && event.queryStringParameters[key]) || "";
}

function getPathParam(path, indexFromEnd = 1) {
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - indexFromEnd];
}

module.exports = { parseJsonBody, getQueryParam, getPathParam };