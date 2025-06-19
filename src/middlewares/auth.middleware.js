
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

// req,res,next() -> next() call next function 

export const jwtVerify = asyncHandler( async (req,_,next)=>{
     try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        console.log(token);

        if(!token){
            throw new ApiError(404,"Unauthorized request");
        }

        // jwt.verify function decodes the payload of the JWT. 
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        // get access the user orignial through using decodedToken(webtoken)
        const user = await User.findById(decodedToken?._id).select("-password","-refreshToken");

        if(!user){
            throw new ApiError(401,"Invalid Access token");
        }

        req.user = user;
        next();
     } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
     }
})