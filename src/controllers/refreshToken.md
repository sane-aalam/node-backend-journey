
```js

[Client] 
    |
    v
[Sends refresh token to server]
    |
    v
[Server verifies JWT using REFRESH_TOKEN_SECRET]
    |
    v
[Decoded?] -- no --> [401 Unauthorized]
    |
    v
[Find user by decoded._id]
    |
    v
[User exists?] -- no --> [401 Unauthorized]
    |
    v
[Does token match user's saved refreshToken?] -- no --> [401 Token expired or reused]
    |
    v
[Generate new access & refresh token]
    |
    v
[Save new refresh token in DB]
    |
    v
[Send both tokens to client via HTTP-only, secure cookies]

```