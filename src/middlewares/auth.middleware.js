
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asynchHandler";
import jwt from "jsonwebtoken"
const decodeJwt =asyncHandler(async(req,_,next)=>{
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
    if(!accessToken){
        throw new ApiError(400,"unauthorized header")

    }
    const decoded = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
    const user = User.findById(decoded?._id).select("-password -refreshToken")
    if(!user){
        throw new ApiError(400,"invalid access token")
    }
    req.user = user
    next()

})
export {decodeJwt}