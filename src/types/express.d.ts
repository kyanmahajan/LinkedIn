
import type { Request } from "express";

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            username: string;
        }

        interface Request {
            user?: User;
        }
    }
}

export {};