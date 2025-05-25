import { Colors } from '@/constants/Colors'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

export default function Login() {
    return (
        <View>
           <Image source = {require('./../assets/images/Index-images.jpg')}
            style={{ 
                width: '100%', 
                height: 400 
            }}
           
        />
        <View style ={styles.container}>

                <Text   Text style = {{
                    fontSize:20,
                    fontFamily:'outfit',
                    color:Colors.WHITE,
                    textAlign:'center',
                    marginTop:20

                }}> Welcome to</Text>


                <Text style = {{
                    fontSize:60,
                    fontFamily:'cinzelDeco-bold',
                    color:Colors.WHITE,
                    textAlign:'center',
                    marginTop:10

                }}> Intra</Text>

                <Text style = {{
                    fontSize:25,
                    fontFamily:'outfit-bold',
                    color:Colors.WHITE,
                    textAlign:'center',
                    
                }}> AI Intra Travel Insight</Text>

                 <Text style = {{
                    fontSize:17,
                    fontFamily:'outfit-medium',
                    color:Colors.GRAY,
                    textAlign:'center',
                    marginTop:20
                }}>Discover Your Journey — Smart Itineraries Designed Just for You.</Text>

                <View style = {styles.button}>
                    <Text style = {{
                    fontSize:20,
                    fontFamily:'outfit',
                    color:Colors.WHITE,
                    textAlign:'center',
                    
                }}>  Let get started! </Text>
                </View>
           </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        backgroundColor: Colors.BLUE,
        marginTop:-20, 
        borderTopLeftRadius:20,
        borderTopRightRadius:20,
        height:'100%'
    },
    button:{
        padding:15,
        backgroundColor:Colors.PRIMARY,
        borderRadius:99,
        marginTop:20,
        

    }
})