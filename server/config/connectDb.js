import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDb = async () =>{
    try{
        await mongoose.connect(process.env.MONGO_DB_URI);
        console.log(`Database Connected Successfully`);
    } catch(err){
        console.log(`Error connection to database ${err}`);
        process.exit(1);
    }
}

export default connectDb;