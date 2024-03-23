import {fetchAll, fetchNearby, getPath} from "../controllers/evstation";
import {getRatingByEvStationId, createOrUpdateRating} from "../controllers/rating";
import {Router} from "express";
import {validateToken} from "../middleware/tokenValidation";

const router = Router();

// Reading evstations nearby
// no params/body needed
router.get('/all', fetchAll);

// query params: latitude, longitude
router.get('/nearby', fetchNearby);
// body {"source":{"latitude":number, "longitude":number},"destination":{"latitude":number, "longitude":number}}
router.post('/path', validateToken, getPath);

router.get('/')

// updating the ratings and adding reviews
// body: evStationId, evUserId, rating, review
router.post('/rate', validateToken, createOrUpdateRating);
router.get('/rating/:evstationId', validateToken, getRatingByEvStationId);

export default router;