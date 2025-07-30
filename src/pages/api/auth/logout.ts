import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        // Since JWTs are stateless, logout is primarily handled on the frontend
        // But we can add server-side cleanup here if needed in the future
        // For example, invalidating refresh tokens, logging logout events, etc.

        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
