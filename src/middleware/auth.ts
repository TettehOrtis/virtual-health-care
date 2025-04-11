import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

// Ensure JWT_SECRET is set in the environment
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
    throw new Error("JWT_SECRET is not set in the environment. Please configure it.");
}

// Define the structure of the decoded token
interface DecodedToken {
    userId: string;
    role: string;
    exp: number; // Add expiration time
}

// Middleware for protecting API routes with role-based access
export const authenticate =
    (requiredRole: string | string[]): ((handler: any) => (req: NextApiRequest, res: NextApiResponse) => Promise<void>) =>
        (handler) =>
            async (req, res) => {
                const authHeader = req.headers.authorization;

                // Check if the Authorization header is present and valid
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return res.status(401).json({ message: "Unauthorized: No token provided" });
                }

                const token = authHeader.split(" ")[1];

                try {
                    // Verify the token
                    const decoded = jwt.verify(token, SECRET_KEY) as DecodedToken;

                    // Check if the token has expired
                    if (decoded.exp < Date.now() / 1000) {
                        return res.status(401).json({ message: "Unauthorized: Token expired" });
                    }

                    // Check if the user has the required role(s)
                    if (Array.isArray(requiredRole)) {
                        if (!requiredRole.includes(decoded.role)) {
                            return res.status(403).json({ message: "Forbidden: Access denied" });
                        }
                    } else if (decoded.role !== requiredRole) {
                        return res.status(403).json({ message: "Forbidden: Access denied" });
                    }

                    // Attach user data to the request object
                    (req as any).user = decoded;

                    // Call the next handler
                    return handler(req, res);
                } catch (error) {
                    console.error("Token verification failed:", error);

                    // Handle specific JWT errors
                    if (error instanceof jwt.JsonWebTokenError) {
                        return res.status(401).json({ message: "Unauthorized: Invalid token" });
                    }

                    // Handle other errors
                    return res.status(500).json({ message: "Internal Server Error" });
                }
            };

// Function to verify token manually
export const verifyToken = (req: NextApiRequest): DecodedToken => {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header is present and valid
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("No token provided");
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verify the token
        const decoded = jwt.verify(token, SECRET_KEY) as DecodedToken;

        // Check if the token has expired
        if (decoded.exp < Date.now() / 1000) {
            throw new Error("Token expired");
        }

        return decoded;
    } catch (error) {
        throw new Error("Invalid token");
    }
};