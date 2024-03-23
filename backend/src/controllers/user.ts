import {prisma} from "../index";
import {Request, Response} from "express";
import bcrypt from "bcrypt";
import jwt, { sign } from 'jsonwebtoken';
const getUsers = async (req: Request, res: Response) => {
    const users = await prisma.evUser.findMany();
    res.json(users);
};

const getUser = async (req: Request, res: Response) => {
    const userId = req.user.id;
    const user = await prisma.evUser.findUnique({
        where: {
            id: parseInt(userId)
        }
    });
    if (!user) {
        return res.status(404).json({message: "User not found"});
    }
    res.json(user).status(201);
}
const signUp = async (req: Request, res: Response) => {
    const {name, email, password} = req.body;
    const checkUser = await prisma.evUser.findFirst({
        where:{
            email: email
        }
    })
    if (checkUser !== null) {
        return res.status(400).json({ message: "User with this email already exists." });
    }
    // encrypt password using bcrypt
    const encryptedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.evUser.create({
        data: {
            name: name,
            email: email,
            password: encryptedPassword
        }
    });
    const token = generateToken(user)
    res.json({"token":token, ...user}).status(201);
}

const signIn = async (req: Request, res: Response) => {
    const {email, password} = req.body;
    const user = await prisma.evUser.findUnique({
        where: {
            email: email
        }
    });
    if (!user) {
        return res.status(404).json({message: "User not found"});
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({message: "Invalid password"});
    }
    // send authorization token after successful login
    const token = generateToken(user)
    res.json({"token":token, ...user});
}

const generateToken = function (payload: any){
    return sign({ ...payload }, process.env.JWT_PRIVATE_KEY!, { expiresIn: '72h' });
}

export {getUsers, signUp, signIn, getUser}