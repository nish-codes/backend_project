import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynchHandler.js";
import { Video } from "../models/video.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async(req,res)=>{
    const {page =1 ,limit =10,query = "",sortBy = "createdAt",sortType = "desc",userId} = req.query
    
    const matchStage = {

    }
    if(query){
        matchStage.$or = [
            {title : {$regex :query,$options : "i"}},
            {description :{$regex : query , $options : "i"}}
        ]
    }
    if(userId){
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }
    const pipeline = [
        {
            $match : matchStage
        },{
            $sort : {
                [sortBy]:sortType === "asc"?1:-1 
            }
        },{
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField :"_id",
                as : "createrInfo",
                pipeline : [
                    {$project : {
                        _id : 1,
                        userName : 1,
                        avatar : 1,
            
                    }}
                ]
            }
        },{
            $unwind : "$createrInfo"
        }
    ]
    const options = {
        page : Number(page),
        limit : Number(limit)
    }
  const videos = await Video.aggregatePaginate(Video.aggregate(pipeline),options)
  if(!videos){
    throw new ApiError(400,"the videos are not generated")
  }
  res.status(200).json(new ApiResponse(200,videos,"the videos are retrieved successfully"))

})

const getVideoById = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400,"the video id is not given")
    }
    const video = await Video.findByIdAndUpdate(videoId,{
        $inc : {views:1}
    },{
        new : true
    }).populate("owner","_id userName avatar")
    if(!video){
        throw new ApiError(400,"video was not found")
    }
    res.status(200).json(new ApiResponse(200,video,"video retrieved successfully"))
})

const publishVideo = asyncHandler(async(req,res)=>{
    const {title,description} = req.body
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"user id cannot be accessed")
    }
    if(!(title && description)){
        throw new ApiError(400,"title and description is requied")
    }
    const videoPath = req.files?.video[0]?.path
    const thumbnailPath = req.files?.thumbnail[0]?.path
    if(!(videoPath&&thumbnailPath)){
        throw new ApiError(400,"problem in generating videopath and thumbnail path")
    }
    const video = await uploadOnCloudinary(videoPath)
    const thumbnail = await uploadOnCloudinary(thumbnailPath)
    if(!(video&&thumbnail)){
        throw new ApiError(400,"problem while creating link for video and thumbnail")
    }
    const newVideo = await Video.create({
        title,
        description,
        thumbnail : thumbnail.url,
        videoFile : video.url,
        duration : video.duration,
        owner : userId,
        isPublished : true
    })

    res.status(200).json(new ApiResponse(200,newVideo,"the video published successfully"))
   
})

const updateVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {title,description} = req.body
    const thumbnailPath = req.file?.path
    const update = {}
    if(title){
        update.title = title
    }
    if(description){
        update.description = description
    }
    if(thumbnailPath){
        const thumbnail = await uploadOnCloudinary(thumbnailPath)
        if(!thumbnail){
            throw new ApiError(400,"something went wrong while uploading the thumbnail")
        }
        update.thumbnail = thumbnail.url
    }
    if(!Object.keys(update).length){
        throw new ApiError(400,"no fields were provided")
    }
    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        update
    ,{
        new : true
    })
    if(!updatedVideo){
        throw new ApiError(400,"error while adding the updates")
    }
    res.status(200).json(new ApiResponse(200,updatedVideo))

})

const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400,"video id is not given")
    }
    const video = await Video.findByIdAndDelete(videoId)
    if(!video){
        throw new ApiError(400,"error while deleting the video")
    }
    res.status(200).json(new ApiResponse(200,video,"deleted succesfully"))
})

const toogllePublishStatus = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400,"video id is not provided")
    }
    const existing = await Video.findOne(videoId,{
        isPublished : true
    })
    if(existing){
        const updatedVideo = await Video.findByIdAndUpdate(videoId,{
            isPublished : false
        },{
            new : true
        })
        if(!updatedVideo){
            throw new ApiError(400,"problem while updating the video")
        }
        return res.status(200).json(new ApiResponse(200,updatedVideo,"toggled"))
    }
    const updatedVideo = await Video.findByIdAndUpdate(videoId,{
        isPublished : true
    },{
         new : true
    })
     if(!updatedVideo){
            throw new ApiError(400,"problem while updating the video")
        }
     res.status(200).json(new ApiResponse(200,updatedVideo,"toggled"))
})

export {getAllVideos,getVideoById,publishVideo,updateVideo,deleteVideo,toogllePublishStatus}