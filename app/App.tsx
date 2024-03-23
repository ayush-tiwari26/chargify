import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Map} from './components/Map';
import {Route} from "./components/Route";
import {Profile} from "./components/Profile";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {SafeAreaView} from "react-native";

const Tab = createBottomTabNavigator();
export default function App() {
    React.useEffect(() => {
        AsyncStorage.setItem('token', '')
    }, [])
    return (
        <SafeAreaView>
        <NavigationContainer>
            <Tab.Navigator>
                <Tab.Screen name="Map" component={Map} options={{
                    tabBarIcon: ({color, size}) => {
                        return <Ionicons name="map" size={size} color={color}/>
                    }
                }} />
                <Tab.Screen name="Route" component={Route} options={{
                    tabBarIcon: ({color, size}) => {
                        return <Ionicons name="navigate" size={size} color={color}/>
                    }
                }}/>
                <Tab.Screen name="Profile" component={Profile} options={{
                    tabBarIcon: ({color, size}) => {
                        return <Ionicons name="person" size={size} color={color}/>
                    }
                }} />
            </Tab.Navigator>
        </NavigationContainer>
        </SafeAreaView>
    );
}
