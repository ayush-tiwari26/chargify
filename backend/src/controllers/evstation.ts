import {prisma} from '../index';
import {Request, Response} from 'express';
import axios from "axios";
import {evStation} from "@prisma/client";
import {Comparator, PriorityQueue} from "./PriorityQueue";

type GeoLocation = { id: number, latitude: number, longitude: number };
type DistanceMatrix = {
    origin_addresses: string[],
    destination_addresses: string[],
    "rows": [
        {
            "elements": [
                {
                    "distance": {
                        "text": string,
                        "value": number
                    },
                    "duration": {
                        "text": string,
                        "value": number
                    },
                    "status": string
                }
            ]
        }
    ],
    "status": string
}

const fetchAll = async (req: Request, res: Response) => {
    const evStations = await prisma.evStation.findMany();
    res.json(evStations).status(200);
}

const fetchNearby = async (req: Request, res: Response) => {
    const {latitude, longitude} = req.query;
    const evStations = await prisma.evStation.findMany({
        where: {
            latitude: {
                gte: parseFloat(latitude as string) - 0.1,
                lte: parseFloat(latitude as string) + 0.1
            },
            longitude: {
                gte: parseFloat(longitude as string) - 0.1,
                lte: parseFloat(longitude as string) + 0.1
            }
        }
    });
    res.json(evStations).status(200);
}

const getPath = async (req: Request, res: Response) => {
    const {source, destination} = req.body;
    source.id = -1;
    destination.id = -2;
    const path: GeoLocation[] = await getOrderedStationPath(
        {
            id: source.id,
            latitude: Number.parseFloat(source.latitude),
            longitude: Number.parseFloat(source.longitude)
        },
        {
            id: destination.id,
            latitude: Number.parseFloat(destination.latitude),
            longitude: Number.parseFloat(destination.longitude)
        }
    )
    res.json(path).status(200);
}

// TODO
// Util Functions
// for consuming gmaps api for distance matrix
// And return array (ordered) of ev stations to be connected in between Source -> Destination
const getOrderedStationPath = async (source: GeoLocation, destination: GeoLocation): Promise<GeoLocation[]> => {
    // get filtered stations
    const evStationsScope: evStation[] = getCircleFilteredEvStations(
        source,
        destination,
        await prisma.evStation.findMany()
    );
    if(evStationsScope.length === 0) return [source, destination];
    // create the graph of filtered stations
    const graph = new Map();
    for (let station of [source, ...evStationsScope, destination]) {
        graph.set(station.id, []);
    }
    // get distance matrix
    const sources: GeoLocation[] = [source, ...evStationsScope.filter((s)=>!!s).map(evStationToGeoLocation)];
    const destinations: GeoLocation[] = [destination, ...evStationsScope.filter((s)=>!!s).map(evStationToGeoLocation)];
    const distanceMatrix: DistanceMatrix = await getDistanceMatrix(sources, destinations);
    // fill the graph in format map[start_id] = [[end_id_1, distance], [end_id_2, distance], ...]
    const distanceMap = parseDistanceMatrixToStationIds(distanceMatrix, sources, destinations);
    // link nodes only if the distance less than 300 km
    for (let i = 0; i < sources.length; i++) {
        for (let j = 0; j < destinations.length; j++) {
            const dist = distanceMap.get(sources[i].id + ":" + destinations[j].id);
            if (dist && dist< 300000) {
                graph.get(sources[i].id).push([destinations[j].id, dist]);
            }
        }
    }
    // get the shortest path from source to destination in terms of distance using dijkstra
    const pathIDs: number[] = dijkstra(graph, source.id, destination.id);
    const pathStations: evStation[] = [];
    for (let id of pathIDs) {
        pathStations.push(evStationsScope.find(station => station.id === id) as evStation);
    }
    return [source, ...pathStations.filter((s)=>!!s).map(evStationToGeoLocation), destination];
}

const getDistanceMatrix = async  (source: GeoLocation[], dest: GeoLocation[]) => {
    if (!source.length || !dest.length) {
        throw Error("No Lat Longs passed to calculate distance");
    }
    let origins = ""
    let destinations = ""
    for (let i of source) origins += i.latitude + ',' + i.longitude + '|';
    for (let i of dest) destinations += i.latitude + ',' + i.longitude + '|';
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=imperial&key=${process.env.GMAP_DISTANCE_API_KEY}`,
        headers: {}
    };
    try {
        const response = await axios.request(config)
        return response.data as DistanceMatrix;
    } catch (err) {
        throw err;
    }
}

// makes a circle of rad = dist(source, dest) from mid pt of src to dest
const getCircleFilteredEvStations =  (source: GeoLocation, destination: GeoLocation, evStationsArray: evStation[]) => {
    let ep : number = 1_000;
    let x1 : number = source.latitude * ep, y1 = source.longitude * ep;
    let x2 : number = destination.latitude * ep, y2 = destination.longitude * ep;
    let radius: number =  Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    let cx = (x1+x2)/2, cy = (y1+y2)/2;

    const evStationInCircle = evStationsArray.filter((station) => {
        let distFromCenter: number = Math.sqrt(Math.pow(cx-(station.latitude * ep), 2)  + Math.pow(cy-(station.longitude * ep), 2));
        return distFromCenter < radius;
    });
    // 0.1 = 10km in euclidean for lat long
    // keep only one ev stations if distance between them is less than max(radius/10,
    const sparseEvStations = evStationInCircle.filter((station, index) => {
        let flag = true;
        evStationInCircle.slice(0, index).forEach((station2) => {
            if (Math.sqrt(Math.pow(station.latitude - station2.latitude, 2) + Math.pow(station.longitude - station2.longitude, 2)) < Math.min(radius/10, 0.1)) {
                flag = false;
            }
        });
        return flag;
    });
    return sparseEvStations;
}

const evStationToGeoLocation =  (evStation: evStation): GeoLocation => {
    return {
        id: evStation.id,
        latitude: evStation.latitude,
        longitude: evStation.longitude
    }
}

// returns a map such that map[from_id+":"+to_id] = distance b/w from and to
const parseDistanceMatrixToStationIds =  (distanceMatrix: DistanceMatrix, source: GeoLocation[], destination: GeoLocation[]) : Map<string, number> => {
    const rows = distanceMatrix.rows;
    const map : Map<string, number> = new Map();
    for (let i = 0; i < source.length; i++) {
        for (let j = 0; j < destination.length; j++) {
            map.set(source[i].id + ":" + destination[j].id,  (rows[i]?.elements && rows[i]?.elements[j]?.distance?.value) || 0);
        }
    }
    return map;
}

// dummy map example for dijkstra

const dijkstra = (graph: Map<number, [number, number][]>, startId: number, endId: number) => {
    const dist = new Map();
    const prev = new Map();
    const visited = new Set();
    const numberComparator: Comparator<[number, number]> = (a: [number, number], b: [number, number]) => {
        return a[1] - b[1];
    };
    // create pq with custom comparator that orders based on shortest distance
    const pq = new PriorityQueue(numberComparator);
    for (let key of graph.keys()) {
        dist.set(key, Infinity);
        prev.set(key, -1);
    }
    dist.set(startId, 0);
    pq.add([startId, 0]);
    while (pq.size) {
        const peek = pq.peek();
        if(!peek) break;
        const  node = peek[0];
        pq.poll();
        if (visited.has(node)) continue;
        visited.add(node);
        for (let [neighbour, weight] of graph.get(node) || []) {
            if (dist.get(neighbour) > dist.get(node) + weight) {
                dist.set(neighbour, dist.get(node) + weight);
                prev.set(neighbour, node);
                pq.add([neighbour, dist.get(neighbour)]);
            }
        }
    }
    let path: number[] = [];
    let node = endId;
    while (node !== -1) {
        path.push(node);
        node = prev.get(node);
    }
    return path.reverse();
}

export {fetchAll, fetchNearby, getPath};