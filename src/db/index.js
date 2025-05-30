
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"

const connectDB = async () =>{
    try{
        const connectionInstanceDB = await mongoose.connect("mongodb+srv://saneraza78692:cjK5R9GUGef0cSFu@cluster0.mshzbft.mongodb.net/");
         console.log(`\n MongoDB connected !! DB HOST: ${connectionInstanceDB.connection.host}`);
    }catch(error){
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB;