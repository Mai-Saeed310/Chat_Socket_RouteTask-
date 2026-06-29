import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors'
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PORT } from './config/config.service';
import { AppError, globalErrorHandler } from './common/utiliti/global-error-handling';
import { authRouter } from './modules/auth/user.controller';
import { checkConncetionDB } from './DB/connectionDB';
import radisService from './common/service/radis.service';
import { S3Service } from './common/service/S3.service';
import { pipeline } from 'node:stream/promises';
import { createHandler } from 'graphql-http/lib/use/express';
import { authentication, decodeToken_and_fetchUser } from './common/middlware/authentication';
import { Server } from 'socket.io';
import socketGetway from './modules/realtime/socket.getway';
import chatRouter from './modules/chat/chat.controller';

const app:express.Application = express(); 

const port: number = PORT; 

export const bootstrap = async ()=>{

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message:"Too many requests, please try again later."
    });
    checkConncetionDB();
    radisService.redisConnection();
    app.use(express.json());
    app.use(cors(),helmet(),limiter);


    app.use("/auth",authRouter);
    app.use("/chat",chatRouter);

    app.post("/send-notification", (req: Request, res: Response, next: NextFunction)=>{
            console.log({token: req.body.token})
    })


    app.use("{/*demo}", (req: Request, res: Response, next: NextFunction)=>{
       throw new AppError (`Url ${req.originalUrl} with method ${req.method} not found`,404); 
    })
    
    const httpServer = app.listen(port, () => {
        console.log(`server is running on port ${port} `);
    });

    await socketGetway.init(httpServer)

    
    // Global error handling 
    app.use(globalErrorHandler)

    app.listen(port,()=> {
        console.log(`server is running on ${port}`)
    })
}




// io.on("connection", (socket) => {
//     connections.push(socket.id)
//     console.log(socket.id);
//     console.log(socket.data.user);

//     socket.on("hi", (data, cb) => {
//         cb("hi from BE")
//         // console.log(data);
//         // socket.emit("sayHiBack", { message: "hi from be" })
//         // io.emit("sayHiBack", { message: "hi from be" })
//         // socket.broadcast.emit("sayHiBack", { message: "hi from be" })
//         // socket.to([connections.at(-1)!,connections.at(-2)!]).emit("sayHiBack", { message: "hi from be" })
//         // socket.except(data.id).emit("sayHiBack", { message: "hi from be" })
//         io.except(data.id).emit("sayHiBack", { message: "hi from be" })
//     })
// })
