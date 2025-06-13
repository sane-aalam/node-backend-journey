
import mongoose, { Schema } from "mongoose";
// Mongoose supports .aggregate() for complex queries (like $lookup, $group, etc.)
import mongooseAggregatePaginate from " mongoose-aggregate-paginate-v2";

const VideoSchema = new Schema({
    videoFile:{
        type:String, //cloudinary url
        required:true,
    },
    thumbnail:{
         type: String, //cloudinary url
         required: true
    },title:{
        type:String,
        required:true,
    },
     description: {
            type: String, 
            required: true
        },
        duration: {
            type: Number, 
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},
 { timestamps: true} // createAt,updateAt
)

VideoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video",VideoSchema);