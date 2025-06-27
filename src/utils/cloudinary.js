import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
cloudinary.config(
    {
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME ,
        api_key : process.env.CLOUDINARY_API_KEY,
        api_secret : process.env.CLOUDINARY_API_SECRET
    }
)

const uploadOnCloudinary = async (filepath)=>{
   try{
    if(!filepath)
        return null
   
   const response = cloudinary.uploader.upload(filepath,{
    resource_type : "auto"
   })
   fs.unlinkSync(localfilepath)
   return response
}
   catch(err){
    fs.unlink(filepath)
    console.log("Error is from cloudinary")
    return null
   }
}

export {uploadOnCloudinary}