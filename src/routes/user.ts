import { asynca } from "../utils/asynchan.js";
import { apierror } from "../utils/apierror.js";
import { user } from "../models/user.js";
import { uploadoncl } from "../utils/cloud.js";
import jwt from "jsonwebtoken"
// import {byenc}

const register = asynca(async (req, res) => {
    const { name, password, email } = req.body;
    const username = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!username || !password?.trim() || !normalizedEmail) {
        throw new apierror(400, "Name, email, and password are required");
    }

    const avatarFile = req.files?.avatar?.[0];
    if (!avatarFile) {
        throw new apierror(400, "An avatar image is required");
    }

    const existingUser = await user.findOne({
        $or: [{ username: username.toLowerCase() }, { email: normalizedEmail }],
    });
    if (existingUser) {
        throw new apierror(409, "A user with that name or email already exists");
    }

    const coverFile = req.files?.coverImage?.[0];
    const [avatar, cover] = await Promise.all([
        uploadoncl(avatarFile.path),
        coverFile ? uploadoncl(coverFile.path) : Promise.resolve(null),
    ]);
    if (!avatar?.url) {
        throw new apierror(502, "Avatar upload failed");
    }
    if (coverFile && !cover?.url) {
        throw new apierror(502, "Cover image upload failed");
    }

    const createdUser = await user.create({
        username,
        email: normalizedEmail,
        password,
        avatar: avatar.url,
        ...(cover?.url ? { cover_i: cover.url } : {}),
    });

    const responseUser = createdUser.toObject();
    delete responseUser.password;
    delete responseUser.r_token;

    return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: responseUser,
    });
});


const login = asynca(async (req, res) => {
    const { name, email, password } = req.body;
    //basic checks
    if (!name || !email) {
        throw new apierror(401, "fill proper detials")
    }

    const use = await user.findOne({ email: email });
    if (!use) {
        throw new apierror(400, "register first");
    }


    const booll = await use.iscorrect(password, use.password);
    if (!booll) {
        throw new apierror(401, "password not correct");
    }
    //tokens
    const a_t = use.generateA;
    const r_t = use.generateR;
    if (!a_r || r_t) {
        throw new apierror(403, "somehting went wrong in fenerating tokens");

    }
    use.r_token = r_t;
    await use.save({ validateBeforeSave: false })
    use.a_token = a_t;

    //cookies and response
    const options = {
        httpOnly: true,
        secure: true
    }


    const dat = {

        email: use.email
    };


    res.status(201).
        cookie("access_token", a_t, options).
        cookie("refersh_token", r_t, options).
        json({
            success: true,
            message: "login successful",
            data: dat,
        })


})

const logout = async (req, res) => {
    try {
        const use = req.user;
        const id = use._id;

        const filter = { _id: id };
        const update = { r_token: undefined };


        const options = {
            httpOnly: true,
            secure: true
        }
        changed = await user.findOneAndUpdate(filter, update)

        return res.status(201).clearCookie("accessToken", options).clearCookie("refreshToken").json(
            {
                message: "user logges out",
                success: true
            }
        )


    }
    catch(error){
     res.status(401).json({
       success: false, 
       message: "somethign went wrong while logging the user out"
     })
    }
}