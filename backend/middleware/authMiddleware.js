const jwt = require('jsonwebtoken');

//! Authenticate token middleware
// req: Request object
// res: Response object
// next: Next middleware function
// Check if token is provided and valid
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      return res.status(403).json({ error: 'Token is invalid' });
    }
    req.user = decodedToken;
    next();
  });
}

module.exports = {
  authenticateToken
};
