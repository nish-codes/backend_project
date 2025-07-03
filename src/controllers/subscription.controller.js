import { Schema } from "zod";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asynchHandler.js";
import { User } from "../models/user.model";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400,"channel id is not recieved")
    }
    const Userid = req.user?._id
    if(!Userid){
        throw new ApiError(400,"User id cannot be generated")
    }
    const existingUser = await Subscription.findOne({     
           channel : channelId,
           subscriber : Userid
}        
    )
    if(existingUser){
        await Subscription.findByIdAndDelete(existingUser._id)
        return res.status(200).json(new ApiResponse(200,"","Unsubscribed successfully"))
    }
    await Subscription.create({
        subscriber : Userid,
        channel : channelId
    })
    res.status(200).json(new ApiResponse(200,"","Subscribed successfully"))
})

const getUserChannelSubscriber = asyncHandler(async(req,res)=>{
    const {channelID} = req.params
    const userSubscribed = await Subscription.aggregate([
        {
            $match : {
                channel : mongoose.Types.ObjectId(channelID)
            }
        },
        {
            $lookup :{
                from : "users",
                localField:"subscriber",
                foreignField:"_id",
                as: "subscribers",
                pipeline :[
                    {
                        $project :{
                            userName : 1
                        }
                    }
                ]
            }
        },{
            $unwind : "$subscribers"
        },{
            $replaceRoot : {newRoot : "$subscribers"}
        }
        
    ])
    res.status(200).json(new ApiResponse(200,userSubscribed,"list of subscribers"))
})
const getSubscribedChannel =asyncHandler(async(req,res)=>{
    const {subscriberId} = req.params
    const subscribedTo = await Subscription.aggregate([{
        $match:{
            subscriber : mongoose.Types.ObjectId(subscriberId)
        }
    },{
        $lookup :{
            from : "users",
            localField : "channel",
            foreignField : "_id",
            as :"channels",
            pipeline : [
                {
                    $project :{
                        userName : 1,
                    }
                }
            ]
        }
    },{
        $unwind : "$channels"
    },{
        $replaceRoot :{
            newRoot :"$channels"
        }
    }])
    res.status(200).json(new ApiResponse(200,subscribedTo,"got the channel that the user subscribed to successfully"))
})
export {toggleSubscription,getSubscribedChannel,getUserChannelSubscriber}