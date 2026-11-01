
import type { Request, Response } from "express";
import { db } from "../prisma/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

import "dotenv/config";



export const register = async (req: Request, res: Response): Promise<void> => {

    const { username, number, email, password } = req.body;

    const name: string = username?.trim();
    const normalizedEmail: string = email?.trim().toLowerCase();
    try {
        if (!name || !normalizedEmail) {
            res.status(400).json({
                message: "Name, email, and password are required",
            });
            return;
        }
        const saltRounds = 10;

        const hashedPassword: string = await bcrypt.hash(password, saltRounds);

        const created = await db.orm.public.User.create(
            {
                email: normalizedEmail,
                username: username,
                number: number,
                password: hashedPassword
            });

        res.status(201).json({
            message: "Registration successful",
            user: {

                name: created.username,
                email: created.email
            },
        });
    } catch (error: unknown) {
        console.error("Registration error:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};


export const post = async (req: Request, res: Response): Promise<void> => {

    const { title, content } = req.body;
    const use = req.user;
    const user_id = use.id;
    try {
        if (!user_id || !title || !content) {
            res.status(400).json({
                message: "Name, email, and password are required",
            });
            return;
        }

        const created = await db.orm.public.Post.create({
            authorId: user_id,
            title: title,
            content: content
        });

        res.status(201).json({
            message: "post uploaded",

        });
    } catch (error: unknown) {
        console.error("upload_error try again:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
}

const compare_password = async (password1: string, password2: string) => {
    return await bcrypt.compare(password1, password2);
}

const login = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    //basic checks
    if (!username || !email) {
        res.status(500).json({
            "message": "error"
        })
    }

    const use = await db.orm.public.User.first({ email: email });


    if (!use) {
        res.status(500).json({
            "message": "register first"
        })
    }
    const isvalid = await compare_password(password, use.password);
    if (isvalid) {
        throw res.status(404).json({
            "message": "password not correct"
        })
    }
    //tokens

    const a_t = jwt.sign({
        _id: use.id,
        email: use.email,
        username: use.username
    }, process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        })
    const r_t = jwt.sign({
        _id: use.id,
        email: use.email,
        username: use.username
    }, process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        })

    await db.orm.public.User.where({ id: use.id }).update({ r_token: r_t });


    //cookies and response
    const options = {
        httpOnly: true,
        secure: true
    }


    const dat = {
        name: username,
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


}


const react = async (req: Request, res: Response) => {
    try {
        const { post_id, reaction } = req.body;
        const use = req.user;
        if (!use) {
            res.status(500).json({
                "message": "use not availaible"
            })
            return
        }
        if (!(use.id)) {
            res.status(500).json({
                "message": "user_id is not defined"
            })
            return
        }
        const reaction_t = await db.orm.public.reaction.
            first({ user_id: use?.id, post_id: post_id });
        if (reaction_t) {
            const deletedreaction = await db.orm.public.User.where({ user_id: use?.id, post_id: post_id }).delete();
            res.status(201).json({
                "message": "successfully deleted the reaction"
            })
            return;
        }


        const use_id = use?.id;
        const created = await db.orm.public.reaction.create({
            user_id: use.id,
            post_id: post_id,
            reaction: reaction
        });
        if (!created) {
            res.status(500).json({
                "message": "reaction was not created due to some database error"
            })
            return;
        }

    }
    catch (error) {
        res.status(404).json({
            "message": "somehting went wrong"
        })
    }


}





