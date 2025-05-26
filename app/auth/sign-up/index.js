import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { auth } from './../../../configs/FirebaseConfig';



export default function SignUp() {
    const navigation=useNavigation();
    const router=useRouter();
    
    const [email,setEmail] = useState();
    const [password,setPassword] = useState();
    const [fullName,setFullName] = useState();
   

    useEffect(()=>{
        navigation.setOptions({
            headerShown:false
        })
    },[]);


    const OnCreateAccount =()=>{

        if(!email&&!password&&!fullName)
            {
                ToastAndroid.show('Please enter all details',ToastAndroid.LONG)
                return ;
            }

            
        createUserWithEmailAndPassword(auth,email,password)
  .then((userCredential) => {
    // Signed up 
    const user = userCredential.user;
    console.log(user);
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log("--",errorMessage,errorCode);
    // ..
  });
    }

    return (
        <View
        style ={{
            padding:25,
            paddingTop:50,
            backgroundColor:Colors.BLUE,
           height:'100%'
        }}>
            <TouchableOpacity onPress= {()=>router.back()}>
                <Ionicons name="arrow-back" size={24} color="white" />  
            </TouchableOpacity>
            <Text  style={{
                fontFamily:'outfit-bold',
                color:Colors.WHITE,
                fontSize:30,
                marginTop:30
            }} >Create Account</Text>

            <View  style = {{
                marginTop:50
            }} >
                <Text style = {{
                    fontFamily:'outfit',
                    color:Colors.WHITE,
                }}> Full Name </Text>
                <TextInput
                style ={style.input} 
                placeholder='Enter Full Name '
                onChangeText={(value) => setFullName(value)}
                />
            </View> 

            <View  style = {{
                marginTop:20
            }} >
                <Text style = {{
                    fontFamily:'outfit',
                    color:Colors.WHITE
                }}> Email </Text>
                <TextInput
                style ={style.input} 
                placeholder='Enter Email'
                onChangeText={(value) => setEmail(value)}/>
            </View> 

            <View  style = {{
                marginTop:20
            }} >
                <Text style = {{
                    fontFamily:'outfit',
                    color:Colors.WHITE
                }}> Password </Text>
                <TextInput
                secureTextEntry={true}
                style ={style.input} 
                placeholder='Enter Password'
                onChangeText={(value) => setPassword(value)}/>
            </View> 

             {/*Create Account Button */}
             <TouchableOpacity  onPress={OnCreateAccount} style = {{
                padding:15,
                backgroundColor:Colors.PRIMARY,
                borderRadius:15,
                marginTop:50,
                borderWidth:1
            }}>
                <Text  style ={{
                    fontFamily:'outfit',
                    color:Colors.WHITE,
                    textAlign:'center',

                }}>Create Account</Text>
                </TouchableOpacity>
            {/*Sign in Button */}
            <TouchableOpacity 
            onPress={()=> router.replace('auth/sign-in')}
             style = {{
                padding:15,
                borderRadius:15,
                marginTop:20,
                borderWidth:1,
                borderColor:Colors.WHITE
            }}>
                <Text  style ={{
                    fontFamily:'outfit',
                    color:Colors.WHITE,
                    textAlign:'center',

                }}>Sign In</Text>
            </TouchableOpacity>

        </View>
    )
}

const style = StyleSheet.create({
    input:{
        padding:15,
        borderWidth:1,
        borderRadius:15,
        borderColor:Colors.GRAY,
        fontFamily:'outfit'

    }
})