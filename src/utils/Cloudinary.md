```js

  const uploadResult = await cloudinary.uploader
       .upload(
           'URL_OF_IMAGE', {
               public_id: 'shoes',
           }
       )
       .catch((error) => {
           console.log(error);
       });
    
    console.log(uploadResult);

```