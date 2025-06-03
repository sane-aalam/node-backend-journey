// step-1 define mongoose 
// step-2 define schema
// step-3 define model
// username,email,fullname,avatar,coverImage,password,refreshToken,createAT,updateAT

import mongoose, { mongo } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const UserSchema = mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true,
    },
    fullname:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        index:true
    },
    avatar: {
            type: String, // cloudinary url (wait)
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
    },
    watchHistory: [
            {
                type: Schema.Types.ObjectId, // relation with video model, watchhistroy video as queue
                ref: "Video"
            }
    ],
    password: {
            type: String,
            required: [true, 'Password is required']
    },
    refreshToken: {
            type: String
    }
},
{timestamps:true }
)

// This pre-save middleware hashes the password before saving a user document in MongoDB using bcrypt.
UserSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

// Compare password checker
UserSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

UserSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

UserSchema.methods.refreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.evn.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("user",UserSchema);


// Docs to understand everything
// Hash password before saving
// Compare password checker - isPasswordCorrectorNot
// generateAccessToken method
// refershAccessToken method
// What it does:
// This pre-save middleware hashes the password before saving a user document in MongoDB using bcrypt. Let’s break it down:
// 🔍 Explanation:
// this.isModified("password"): Checks if the password field has been changed (e.g., during user creation or update).
// bcrypt.hash(this.password, 10): Hashes the password using a salt round of 10 (secure default).
// next(): Proceeds to the next middleware or saves the document.
