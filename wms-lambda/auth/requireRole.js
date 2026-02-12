const { getUserContext } = require("./getUserContext");

function requireRole(event, allowedRoles) {
    const user = getUserContext(event);

    const ok = user.roles.some(r => allowedRoles.includes(r));
    if (!ok) {
        throw { statusCode: 403, message: "Forbidden" };
    }

    return user;
}

module.exports = { requireRole };