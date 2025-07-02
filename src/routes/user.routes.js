import { Router } from "express";
import { changePassword, getUser, loginUser, logOutUser, refreshToken, registerUser, updateAccountDetails, updateAvatar, updateCoverImage } from "../controllers/user.controllers.js";
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
route.route('/refreshToken').post(refreshToken)
route.route('/changePassword').post(decodeJwt,changePassword)
route.route('/getUser').post(decodeJwt,getUser)
route.route('/updateAccount').post(decodeJwt,updateAccountDetails)
route.route('/updateAvatar').post(upload.single("avatar"),decodeJwt,updateAvatar)
route.route('/updateCover').post(upload.single("coverImage"),decodeJwt,updateCoverImage)
export default route