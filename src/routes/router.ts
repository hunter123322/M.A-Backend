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
import { UserController } from "../controller/user.controller.js";
import { Search } from "../controller/user/search.user.controller.js";

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
router.get("/posts/timestamp", authenticateToken, PostController.getByTimestamp);
router.post("/post/create", authenticateToken, PostController.create)
router.post("/post/share", authenticateToken, PostController.share)
router.put("/post/update", authenticateToken, PostController.update)
router.delete("/post/delete", authenticateToken, PostController.delete)

router.get("/post/comment/get", authenticateToken, CommentController.get)
router.get("/post/comment/getMore", authenticateToken, CommentController.loadMoreComment)
router.post("/post/comment/create", authenticateToken, CommentController.create)
router.delete("/post/comment/delete", authenticateToken, CommentController.delete)

router.post("/post/like", authenticateToken, LikeController.like)
router.post("/post/unlike", authenticateToken, LikeController.unlike)

router.get("/notification/init", authenticateToken, NotificationController.init)
router.post("/notification/read/one", authenticateToken, NotificationController.read)
router.post("/notification/read/all", authenticateToken, NotificationController.markAllAsRead)

router.get("/search/user", authenticateToken, Search.user)




router.get("/", (req, res) => {
    // Check if a session exists
    if (req.session) {
        res.send(`You have visited this page ${req.session} times.`);
    } else {
        res.send('Welcome, please refresh the page!');
    }
    console.log(req.session, req.sessionID);           // print all headers
})

export default router;
