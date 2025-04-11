import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Since JWTs are stateless, logout is handled on the frontend by removing the token.
    return res.status(200).json({ message: "Logged out successfully" });
}
