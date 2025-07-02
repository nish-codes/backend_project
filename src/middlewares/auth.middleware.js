
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchHandler.js";
import jwt from "jsonwebtoken"
const decodeJwt =asyncHandler(async(req,_,next)=>{
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
    if(!accessToken){
        throw new ApiError(400,"unauthorized header")

    }
    const decoded = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decoded?._id).select("-password -refreshToken")
    if(!user){
        throw new ApiError(400,"invalid access token")
    }
    req.user = user
    console.log(req.user._id)
    console.log("it came here")
    next()

})
export {decodeJwt}