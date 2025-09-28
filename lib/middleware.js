import { authHelpers } from './auth';

export function withAuth(handler, requiredRole = null) {
    return async (req, res) => {
        try {
            const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const decoded = authHelpers.verifyToken(token);
            if (!decoded) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Get fresh user data
            const user = await authHelpers.getUserById(decoded.id);
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            // Check role if required
            if (requiredRole && user.role !== requiredRole) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            // Add user to request
            req.user = user;
            return handler(req, res);
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(500).json({ error: 'Authentication error' });
        }
    };
}