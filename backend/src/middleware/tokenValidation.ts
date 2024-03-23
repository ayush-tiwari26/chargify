import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Middleware to validate authentication token
const validateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Get the token from the Authorization header

    if (!token) {
        return res.status(401).json({ message: 'Access token not provided' });
    }

    jwt.verify(token, process.env.JWT_PRIVATE_KEY as string, (err, payload) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = (payload as any)
        next(); // Proceed to the next middleware or route handler
    });
};

export {validateToken};
