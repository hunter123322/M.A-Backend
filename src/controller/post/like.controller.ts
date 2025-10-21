import { Request, Response } from "express";
import type { JWTPayload } from "../../types/jtw.payload.type";
import { LikeData } from "../../types/post/like.type";
import { Like } from "../../service/post/like.service";

type AuthRequest<T = any> = Request<unknown, unknown, T> & {
    user?: JWTPayload;
};

export class LikeController {
    static async like(req: AuthRequest<LikeData>, res: Response) {
        try {
            console.log("hasbeencalledlike");

            const user_id = req.user?.user_id;
            const likeData: LikeData = req.body;
            if (!user_id) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
            if (!likeData) {
                res.status(400).json({ message: "Invalid post data" });
                return;
            }
            const author = req.user?.author
            await Like.like(likeData, author);

            res.status(201);
        } catch (error: any) {
            if (error) console.log(error.message);
            res.status(500).json({ message: "Failed to Like" });
        }
    }
    static async unlike(req: AuthRequest, res: Response) {
        try {
            const user_id = req.user?.user_id;
            const likeData: LikeData = req.body;
            if (!user_id) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
            if (!likeData) {
                res.status(400).json({ message: "Invalid post data" });
                return;
            }

            await Like.unlike(likeData);

            res.status(201);
        } catch (error: any) {
            if (error) console.log(error.message);
            res.status(500).json({ message: "Failed to unlike" });
        }
    }
}