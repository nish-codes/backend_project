const asyncHandler = (fn)=>{
    return (req,res,next)=>{
        promise.resolve(fn(req,res,next)).catch((error)=>{next(error)})
    }
}

export {asyncHandler}
