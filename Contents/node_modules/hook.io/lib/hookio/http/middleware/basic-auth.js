module.exports = function (un, pwd) {
  var username = un || "admin",
      password = pwd || "admin";

  return function (req, res, next) {
    var creds = req && req.headers && req.headers.authorization;

    if (creds) {
      creds = creds.split(' ');
      creds = Buffer(creds[1], 'base64').toString();
      creds = creds.split(':');
    }

    if (Array.isArray(creds) && creds[0] === username && creds[1] === password) {
      res.emit("next");
    } else {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="Secure Area"'
      });
      res.end();
    }
  }
}
