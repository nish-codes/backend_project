import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
const getRefreshAndAccessToken = async(id)=>{
    try {
        const user =await User.findById(id)
        if(!user){
            throw new ApiError(400,"user is not created")
        }
       
        const accessToken = user.getAccessToken()
        
        const refreshToken =  user.getRefreshToken()
        
        user.refreshToken = refreshToken
      await user.save({
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

const loginUser = asyncHandler(async (req,res)=>{
    const {userName,email,password} = req.body
    if(!userName && !email){
        throw new ApiError(400,"username or email is required")
    }
    const existingUser = await User.findOne({
        $or : [{userName},{email}]
    })
    if(!existingUser){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordvalid = await existingUser.isPasswordCorrect(password)
    if(!isPasswordvalid){
        throw new ApiError(400,"Wrong password")
    }

    const {accessToken,refreshToken} = await getRefreshAndAccessToken(existingUser._id)

    const loggedinUser = await User.findById(existingUser._id).select("-password -refreshToken")

    const option = {
        httpOnly : true,
        secure : true
    }

    res.status(200).cookie("accessToken",accessToken,option).cookie("refreshToken",refreshToken,option).json(new ApiResponse(200,{
        loggedinUser,accessToken,refreshToken
    }))

})

const logOutUser = asyncHandler(async(req,res)=>{
    const user = await User.findByIdAndUpdate(req.user._id,{
        $set : {refreshToken : "undefined"}
    },{
        new : true
    })
   if(!user){
    throw new ApiError(400,"user was not even created in log out")
   }
    const options = {
        httpOnly : true,
        secure : true
    }
    res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,"User logged out"))
})
const refreshToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken
   try {
     const decoded = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET )
    const user = await User.findById(decoded._id)
    if(!user){
     throw new ApiError(401,"Wrong refresh token")
    }
    if(incomingRefreshToken !== user.refreshToken){
     throw new ApiError(401,"Refresh token is expired or used")
    }
 
    const options = {
     httpOnly : true,
     secure : true
    }
    const {accessToken,refreshToken} = await getRefreshAndAccessToken(decoded._id)
    res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
     new ApiResponse(200,{
         refreshToken,accessToken
     },"refreshed succesfully")
    )
   } catch (error) {
    throw new ApiError(400,"something is wrong in refresht token")
   }
})
const changePassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword,confPassword} = req.body
    console.log(req.user._id)
    const user = await User.findById(req.user?._id)
    
    if(!user){
        throw new ApiError(400,"user was not generated")
    }
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
    if(confPassword !==newPassword){
        throw new ApiError(400,"confirm password and new password is not same ")
    }
    if(!isPasswordCorrect){
        throw new ApiError(400,"wrong password")
    }
    user.password = newPassword
    user.save({validateBeforeSave : false})
    res.status(200).json(new ApiResponse(200,{},"password updated successfully"))
    })

const getUser = asyncHandler(async(req,res)=>{
   
    res.status(200).json(new ApiResponse(200,req.user))
})
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body
    if(!fullName || !email){
        throw new ApiError(400,"both name and email is required")
    }
   const user = await User.findByIdAndUpdate(req.user?._id,{
        $set : {
            email,
            fullName
        }
    },{
        new:true
    }).select("-password -refreshToken")

    res.status(200).json(new ApiResponse(200,user,"user information updated"))
})

const updateAvatar = asyncHandler(async(req,res)=>{
   const avatarPath = req.file?.path
   if(!avatarPath){
    throw new ApiError(400,"the avatar path is not generated")
   }
   const avatar = await uploadOnCloudinary(avatarPath)

   if(!avatar.url){
    throw new ApiError(400,"something went wrong while generating avatar url")
   }
   const user = await User.findByIdAndUpdate(req.user?.id,
    {
        $set : {
            avatar : avatar.url
        }
    },{
        new:true
    }
   ).select("-password -refreshToken")
   if(!user){
    throw new ApiError(400,"something went wrong while getting user")
   }
   res.status(200).json(new ApiResponse(200,user,"avatar image uploaded successfully"))
})
const updateCoverImage = asyncHandler(async(req,res)=>{
   const coverImagePath = req.file?.path
   if(!coverImagePath){
    throw new ApiError(400,"the cover image path is not generated")
   }
   const coverImage = await uploadOnCloudinary(coverImagePath)

   if(!coverImage.url){
    throw new ApiError(400,"something went wrong while generating cover image url")
   }
   const user = await User.findByIdAndUpdate(req.user?.id,
    {
        $set : {
            coverImage : coverImage.url
        }
    },{
        new:true
    }
   ).select("-password -refreshToken")
   if(!user){
    throw new ApiError(400,"something went wrong while getting user")
   }
   res.status(200).json(new ApiResponse(200,user,"cover image uploaded successfully"))
})

const getChannel = asyncHandler(async(req,res)=>{
    const {username} = req.params
    if(!username.trim()){
        throw new ApiError(400,"Username is missing")
    }
    const channel = await User.aggregate([
        {
            $match : {
                userName : username.toLowerCase()
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup :{
                from :"subscribers",
                localField :"_id",
                foreignField :"subscriber",
                as :"subscribedTo"
            }
        },{
            $addFields :{
                subscriberCount : {
                    $size : "$subscribers"
                },
                channelSubscribedTo : {
                    $size : "$subscribedTo"
                },
                isSubscribedTo :{
                    $cond : {
                        if :{$in : [req.user._id,"$subscribers.subscribe"]},
                        then : true,
                        else : false
                    }
                }
            }
        },{
            $project :{
                fullName :1,
                email:1,
                userName:1,
                subscriberCount : 1,
                channelSubscribedTo : 1,
                isSubscribedTo : 1,
                coverImage : 1,
                avatar : 1
            }
        }
    ])
    if(!channel.length){
        throw new ApiError(404,"channel does not exists")
    }
    res.status(200).json(new ApiResponse(200,channel[0],"channel fetched successfully"))
})
const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([{
        $match :{
            _id : mongoose.Types.ObjectId(req.user?._id)
        }
    },
    {
        $lookup : {
            from : "videos",
            localField : "watchHistory",
            foreignField : "_id",
            as : "watchHistory",
            pipeline:[
                {
                    $lookup :{
                        from : "users",
                        localField : "owner",
                        foreignField : "_id",
                        as : "owners",
                        pipeline :[
                            {
                                $project : {
                                    userName :1,
                                    fullName :1,
                                    avatar :1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields : {
                        owners : {
                            $first : "$owners"
                        }
                    }
                }
            ]
        }
    }
])
 if(!user.length){
    throw new ApiError(400,"something went wrong while generating user in watch history")
 }
 res.status(200).json(new ApiResponse(200,user[0],"watch history retrieved successfully"))
})
export {registerUser,loginUser,logOutUser,refreshToken,changePassword,getUser,updateAccountDetails,updateAvatar,updateCoverImage,getChannel,getWatchHistory}