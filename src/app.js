import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json({
    limit:"16kb"
}))

app.use(express.urlencoded({
    limit:"16kb",
    extended:true
})
)
app.use(express.static("public"))
app.use(cors({
    origin:process.env.CORS_ORGIN,
    credentials:true
}))
app.use(cookieParser())

//routes
import  userRoute  from "./routes/user.routes.js";
app.use("/api/v1/user",userRoute)
export {app}