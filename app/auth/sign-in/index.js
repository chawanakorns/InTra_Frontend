import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { auth } from './../../../configs/FirebaseConfig';

export default function SignIn(){
    const navigation = useNavigation();
    const router = useRouter();

    const [email,setEmail] = useState();
    const [password,setPassword] = useState();

    useEffect(()=>{
        navigation.setOptions({
            headerShown:false
        })
    },[]);

    const onSignIn = ()=>{

        if(!email&&!password)
            {
                ToastAndroid.show('Please enter all details',ToastAndroid.LONG)
                return ;
            }

        signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    console.log(user);
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log("--",errorMessage,errorCode);
  });
        
    }
    return(
        <View style = {{
            padding:25,
            paddingTop:50,
            backgroundColor:Colors.BLUE,
           height:'100%'
        }}>
            <TouchableOpacity onPress= {()=>router.back()}>
                <Ionicons name="arrow-back" size={24} color="white" />  
            </TouchableOpacity>
            
            <Text style={{
                fontFamily:'outfit-bold',
                color:Colors.WHITE,
                fontSize:30,
                marginTop:30
            }}> Let's Sign You In</Text>

            <Text style={{
                fontFamily:'outfit',
                fontSize:30,
                color:Colors.GRAY,
                marginTop:20
            }}>Welcome Back</Text>
            
            <Text style={{
                fontFamily:'outfit',
                fontSize:30,
                color:Colors.GRAY,
                marginTop:20
            }}> You've been missed</Text>

          

            <View  style = {{
                marginTop:50
            }} >
                <Text style = {{
                    fontFamily:'outfit' ,
                    color:Colors.WHITE
                }}> Email </Text>
                <TextInput
                style ={style.input} 
                onChangeText={(value)=>setEmail(value)}
                placeholder='Enter Email'/>
            </View> 

            <View  style = {{
                marginTop:30
            }} >
                <Text style = {{
                    fontFamily:'outfit',
                    color:Colors.WHITE
                }}> Password </Text>
                <TextInput
                secureTextEntry={true}
                style ={style.input} 
                onChangeText={(value)=>setPassword(value)}
                placeholder='Enter Password'/>
            </View> 

            {/*Sign in Button */}
            <TouchableOpacity 
            onPress={onSignIn}
             style = {{
                padding:15,
                borderRadius:15,
                marginTop:20,
                borderWidth:1,
                backgroundColor:Colors.PRIMARY,
                
            }}>
                <Text  style ={{
                    fontFamily:'outfit',
                    color:Colors.WHITE,
                    textAlign:'center',

                }}>Sign In</Text>
            </TouchableOpacity>

             {/*Create Account Button */}
            <TouchableOpacity 
            onPress={()=> router.replace('auth/sign-up')}
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

                }}>Create Account</Text>
            </TouchableOpacity>
        </View>
    )
}

const style = StyleSheet.create({
    input:{
        padding:15,
        borderWidth:1,
        borderRadius:15,
        borderColor:Colors.GRAY

    }
})