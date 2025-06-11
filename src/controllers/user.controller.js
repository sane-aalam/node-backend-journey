
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";

const registerUser = asyncHandler( async(req,res) =>{
 // get user details from frontend
// validation - not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return res
// message: "System initialized successfully. All services operational.",
// value: 1,
// username,email,fullname,avatar,coverImage,password,refreshToken,createAT,updateAT
  
 const { username, email, fullname, password } = req.body;

    if([fullname,email,fullname,password].some((field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required!");
    }
  
    // User.findOne({}): used to search element into database
    // user.findone({$"or"}) : or "email" or "password"
    // cloudinaryImage using multer - req.files?.avatar[0]?.path;
    // create model se schema

})

export {registerUser};