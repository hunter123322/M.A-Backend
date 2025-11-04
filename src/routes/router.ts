import express from "express";
import { authenticateToken } from "../middleware/authentication.js";
import { postLogin } from "../controller/auth/login.controller.js";
import { logout } from "../controller/auth/logout.controller.js";
import { postInformation } from "../controller/signup/step2/information.controller.js";
import { postLocation } from "../controller/signup/step3/location.controller.js";
import { postSignup } from "../controller/signup/step1/signup.controller.js";
import { apiAuthCheck } from "../controller/auth/api.auth.check.controller.js";
import { searchContact } from "../controller/contact/search.contact.controller.js";
import { createContact } from "../controller/contact/create.contact.controller.js";
import { initProfile } from "../controller/profile/profile.init.controller.js";
import { PostController } from "../controller/post/post.controller.js";
import { CommentController } from "../controller/post/comment.controller.js";
import { LikeController } from "../controller/post/like.controller.js";
import { NotificationController } from "../controller/notification/notification.controller.js";
import { Search } from "../controller/user/search.user.controller.js";
import { blob } from "../db/blob/blob.js";
import { s3, write } from "bun";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });


const router = express.Router();

// Login/Logout
router.post("/login", postLogin);
router.post("/logout", authenticateToken, logout);

router.post("/signup", postSignup);
router.post("/signup/information", authenticateToken, postInformation);
router.post("/signup/location", authenticateToken, postLocation);

router.get('/apiAuthCheck', authenticateToken, apiAuthCheck)
router.get("/contact/search", searchContact);
router.post("/contact/create", authenticateToken, createContact);
router.get("/user/profile/init", authenticateToken, initProfile)

router.get("/posts/:id", authenticateToken, PostController.getById);
// Unprotected routes
router.get("/post/findByUser", PostController.findByUser)
router.get("/post/timestamp", authenticateToken, PostController.getByTimestamp);
router.post("/post/create", upload.single("file"), authenticateToken, PostController.create)
router.post("/post/share", authenticateToken, PostController.share)
router.put("/post/update", authenticateToken, PostController.update)
router.delete("/post/delete", authenticateToken, PostController.delete)

router.get("/post/comment/get", authenticateToken, CommentController.get)
router.get("/post/comment/getMore", authenticateToken, CommentController.loadMoreComment)
// Unprotected routes
router.get("/post/feed/init", PostController.feedInit)
router.post("/post/comment/create", authenticateToken, CommentController.create)
router.delete("/post/comment/delete", authenticateToken, CommentController.delete)

router.post("/post/like", authenticateToken, LikeController.like)
router.post("/post/unlike", authenticateToken, LikeController.unlike)

router.get("/notification/init", authenticateToken, NotificationController.init)
router.post("/notification/read/one", authenticateToken, NotificationController.read)
router.post("/notification/read/all", authenticateToken, NotificationController.markAllAsRead)

router.get("/search/user", authenticateToken, Search.user)




router.get("/img", async (req, res) => {
    try {
        async function generateReadUrl(fileKey: string) {
            const url = blob.presign(fileKey, {
                method: "GET",
                expiresIn: 60 * 5, // valid for 5 minutes
            });
            return url;
        }

        // Example usage
        const url = await generateReadUrl("Gemini_Generated_Image_t7ov98t7ov98t7ov.png");
        console.log(url);
        res.json({ url });
    } catch (error) {
        res.status(500).send("Failed to generate url");
    }
})

router.post("/img/upload", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: "No file uploaded" });
            return
        }

        // Create a unique object key
        const fileKey = `/${Date.now()}-${file.originalname}`;

        // Convert Node Buffer to ArrayBuffer for Bun’s native S3Client
        const arrayBuffer = file.buffer.buffer.slice(
            file.buffer.byteOffset,
            file.buffer.byteOffset + file.buffer.byteLength
        );

        // Upload to MinIO
        await blob.write(fileKey, arrayBuffer, {
            type: file.mimetype,
        });

        // Generate presigned URL (temporary access)
        const presignedUrl = blob.presign(fileKey, {
            method: "GET",
            expiresIn: 60 * 60, // 1hr
        });

        res.status(201).json({
            message: "Upload successful",
            key: fileKey,
            url: presignedUrl,
        });
    } catch (error) {
        console.error("❌ Upload error:", error);
        res.status(500).json({ error: "Upload failed" });
    }
});

export default router;
