/**
 * Authentication Middleware
 * Handles user authentication for API routes
 */

const authenticateUser = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  // Mock token validation (in production, verify JWT)
  // For now, extract user info from mock token
  try {
    // Mock token format: mock-jwt-token-{timestamp}-{userId}
    const tokenParts = token.split('-');
    if (tokenParts[0] !== 'mock' || tokenParts[1] !== 'jwt' || tokenParts[2] !== 'token') {
      throw new Error('Invalid token format');
    }

    // Mock user database - in production, get from database
    const users = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        isAdmin: false
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@email.com',
        isAdmin: false
      },
      {
        id: '99',
        firstName: 'Admin',
        lastName: 'Laurent',
        email: 'admin@swan-ira.com',
        isAdmin: true
      }
    ];

    // For demo, use first user if token is valid
    const user = users[0]; // In production, find user by token
    
    if (!user) {
      throw new Error('User not found');
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      details: error.message
    });
  }
};

const authenticateAdmin = (req, res, next) => {
  // First authenticate as user
  authenticateUser(req, res, (err) => {
    if (err) return next(err);

    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    next();
  });
};

export {
  authenticateUser,
  authenticateAdmin
};
