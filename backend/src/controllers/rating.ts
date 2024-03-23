import {prisma} from "../index";
import {Request, Response} from 'express';

const getRatingByEvStationId = async (req: Request, res: Response) => {
    const {evstationId} = req.params;
    const ratings = await prisma.rating.findMany({
        where: {
            stationId: parseInt(evstationId as string)
        },
        include: {
            user: true
        }
    });
    res.json(ratings).status(200);
}

const createOrUpdateRating = async (req: Request, res: Response) => {
    // station id, the new rating to be added to
    const evUserId = req.user.id;
    const {evStationId, rating, review} = req.body;
    var dbRating = await prisma.rating.findFirst({
        where: {
            userId: parseInt(evUserId as string),
            stationId: parseInt(evStationId as string),
        }
    });
    if (dbRating == null) {
        // create
        dbRating = await prisma.rating.create({
            data: {
                userId: parseInt(evUserId as string),
                stationId: parseInt(evStationId as string),
                rating: parseInt(rating),
                review: review,
            }
        })
    } else {
        // update
        dbRating = await prisma.rating.update({
            where: {
                id: dbRating.id
            },
            data: {
                rating: parseInt(rating),
                review: review,
            }
        })
    }
    await prisma.evStation.update({
        where: {
            id: parseInt(evStationId as string)
        },
        data: {
            rating: {
                connect: {
                    id: dbRating.id
                }
            }
        }
    });
    await prisma.evUser.update({
        where: {
            id: parseInt(evUserId as string)
        },
        data: {
            rating: {
                connect: {
                    id: dbRating.id
                }
            }
        }
    });
    res.json(dbRating).status(201);
}

export {getRatingByEvStationId, createOrUpdateRating};