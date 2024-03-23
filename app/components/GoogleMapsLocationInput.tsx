import {Text, TextInput, View} from "react-native";
import {useEffect, useState} from "react";
import * as Location from "expo-location";

export const GoogleMapsLocationInput = (
    {
        onLocationSelected,
        placeholder
    }: {
        onLocationSelected: (location: any) => void;
        placeholder: string;
    }) => {
    const [location, setLocation] = useState<Location.LocationObject>();
    const [errorLocation, setErrorLocationMessage] = useState<string>();
    const [query, setQuery] = useState<string>('');
    const [places, setPlaces] = useState<any[]>([]);
    const [isFocused, setIsFocused] = useState<boolean>(false);
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

    const getPlaces = async (query: string) => {
        if (!location) {
            return [];
        }
        const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&location=${location.coords.latitude},${location.coords.longitude}&radius=1000&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`);
        const data = await response.json();
        return data.predictions;
    }
    return <View style={{
        paddingHorizontal: 10,
        paddingVertical: 5,
        width: '100%'
    }}>
        <TextInput
            onFocus={() => {
                setIsFocused(true);
            }}
            onBlur={() => {
                setIsFocused(false);
            }}
            onChangeText={(e) => {
                setQuery(e);
                getPlaces(e).then(setPlaces);
            }}
            value={query}
            placeholder={placeholder}
            style={{
                backgroundColor: 'white',
                padding: 10,
                borderColor: 'grey',
                borderWidth: 1
            }}
        />
        {isFocused && <Text
            style={{
                padding: 10,
                backgroundColor: 'white',
                borderBottomColor: 'grey',
                borderBottomWidth: 1
            }}
            onPress={async () => {
                if (!location) {
                    return;
                }
                const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`);
                const data = await response.json();
                onLocationSelected({
                    description: data.results[0].formatted_address,
                    place_id: data.results[0].place_id
                });
                setQuery(data.results[0].formatted_address);
                setPlaces([]);
                setIsFocused(false)
            }}
        >Your current location</Text>}
        {
            isFocused && places.map((place: any) => {
                return <Text
                    style={{
                        padding: 10,
                        backgroundColor: 'white',
                        borderBottomColor: 'grey',
                        borderBottomWidth: 1
                    }} onPress={() => {
                    onLocationSelected(place);
                    setQuery(place.description);
                    setPlaces([]);
                }} key={place.place_id}>{place.description}</Text>
            })
        }
    </View>
}
