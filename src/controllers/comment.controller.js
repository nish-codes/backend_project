import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asynchHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const getVideoComments = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {page = 1,limit = 10} = req.query

    const pipeline = [
        {
            $match : {
                video : new mongoose.Types.ObjectId(videoId)
            }
        },{
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owners",
                pipeline : [
                    {
                        $project : {
                            _id : 1,
                            userName : 1,
                            avatar : 1
                        }
                    }
                ]
            }
        },{
            $unwind : "$owners"
        }
    ]
    const options = {
        page :Number(page),
        limit : Number(limit)
    }
    const comments = await Comment.aggregatePaginate(Comment.aggregate(pipeline),options)
    if(!comments){
        throw new ApiError(400,"the comments was not retrieved")
    }
    res.status(200).json(new ApiResponse(200,comments,"comments retrieved successfully"))
})

const addComment = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {content} = req.body
    if(!videoId){
        throw new ApiError(400,"videoid was not recieved")
    }
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"user id was not generated")
    }
    const comment = await Comment.create({
         content,
         owner : userId,
         video : videoId
    })
    if(!comment){
        throw new ApiError(400,"the comment was not created")
    }
    res.status(200).json(new ApiResponse(200,comment,"comment created successfully"))
})

const updateComment = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {content} = req.body
    if(!videoId){
        throw new ApiError(400,"user id was not generated")
    }
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"user id was not generated")
    }
    const existingComment = await Comment.findOne({
        video : videoId,
        owner : userId
    })
    const updatedComment = await Comment.findByIdAndUpdate(existingComment._id,{
        content
    },{
        new : true
    })
    if(!updatedComment){
        throw new ApiError(400,"the updated comment was not created")
    }
    res.status(200).json(new ApiResponse(200,updatedComment,"comment updated"))
 })
 
 const deleteComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(400,"comment id was not generated")
    }
    const comment = await Comment.findOneAndDelete({
        _id : commentId,
        owner : req.user?._id
    })
    if(!comment){
        throw new ApiError(400,"comment was not deleted")
    }
    res.status(200).json(new ApiResponse(200,comment,"comment deleted succesfully"))
 })

 export {getVideoComments,addComment,updateComment,deleteComment}