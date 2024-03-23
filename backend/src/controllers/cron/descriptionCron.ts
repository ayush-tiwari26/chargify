import cron from "node-cron";
import {prisma} from "../../index";
import axios from "axios";

const getRatingReviewByStationId = async (stationId: number) => {
    const comments: { review: string | null }[] = await prisma.rating.findMany({
        where: {
            stationId: stationId
        },
        select: {
            review: true
        }
    })
    return comments.filter(e => e.review).map(e => e.review);
}

const updateDescriptionByStationId = async (stationId: number, description: string) => {
    await prisma.evStation.update({
        where: {
            id: stationId
        },
        data: {
            description: description
        }
    });
}

const updateAllStationDescription = async () => {
    // return all evStationId in the table
    const evStationIds: { id: number }[] = await prisma.evStation.findMany({
        select: {
            id: true
        }
    });
    for (let {id: stationId} of evStationIds.splice(0, 1)) {
        const reviews = (await getRatingReviewByStationId(stationId)).filter(e => e?.trim()).toString();
        if (!reviews) continue;
        // send all reviews to Azure Open AI API
        let data = JSON.stringify({
            "messages": [
                {
                    "role": "system",
                    "content": "Using the comments given by users for this ECharging Station, create a 3 line description of thiEV Charging station."
                },
                {
                    "role": "user",
                    "content": reviews
                }
            ],
            "temperature": 0.7,
            "top_p": 0.95,
            "frequency_penalty": 0,
            "presence_penalty": 0,
            "max_tokens": 800,
            "stop": null
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: process.env.OPENAI_API_URL,
            headers: {
                'api-key': process.env.OPENAI_API_KEY,
                'Content-Type': 'application/json'
            },
            data: data
        };
        try {
            const res = await axios.request(config);
            if (res.data.choices && res.data.choices[0].message && res.data.choices[0].message.content) {
                await updateDescriptionByStationId(stationId, res.data.choices[0].message.content);
                console.log("Updating Description for Station ID = ", stationId);
            }
        } catch (e) {
            console.warn("Cron Job Failed, error requesting OpenAI Api", e);
        }
    }
}

export const cronRunner = () => cron.schedule(
    "0 0 0/24 * * *",
    async () => {
        // Pick the latest rating comments and update the description of evStations accordingly
        // use open ai api to get 3 lines description about the station
        // update the description of the station
        console.log("Running description cron");
        await updateAllStationDescription();
    },
    {
        scheduled: true,
        recoverMissedExecutions: true,
        name: "descriptionScheduled",
        runOnInit: true
    }
).start();