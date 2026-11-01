import { Router } from "express";
import  {register, post} from "../controllers/user.ts"
import {upload} from "../middlewares/multer.ts"
import {V_JW} from "../middlewares/auth.ts"


const router = Router();


router.route("/register").post(
upload.fields([{
  name: "avatar",
  maxCount: 1
},
{
  name: "coverImage",
  maxCount: 1
}
]),


register)
router.route("/post").post(V_JW, post)
router.route("/").get(()=>{
    console.log("user_routes are healthy")
})

export default router