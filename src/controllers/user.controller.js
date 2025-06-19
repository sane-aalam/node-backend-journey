import { User} from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


// Generate New Tokens
// - A new short-lived access token
// - A new long-lived refresh token
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        console.log(accessToken,refreshToken);

        // access accesToken,save into db,validateBeforeSave:No need
        // return [accessToken,refreshToken] 
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return [accessToken,refreshToken];

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token");
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullname, email, username, password } = req.body
    console.log("email: ", email);

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log(avatarLocalPath);

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    console.log(coverImageLocalPath);
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler( async (req,res) => {
    // step by step explanation
    // req body -> data
    // username or email is not filled by user then return ERROR
    //find the user - (username,password,email which is filled by user), so we have to search into DB(user)
    //password check
    //access and referesh token
    //send cookie

    const {username,email,password} = req.body;
    console.log(username,email,password);

    if(!username && !email){
        throw new ApiError("400", "username or email is required" )
    }

    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.find({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError("404", "user is required");
    }

    //password check - db called 
    // we have to to await - it take some time
    const isPasswordValid = user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError("400","Invalid password!");
    }

    const [accessToken,refreshToken] = await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password","-refreshToken");

    // Only the server can access the cookie.
    // It's only transmitted over secure HTTPS.
     const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
        {
         user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
     )
   )
})

// logout feature - clear accessToken,refreshToken
const logoutUser = asyncHandler((req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },{
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .clearCookie(accessToken,options)
    .clearCookie(refreshToken,options)
    .json(new ApiResponse(200, {}, "User logged Out"))  
})

//! penging work
// api : refreshAccesstoekn
// api : changeCurrentPassword 
// api : changeAvtarPic
// api : changeCoverPic
// api : getCurrentUser 
// api : updateAccountDetails 


const refreshAccessToken = asyncHandler(async(req,res)=>{
    // Validates the provided refresh token.
    // Ensures it matches the one stored for the user.
    // Generates a new access token and refresh token.
    // Sends both tokens to the client via cookies.
    // newRefreshToken set 
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id);
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
        
        if(incomingRefreshToken != user.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true,
        }
    
        const [accessToken,newRefreshToken] = await generateAccessAndRefereshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken:accessToken,
                    refreshToken:newRefreshToken,
                },
                "Acess token refreshed!"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


export {
    registerUser,
    loginUser,
    logoutUser
}