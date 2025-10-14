import { Request, Response } from "express";
import type { JWTPayload } from "../../types/jtw.payload.type";

type AuthRequest<T = any> = Request<unknown, unknown, T> & {
  user?: JWTPayload;
};

// Simple JWT Logout (client-side token deletion)
export async function logout(req: AuthRequest, res: Response): Promise<void> {
    try {
        // ❌ REMOVE ALL SESSION CODE:
        // req.session.destroy((err) => { ... });
        // res.clearCookie('connect.sid');

        // ✅ JWT Logout Strategy:
        // With JWT, there's no server-side session to destroy
        // The client must delete the token from localStorage
        
        // Optional: Log the logout event for audit purposes
        const user_id = req.user?.user_id;
        if (user_id) {
            console.log(`User ${user_id} logged out at ${new Date().toISOString()}`);
        }

        // Instruct client to delete the token
        res.status(200).json({ 
            success: true, 
            message: 'Logged out successfully',
            action: 'delete_token' // Signal to frontend to delete token
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}