import mongoose  from "mongoose";
import { Db_name } from "../constants.js";

export const connectDb = async ()=>{
    try{
    const dbInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${Db_name}`);
    console.log(`MongoDb is connected to host ${dbInstance.connection.host}`);
    }
    catch(error){
     console.log("MongoDb connection error ",error);
    process.exit(1)

    }
}
