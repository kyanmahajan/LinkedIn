 
import "dotenv/config";
import {db} from "./prisma/db.js";

import { app } from "./app.js";



app.listen(process.env.PORT || 5081, () => {
    console.log(`server started at ${process.env.PORT || 5081}`);
  })