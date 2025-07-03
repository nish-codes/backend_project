import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asynchHandler.js";

const creatPlaylist = asyncHandler(async(req,res)=>{
    const {name,description} = req.body
    if(!name || !description){
        throw new ApiError(400,"name and descriptioin both are required")
    }
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"problem in creating user id")
    }
    const newPlaylist =await Playlist.create({
        name : name,
        description : description,
        ownner : userId
    })
    res.status(200).json(200,newPlaylist,"playlist created successfully")
})

const getUserPlaylist = asyncHandler(async(req,res)=>{
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,"problem while creating the user id")
    }
    const playlists = await Playlist.aggregate([
        {$match : {
            owner : new mongoose.Types.ObjectId(userId)
        }},
        {
            $lookup:{
                from : "videos",
                localField :"videos",
                foreignField :"_id",
                as : "videoInPlaylist"
            }
        },{
            $unwind : "$videoInPlaylist"
        }
    ])

    if(!playlists.length){
        throw new ApiError(400,"playlist are not retrieved properply")
    }
    res.status(200).json(new ApiResponse(200,playlists))
})

const getPlaylistById = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params
    if(!playlistId){
        throw new ApiError(400,"playlist id is not provided")
    }
    const playlist = await Playlist.aggregate([{
        $match : {
            _id : new mongoose.Types.ObjectId(playlistId)
        }
    },{
        $lookup :{
            from : "videos",
            localField : "videos",
            foreignField : "_id",
            as : "playlist"
        }
    },{
        $unwind : "$playlist"
    }])
    if(!playlist){
        throw new ApiError(400,"the playlist is not retrieved")
    }
    res.status(200).json(new ApiResponse(200,playlist,"retrieved succefully"))
})

const addToPlaylist = asyncHandler(async(req,res)=>{
    const {videoId,playlistId} = req.params
    const newPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $addToSet : {videos : mongoose.Types.ObjectId(videoId)}
        },{
            new : true
        }
    )
    if(!newPlaylist){
        throw new ApiError(400,"something went wrong while adding the video to the playlist")
    }
    res.status(200).json(new ApiResponse(200,newPlaylist))
})

const removevideoFromPlaylist = asyncHandler(async(req,res)=>{
    const {videoId,playlistId} = req.params
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $pull : {
                videos : mongoose.Types.ObjectId(videoId)
            }
        },{
            new : true
        }
    )
   if(!updatedPlaylist){
    throw new ApiError(400,"something went wrong while removing the video")
   }
   res.status(200).json(new ApiResponse(200,updatedPlaylist))
})
const deletePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params
    if(!playlistId){
        throw new ApiError(400,"playlist id is required")
    }
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)
    if(!deletedPlaylist){
        throw new ApiError(400,"the playlist was not found")
    }
    res.status(200).json(new ApiResponse(200,"","the playlist deleted successfully"))
})
const updatePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params
    const {name,description} = req.body
    if(!(name && description)){
        throw new ApiError(400,"name and description is required")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,{
        name,description
    },{new : true})
     if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }
  res.status(200).json(new ApiResponse(200,updatedPlaylist,"playlist updated successfully"))
})

export {creatPlaylist,updatePlaylist,addToPlaylist,deletePlaylist,getUserPlaylist,getPlaylistById,removevideoFromPlaylist}