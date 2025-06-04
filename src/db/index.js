
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"

const DB_URL = process.env.MONGODB_URI;

const connectDB = async () =>{
    try{
        const connectionInstanceDB = await mongoose.connect(`${DB_URL}/${DB_NAME}`);
         console.log(`\n MongoDB connected !! DB HOST: ${connectionInstanceDB.connection.host}`);
    }catch(error){
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB;