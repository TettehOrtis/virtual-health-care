import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { PrismaClient, Role, User, Patient, Doctor } from '@prisma/client';

const prisma = new PrismaClient();

// Ensure JWT_SECRET is set in the environment
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
    throw new Error("JWT_SECRET is not set in the environment. Please configure it.");
}

// Define the structure of the decoded token
interface DecodedToken {
    sub: string; // Supabase user ID
    role: string;
    exp: number;
    supabaseId: string;  // For consistency with our database
}

// Define the structure of the user object to be attached to the request
interface AuthenticatedRequest extends NextApiRequest {
    user: {
        id: string;
        role: Role;
        supabaseId: string;
        patient: Patient | null;
        doctor: Doctor | null;
    };
}

// Define the type for the handler function
type ApiHandler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void;

// Middleware for protecting API routes with role-based access
export const authenticate = (requiredRole: string | string[]) => {
    return (handler: ApiHandler) => {
        return async (req: NextApiRequest, res: NextApiResponse) => {
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

                // Find user in our database using supabaseId
                const user = await prisma.user.findUnique({
                    where: { supabaseId: decoded.sub },
                    include: {
                        patient: true,
                        doctor: true
                    }
                });

                if (!user || !user.id || !user.supabaseId) {
                    return res.status(401).json({ message: "User not found in our database" });
                }

                // Attach user data to the request object
                (req as AuthenticatedRequest).user = {
                    id: user.id,
                    role: user.role,
                    supabaseId: user.supabaseId,
                    patient: user.patient || null,
                    doctor: user.doctor || null
                };

                // Call the handler with the authenticated request
                return handler(req as AuthenticatedRequest, res);
            } catch (error) {
                console.error("Token verification failed:", error);

                // Handle specific JWT errors
                if (error instanceof jwt.JsonWebTokenError) {
                    return res.status(401).json({ message: "Unauthorized: Invalid token" });
                }

                if (error instanceof Error) {
                    return res.status(500).json({ message: error.message });
                }

                // Handle other errors
                return res.status(500).json({ message: "Internal Server Error" });
            }
        };
    };
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
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Invalid token");
    }
};