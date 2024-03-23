import {Button, Pressable, ScrollView, Text, View} from "react-native";
import {useEffect, useState} from "react";
import {CustomTextInput} from "../base/CustomTextInput";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const StationDescription = (
    {
        station
    }: {
        station: any
    }) => {
    const [showRateModal, setShowRateModal] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)
    const [token, setToken] = useState<string>();
    const [reviews, setReviews] = useState<any[]>([]);
    useEffect(() => {
        if (!token) return;
        if (!station) return;
        (async () => {
            const response = await fetch(`https://charging-locator.onrender.com/evstation/rating/${station.id}`, {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            });
            const data = await response.json();
            setReviews(data);
        })()
    }, [station, token]);
    useEffect(() => {
        setShowReportModal(false);
        setShowRateModal(false);
    }, [station]);
    useEffect(() => {
        (async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                setToken(token);
            }
        })();
    }, [])
    return <ScrollView style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        maxHeight: 500,
        minHeight: 300,
    }}>
        <Text style={{
            fontSize: 20,
            fontWeight: 'bold'
        }}>{station.name}</Text>
        <Text style={{
            fontSize: 16,
            color: 'grey'
        }}>{station.address}</Text>
        <Text style={{
            fontSize: 16,
            color: 'grey',
            marginBottom: 5
        }}>{station.city?.toUpperCase()}, {station.state.toUpperCase()}</Text>
        <Text style={{
            fontSize: 16,
            color: 'grey',
            marginBottom: 10
        }}>{station.description}</Text>
        <View style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: 10
        }}>
            <Button title={"Rate it"} onPress={() => {
                setShowReportModal(false);
                setShowRateModal(true);
            }}/>
            <Button title={"Report"} onPress={() => {
                setShowReportModal(true);
                setShowRateModal(false);
            }}/>
        </View>
        {
            showRateModal && <RateModal onRate={(rate, review) => {
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token || ''
                }
                const body = {
                    evStationId: "" + station.id,
                    rating: "" + rate,
                    review: review
                }
                fetch('https://charging-locator.onrender.com/evstation/rate', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                }).then(console.log).catch(console.error)
                setShowRateModal(false);
            }}/>
        }
        {
            reviews.length ? <View style={{
                padding: 10
            }}>
                <Text style={{}}>Reviews: {(reviews.reduce((acc, data)=>acc+data.rating,0))/reviews.length}/5</Text>
                <View style={{
                    borderColor: 'black',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    height: 10,
                    borderRadius: 5,
                }}>
                    <View style={{
                        borderColor: 'yellow',
                        borderWidth: 4,
                        borderRadius: 4,
                        borderStyle: 'solid',
                        width: `${((reviews.reduce((acc, data)=>acc+data.rating,0))/reviews.length)*20}%`
                    }}/>
                </View>
                {
                    reviews.map((review)=>{
                        console.log(review)
                        return <Text style={{
                            borderColor: 'lightgray',
                            borderStyle: 'solid',
                            borderRadius: 2,
                            borderWidth: 1,
                            padding: 5,
                            marginTop: 10
                        }}>
                            {review.review}
                        </Text>
                    })
                }
            </View> : <Text>No reviews yet</Text>
        }
    </ScrollView>
}

const RateModal = (
    {
        onRate
    }: {
        onRate: (rating: number, review: string) => void
    }) => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    return <View style={{
        borderRadius: 10,
        backgroundColor: '#E1E1E1',
        padding: 20,
        marginTop: 20
    }}>
        <View style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
        }}>
            {
                [1, 2, 3, 4, 5].map((star) => {
                    return <Pressable
                        style={{
                            padding: 10,
                            backgroundColor: rating >= star ? 'yellow' : 'white'
                        }}
                        key={star}
                        onPress={() => {
                            setRating(star);
                        }}>
                        <Text>{star}</Text>
                    </Pressable>
                })
            }
        </View>
        <CustomTextInput placeholder={"Add reviews"} onChangeText={setReview} multiline={true}/>
        <Button title={"Submit"} onPress={() => {
            onRate(rating, review);
        }}/>
    </View>
}