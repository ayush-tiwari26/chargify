import {TextInput} from "react-native";

export const CustomTextInput = (
    {
        placeholder,
        onChangeText,
        multiline,
    }: {
        placeholder: string,
        onChangeText: (text: string) => void,
        multiline?: boolean
    }) => {
    return <TextInput
        style={{
            borderBottomColor: 'black',
            borderBottomWidth: 1,
            backgroundColor: 'white',
            padding: 10,
            margin: 10
        }}
        placeholder={placeholder} onChangeText={onChangeText}
        multiline={multiline}
    />
}