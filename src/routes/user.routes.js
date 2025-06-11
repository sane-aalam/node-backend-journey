
import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

// before any router 
// register se pahle middleware likh do
// now you are able to send the files(data) using postman

router.route("/register").post(upload.fields([
    {
        name:"avater",
        maxCount:1,
    },{
        name: 'coverImage', 
        maxCount: 1
    }
]),
registerUser);

export default router;