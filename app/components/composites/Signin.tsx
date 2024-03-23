import {useState} from "react";
import {Button, View} from "react-native";
import {CustomTextInput} from "../base/CustomTextInput";

export const Signin = (
    {
        onSignin,
    }:{
        onSignin: (token: string) => void
    }) => {
    const [email, setEmail] = useState<string>();
    const [password, setPassword] = useState<string>();
    return <View>
        <CustomTextInput placeholder={"Email"} onChangeText={setEmail}/>
        <CustomTextInput placeholder={"Password"} onChangeText={setPassword}/>
        <Button title={"Sign In"} onPress={async () => {
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
                onSignin(data.token);
            }
        }}/>
    </View>
}