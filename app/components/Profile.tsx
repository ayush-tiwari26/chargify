import {useEffect, useState} from "react";
import {Signup} from "./composites/Signup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Button, Pressable, Text, View} from "react-native";
import {Signin} from "./composites/Signin";

export const Profile = () => {
    const [token, setToken] = useState<string>();
    const [mode, setMode] = useState<'signup' | 'signin'>('signup');
    const [user, setUser] = useState<any>();
    useEffect(() => {
        AsyncStorage.getItem('token').then((token) => {
            if (token) setToken(token);
        });
    }, []);
    useEffect(() => {
        fetch('https://charging-locator.onrender.com/user', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(async (response) => {
            const data = await response.json();
            setUser(data);
        });
    }, [token]);

    return <>
        {
            !token && <View style={{
                margin: 20,
            }}>
                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    <Pressable
                        style={{
                            padding: 10,
                            backgroundColor: mode === 'signup' ? '#2089DC' : 'white',
                            width: 150,
                        }}
                        disabled={mode === 'signup'}
                        onPress={() => {
                            setMode('signup')
                        }}>
                        <Text style={{
                            color: mode === 'signup' ? 'white' : 'black',
                            textAlign: 'center'
                        }}>Sign Up</Text>
                    </Pressable>
                    <Pressable
                        style={{
                            padding: 10,
                            width: 150,
                            backgroundColor: mode === 'signin' ? '#2089DC' : 'white'
                        }}
                        disabled={mode === 'signin'}
                        onPress={() => {
                            setMode('signin')
                        }}>
                        <Text style={{
                            color: mode === 'signin' ? 'white' : 'black',
                            textAlign: 'center'
                        }}>Sign In</Text>
                    </Pressable>
                </View>
                <View>
                    {
                        mode === 'signup' && <Signup onSignup={async (token) => {
                            setToken(token);
                            await AsyncStorage.setItem('token', token);
                        }}/>
                    }
                    {
                        mode === 'signin' && <Signin onSignin={async (token) => {
                            setToken(token);
                            await AsyncStorage.setItem('token', token);
                        }}/>
                    }
                </View>
            <View style={{
                marginTop: 20
            }}>
            <Button title={"Login as Guest"} onPress={async () => {
                const email = 'Ayush@gmail.com';
                const password = 'ayushhappy';
                const response = await fetch('https://charging-locator.onrender.com/user/signin',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    })
                const data = await response.json();
                if (data.token) {
                    setToken(data.token);
                    await AsyncStorage.setItem('token', data.token);
                }
            }} />
            </View>
            </View>
        }
        {
            user && <View style={{
                margin: 20
            }}>
                <Text>Hi, {user.name}</Text>
                <Text>Hope you enjoy this app</Text>
            </View>
        }
    </>
}