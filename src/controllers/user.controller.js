import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// Generate New Tokens ( new short-lived access token &&  new long-lived refresh token)
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    console.log(accessToken, refreshToken);

    // access accesToken,save into db,validateBeforeSave:No need
    // return [accessToken,refreshToken]
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return [accessToken, refreshToken];
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullname, email, username, password } = req.body;
  console.log("email: ", email);

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log(avatarLocalPath);

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  console.log(coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // step by step explanation
  // req body -> data
  // username or email is not filled by user then return ERROR
  //find the user - (username,password,email which is filled by user), so we have to search into DB(user)
  //password check
  //access and referesh token
  //send cookie

  const { username, email, password } = req.body;
  console.log(username, email, password);

  if (!username && !email) {
    throw new ApiError("400", "username or email is required");
  }

  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")

  // }

  const user = await User.find({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError("404", "user is required");
  }

  //password check - db called
  // we have to to await - it take some time
  const isPasswordValid = user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError("400", "Invalid password!");
  }

  const [accessToken, refreshToken] = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password",
    "-refreshToken"
  );

  // Only the server can access the cookie.
  // It's only transmitted over secure HTTPS.
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

// logout feature - clear accessToken,refreshToken
const logoutUser = asyncHandler((req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie(accessToken, options)
    .clearCookie(refreshToken, options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

//! penging work
// controller : login
// controller : register
// controller : logout
// controller : refreshAccesstoekn
// controller : changeCurrentPassword
// controller : getCurrentUser
// controller : changeAvtarPic
// controller : changeCoverPic


const refreshAccessToken = asyncHandler(async (req, res) => {
  // Validates the provided refresh token.
  // Ensures it matches the one stored for the user.
  // Generates a new access token and refresh token.
  // Sends both tokens to the client via cookies.
  // newRefreshToken set
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken != user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const [accessToken, newRefreshToken] =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken: accessToken,
            refreshToken: newRefreshToken,
          },
          "Acess token refreshed!"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPasssword, newPassword } = req.body;

  // check if current and new password are provided
  if (!currentPasssword || !newPassword) {
    throw new ApiError(400, "Current and new password are required");
  }

  // new password
  if (currentPasssword === newPassword) {
    throw new ApiError(
      400,
      "New password must be different from current password"
    );
  }

  // if(newPassword !== confirmPassword){
  //     throw new ApiError(404,"new passsword or confrimpassword must be equal")
  // }

  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.isPasswordCorrect(currentPasssword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }

  // assign new-password,we have to save into user(db called) await(take some time)
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler((req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  // get the fullName,email
  // check validateBeforeUpdate
  // update by findByIdAndUpdate(fullname,email);

  const { fullName, email } = req.body;

  // fullname or email is not feiled correctly which both are required to fill.
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

/* !usernameUpdated
const userNameUpdated = asyncHandler(async (req, req) => {

  const {newUsername} = req.body;
  if (!newUsername) {
    throw new ApiError(400, "Username is required");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.username === newUsername) {
    throw new ApiError(400, "New username must be different");
  }

  const existing = await User.findOne({ username: newUsername });
  if (existing) {
    throw new ApiError(409, "Username already taken");
  }

  user.username = newUsername;
  user.save({validateBeforeSave: false});

  return res
  .status(200)
  .json(
    new ApiResponse(200,"username changed successfully")
  )
});

*/
const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }

    //! pending - delete old avatar file

    //? upload new avatarLocalPath into cloudinary file
    const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    // update into db 
    const user = await User.findByIdAndUpdate(
        req.user._id,{
             $set:{
                avatar:avatar.url
             }
            },
         {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
}) 

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }

    //! pending - delete old avatar file

    //? upload new coverImageLocalPath into cloudinary file
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }
    // update into db 
    // $set - Purpose Modifies specific fields in a document
    const user = await User.findByIdAndUpdate(
        req.user._id,{
             $set:{
                coverImage:coverImage.url
             }
            },
         {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
}) 

export
 { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    updateAccountDetails
  }; 