import {config} from 'dotenv';
import {PrismaClient} from '@prisma/client';
import express, {Express} from 'express';
import evstationRouter from "./routes/evstation";
import userRouter from "./routes/user";
import {cronRunner} from "./controllers/cron/descriptionCron";

// To allow modification of request object from middleware to add current user id
declare global {
    namespace Express {
        interface Request {
            user: any
        }
    }
}

config();
const prisma: PrismaClient = new PrismaClient();
const app: Express = express();

app.use(express.json())
app.get('/', (req, res) => {
    res.json({message: "Welcome to EV Station API"}).status(200);
})

app.use('/evstation', evstationRouter);
app.use('/user', userRouter);

app.listen(process.env.PORT, async () => {
    await prisma.$connect().then(() => {
        console.log("DB connected")
        cronRunner();
    });
    console.log(`Server running on port ${process.env.PORT}`)
});

export {prisma}