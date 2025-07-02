import mongoose ,{Schema}from "mongoose";


const subscriptionSchma = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId,
        ref:"user"
    },
    channel : {
        type : Schema.Types.ObjectId,
        ref:"user"
    }
}
)

export const Subscription = mongoose.model("Subscription",subscriptionSchma)