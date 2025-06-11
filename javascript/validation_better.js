

const { username, email, fullname, password } = req.body;

// if(fullname == ""){
//     return ApiError(400,"fullname is required!")
//   }

//   if(username == ""){
//     return ApiError(400,"username is required!")
//   }

//   if(password == ""){
//     return ApiError(400,"password is required")
//   }

if([fullname,email,fullname,password]).some((field) =>
    field?.trim() === "")
)