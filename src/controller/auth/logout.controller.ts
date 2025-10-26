import { Request, Response } from "express";
import type { JWTPayload } from "../../types/jtw.payload.type";

type AuthRequest<T = any> = Request<unknown, unknown, T> & {
  user?: JWTPayload;
};

// Simple JWT Logout (client-side token deletion)
export async function logout(req: AuthRequest, res: Response): Promise<void> {
    try {

        const user_id = req.user?.user_id;
        if (user_id) {
            console.log(`User ${user_id} logged out at ${new Date().toISOString()}`);
        }

        res.status(200).json({ 
            success: true, 
            message: 'Logged out successfully',
            action: 'delete_token'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}