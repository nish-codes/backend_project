import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const getRefreshAndRefreshToken = async(id)=>{
    try {
        const user =await User.findById(id)
        const accessToken = user.getAccessToken()
        const refreshToken = user.getRefreshToken()
        user.refreshToken = refreshToken
        user.save({
            validateBeforeSave : false
        }) 
        return {refreshToken,accessToken}
    } catch (error) {
        throw new ApiError(400,"something went wrong while generating access and refresh token")
    }

}
const registerUser = asyncHandler(async (req,res)=>{
    const {fullName,userName,avatar,coverImage,email,password} = req.body
    if([fullName,userName,avatar,coverImage,email,password].some((value)=>
        value?.trim() === ""
    )){
        throw new ApiError(400,"All field are required")
    }

    const existing =await User.findOne({
        $or : [{email},{userName}]
    })
    if(existing){
        throw new ApiError(400,"Already existing user")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverLocalpath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverLocalpath = req.files.coverImage[0].path
    }
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar image is required")
    }
   const avatarLink = await uploadOnCloudinary(avatarLocalPath)
   const coverLink = await uploadOnCloudinary(coverLocalpath)

   if(!avatarLink){
    throw new ApiError(400,"Avatar image is required")
   }

   const user =await User.create({
    fullName,
    email,
    password,
    avatar : avatarLink?.url,
    coverImage : coverLink?.url,
    userName : userName.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select("-password -refreshToken")
   
   res.status(200).json(
     new ApiResponse(200,createdUser,"success")
   )

})

const loginUser = asyncHandler(async(req,res)=>{
    const {userName,email,password} = req.body
    if(!userName || !email){
        throw new ApiError(400,"username or email is required")
    }
    const existingUser = await User.findOne({
        $or : [{userName},{email}]
    })
    if(!existingUser){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordvalid = await existingUser.isPasswordCorrect()
    if(!isPasswordvalid){
        throw new ApiError(400,"Wrong password")
    }

    const {accessToken,refreshToken} = await getRefreshAndRefreshToken(user._id)

    const loggedinUser = await User.findById(user._id).select("-password -refreshToken")

    const option = {
        httpOnly : true,
        secure : true
    }

    res.status(200).cookie("accessToken",accessToken,option).cookie("refreshToken",refreshToken,option).json(new ApiResponse(200,{
        loggedinUser,accessToken,refreshToken
    }))

})

const logOutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndDelete(req.user._id,{
        $set : {refreshToken : undefined}
    },{
        new : true
    })

    const options = {
        httpOnly : true,
        secure : true
    }
    res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,"User logged out"))
})

export {registerUser,loginUser,logOutUser}