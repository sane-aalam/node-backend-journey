
import {asyncHandler} from "../utils/asyncHandler.js";

const registerUser = asyncHandler( async(req,res) =>{
    res.status(200).json({
       massage:"Everything is working fine! OKAY",
       value : 1,
    })
})

export {registerUser};