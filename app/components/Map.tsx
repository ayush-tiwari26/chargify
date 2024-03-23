import {ToastAndroid, View} from "react-native";
import MapView, {Marker} from "react-native-maps";
import * as Location from 'expo-location';
import {useEffect, useState} from "react";
import {UserMarker} from "./icons/UserMarker";
import {StationMarker} from "./icons/StationMarker";
import {StationDescription} from "./composites/StationDescription";
import MapViewDirections from 'react-native-maps-directions';

export const Map = () => {
    const [location, setLocation] = useState<Location.LocationObject>();
    const [errorLocation, setErrorLocationMessage] = useState<string>();
    const [allLocations, setAllLocations] = useState<any[]>([]);
    const [nearestLocations, setNearestLocations] = useState<any[]>([])
    const [selectedLocation, setSelectedLocation] = useState<any>();
    const [directionCoordinates, setDirectionCoordinates] = useState<any[]>([]);
    useEffect(() => {
        if (errorLocation) {
            ToastAndroid.show(errorLocation, ToastAndroid.LONG);
        }
    }, [errorLocation])
    useEffect(() => {
        fetch('https://charging-locator.onrender.com/evstation/all').then(async (response) => {
            const data = await response.json();
            setAllLocations(data);
        })
    }, []);
    useEffect(() => {
        (async () => {
            let {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorLocationMessage('Permission to access location was denied');
                return;
            }
            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();
    }, [])

    return <View>
        <MapView
            style={{height: '100%'}}
            region={{
                latitude: location?.coords.latitude || 37.78825,
                longitude: location?.coords.longitude || -122.4324,
                latitudeDelta: 0.02,
                longitudeDelta: 0.01,
            }}
            onRegionChange={(region) => {
                const top = region.latitude + region.latitudeDelta;
                const bottom = region.latitude - region.latitudeDelta;
                const left = region.longitude - region.longitudeDelta;
                const right = region.longitude + region.longitudeDelta;
                const shownLocations = allLocations.filter((location: any) => {
                    return location.latitude < top && location.latitude > bottom && location.longitude > left && location.longitude < right;
                })
                setNearestLocations(shownLocations);
            }}
            onPress={() =>{
                setSelectedLocation(undefined);
            }}
        >
            {
                location &&
                <Marker coordinate={{
                    latitude: location?.coords.latitude,
                    longitude: location?.coords.longitude,
                }}>
                    <View style={{width: 40, height: 56}}>
                        <UserMarker/>
                    </View>
                </Marker>
            }
            {
                nearestLocations.map((nearestLocation, index) => {
                    return <Marker
                        key={index} coordinate={{
                        latitude: nearestLocation.latitude,
                        longitude: nearestLocation.longitude,
                    }}
                        title={nearestLocation.name +' : ' + Math.floor(1 + Math.random()*4) +' User(s)'}
                        description={nearestLocation.address }
                        onCalloutPress={() => {
                            setSelectedLocation(nearestLocation);
                        }}
                    >
                        <View style={{width: 40, height: 56}}>
                            <StationMarker/>
                        </View>
                    </Marker>
                })
            }
            {
                (selectedLocation && location) && <MapViewDirections
                    origin={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    }}
                    destination={{
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                    }}
                    apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}
                    strokeWidth={3}
                    strokeColor="blue"
                />
            }
        </MapView>

        {
            selectedLocation && <StationDescription station={selectedLocation}/>
        }
    </View>
}