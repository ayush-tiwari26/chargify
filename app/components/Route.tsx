import {Button, View} from 'react-native'
import {useState} from "react";
import {GoogleMapsLocationInput} from "./GoogleMapsLocationInput";
import MapView, {Marker} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {StationMarker} from "./icons/StationMarker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const Route = () => {
    const [from, setFrom] = useState<any>();
    const [to, setTo] = useState<any>();
    const [route, setRoute] = useState<any[]>();
    let maxLat = 0;
    let minLat = 0;
    let maxLong = 0;
    let minLong = 0;

    if (route) {
        maxLat = Math.max(...route.map((location) => location.latitude));
        minLat = Math.min(...route.map((location) => location.latitude));
        maxLong = Math.max(...route.map((location) => location.longitude));
        minLong = Math.min(...route.map((location) => location.longitude));
    }

    return <View>
        <GoogleMapsLocationInput onLocationSelected={setFrom} placeholder={"From"}/>
        <GoogleMapsLocationInput onLocationSelected={setTo} placeholder={"To"}/>
        <View style={{
            padding: 10
        }}>
            <Button disabled={!from || !to} title={"Get Route"} onPress={async () => {
                const fromLocation = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?place_id=${from.place_id}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`);
                const fromLocationData = await fromLocation.json();
                const toLocation = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?place_id=${to.place_id}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`);
                const toLocationData = await toLocation.json();
                const token = await AsyncStorage.getItem('token');
                const newRoute = await fetch(`https://charging-locator.onrender.com/evstation/path`,{
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        source:{
                            latitude: fromLocationData.results[0].geometry.location.lat,
                            longitude: fromLocationData.results[0].geometry.location.lng
                        }, destination: {
                            latitude: toLocationData.results[0].geometry.location.lat,
                            longitude: toLocationData.results[0].geometry.location.lng
                        }
                    })
                });
                const newRouteData = await newRoute.json();
                console.log(newRouteData)
                setRoute(newRouteData)
            }}/>
        </View>
        {
            route && <MapView style={{height: 400}} region={{
                latitude: (maxLat + minLat + route[0].latitude) / 3,
                longitude: (maxLong + minLong + route[0].longitude) / 3,
                latitudeDelta: Math.min(maxLat - minLat, 1),
                longitudeDelta: Math.min(maxLong - minLong, 1)
            }}>
                {
                    route.slice(1).map((location, index) => {
                        return <MapViewDirections
                            key={index}
                            origin={route[index]}
                            destination={location}
                            apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}
                            strokeWidth={3}
                        />
                    })
                }
                {
                    route.slice(1, route.length - 1).map((location, index) => {
                        return <Marker key={index} coordinate={location}>
                            <View style={{width: 40, height: 56}}>
                                <StationMarker/>
                            </View>
                        </Marker>
                    })
                }
            </MapView>
        }
    </View>
}