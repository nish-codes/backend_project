import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchHandler.js";

const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400,"Id for video or user is not recieved")
    }
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"userid is not generated")
    }
    const existingLike = await Like.findOne({
        likedBy : userId,
        video : videoId
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200,"","unLiked the video successfully"))
    }
   const newLike = await Like.create({
        likedBy : userId,
        video : videoId
    })
    res.status(200).json(new ApiResponse(200,newLike,"liked the video successfully" ))
   
})

const commentLike = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(400,"comment id not recieved")
    }
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"user id is not generated")
    }
    const existingLike = await Like.findOne({
        likedBy : userId,
        comment : commentId
    })
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200,"","unliked the comment successfully"))
    }
    const newLike = await Like.create({
        likedBy : userId,
        comment : commentId
    })
    res.status(200).json(new ApiResponse(200,newLike,"liked the comment succesfully"))
})

const getLikedVideos = asyncHandler(async(req,res)=>{
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"the user id is not generated")
    }
    const liked = await Like.aggregate([{
        $match : {
            likedBy : mongoose.Types.ObjectId(userId),
            video :{$ne:null}
        }
    },
{
    $lookup : {
        from : "videos",
        localField : "video",
        foreignField : "_id",
        as :"likedVideos",
    }
},{
    $unwind : "$likedVideos"
},{
    $replaceRoot :{newRoot : "$likedVideos"}
}])
})