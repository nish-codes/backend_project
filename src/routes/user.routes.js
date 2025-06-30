import { Router } from "express";
import { loginUser, logOutUser, registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { decodeJwt } from "../middlewares/auth.middleware.js";

const route = Router()
route.route('/register').post(
    upload.fields([{
        name : "avatar",
        maxCount :1
    },
{
    name : "coverImage",
    maxCount :1   
}])
    ,registerUser)
route.route('/login').post(loginUser)
route.route('/logout').post(decodeJwt,logOutUser)
export default route