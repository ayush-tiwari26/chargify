import {getUsers, signUp, signIn, getUser} from "../controllers/user";
import {Router} from "express";
import {validateToken} from "../middleware/tokenValidation";

const router = Router();

router.get('/test', (req, res)=>{ res.send("API Running")});
router.get('/', validateToken, getUser);
router.get('/all', validateToken, getUsers);

// requires body param: name, email, password
router.post('/signup', signUp);
// requires body param: email, password
router.post('/signin', signIn);

export default router;