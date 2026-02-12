
function getUserContext(event) {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      throw { statusCode: 401, message: "Unauthorized" };
    }
  
    const groupsRaw = claims["cognito:groups"];
    const groups = Array.isArray(groupsRaw)
      ? groupsRawtypes
      : groupsRaw
      ? [groupsRaw]
      : [];
  
    return {
      sub: claims.sub,
      email: claims.email,
      roles: groups
    };
}

module.exports = {
    getUserContext,
}