
import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { loginUser } from "../controllers/user.controller.js";
import { logoutUser } from "../controllers/user.controller.js";
import {jwtVerify} from "../middlewares/auth.middleware.js";

const router = Router();

// before any router 
// register se pahle middleware likh do
// now you are able to send the files(data) using postman

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser);

// secure with middleware
// first (middleware) + second(coutorller)
router.route("/logout").post(jwtVerify,  logoutUser);

export default router;