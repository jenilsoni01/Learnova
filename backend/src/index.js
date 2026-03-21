import dotenv from "dotenv" //(module)
import connectDB from "./db/index.js"
import app from "./app.js"

import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config({
    path: './env'
})


connectDB() // connecting db
.then(() => {
    app.listen(process.env.PORT || 8000, () => {// serever init.
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => { // error handling
    console.log("MONGO db connection failed !!! ", err); 
})


