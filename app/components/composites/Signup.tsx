import {Button, View} from "react-native";
import {useState} from "react";
import {CustomTextInput} from "../base/CustomTextInput";


export const Signup = (
    {
        onSignup,
    }:{
        onSignup: (token: string) => void
    }) => {
    const [email, setEmail] = useState<string>();
    const [name, setName] = useState<string>();
    const [password, setPassword] = useState<string>();
    return <View>
        <CustomTextInput placeholder={"Email"} onChangeText={setEmail}/>
        <CustomTextInput placeholder={"Name"} onChangeText={setName}/>
        <CustomTextInput placeholder={"Password"} onChangeText={setPassword}/>
        <Button title={"Signup"} onPress={async () => {
            const response = await fetch('https://charging-locator.onrender.com/user/signup',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        name: name,
                        password: password
                    })
                })
            const data = await response.json();
            if (data.token) {
                onSignup(data.token);
            }
        }}/>
    </View>
}