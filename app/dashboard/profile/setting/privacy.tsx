import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../../../context/ThemeContext';

// The Markdown content remains the same
const privacyPolicyMarkdown = `
This privacy policy applies to the InTra: Insight Travelling Planner Application app (hereby referred to as "InTra") for mobile devices that was created by Chawanakorn Sanannam and Thanaphat Sanngoen (hereby referred to as "Service Provider") as a Free service. This service is intended for use "AS IS".

## Information Collection and Use

The Application collects information when you download and use it. This information may include information such as

*   Your device's Internet Protocol address (e.g. IP address)
*   The pages of the Application that you visit, the time and date of your visit, the time spent on those pages
*   The time spent on the Application
*   The operating system you use on your mobile device

The Application does not gather precise information about the location of your mobile device.

The Application collects your device's location, which helps the Service Provider determine your approximate geographical location and make use of in below ways:

*   Geolocation Services: The Service Provider utilizes location data to provide features such as personalized content, relevant recommendations, and location-based services.
*   Analytics and Improvements: Aggregated and anonymized location data helps the Service Provider to analyze user behavior, identify trends, and improve the overall performance and functionality of the Application.
*   Third-Party Services: Periodically, the Service Provider may transmit anonymized location data to external services. These services assist them in enhancing the Application and optimizing their offerings.

The Service Provider may use the information you provided to contact you from time to time to provide you with important information, required notices and marketing promotions.

For a better experience, while using the Application, the Service Provider may require you to provide us with certain personally identifiable information. The information that the Service Provider request will be retained by them and used as described in this privacy policy.

## Third Party Access

Only aggregated, anonymized data is periodically transmitted to external services to aid the Service Provider in improving the Application and their service. The Service Provider may share your information with third parties in the ways that are described in this privacy statement.

Please note that the Application utilizes third-party services that have their own Privacy Policy about handling data. Below are the links to the Privacy Policy of the third-party service providers used by the Application:

*   [Google Analytics for Firebase](https://firebase.google.com/support/privacy)
*   [Expo](https://expo.io/privacy)

The Service Provider may disclose User Provided and Automatically Collected Information:

*   as required by law, such as to comply with a subpoena, or similar legal process;
*   when they believe in good faith that disclosure is necessary to protect their rights, protect your safety or the safety of others, investigate fraud, or respond to a government request;
*   with their trusted services providers who work on their behalf, do not have an independent use of the information we disclose to them, and have agreed to adhere to the rules set forth in this privacy statement.

## Opt-Out Rights

You can stop all collection of information by the Application easily by uninstalling it. You may use the standard uninstall processes as may be available as part of your mobile device or via the mobile application marketplace or network.

## Data Retention Policy

The Service Provider will retain User Provided data for as long as you use the Application and for a reasonable time thereafter. If you'd like them to delete User Provided Data that you have provided via the Application, please contact them at chawanakorn_s@cmu.ac.th and they will respond in a reasonable time.

## Children

The Service Provider does not use the Application to knowingly solicit data from or market to children under the age of 13.

The Application does not address anyone under the age of 13. The Service Provider does not knowingly collect personally identifiable information from children under 13 years of age. In the case the Service Provider discover that a child under 13 has provided personal information, the Service Provider will immediately delete this from their servers. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact the Service Provider (chawanakorn_s@cmu.ac.th) so that they will be able to take the necessary actions.

## Security

The Service Provider is concerned about safeguarding the confidentiality of your information. The Service Provider provides physical, electronic, and procedural safeguards to protect information the Service Provider processes and maintains.

## Changes

This Privacy Policy may be updated from time to time for any reason. The Service Provider will notify you of any changes to the Privacy Policy by updating this page with the new Privacy Policy. You are advised to consult this Privacy Policy regularly for any changes, as continued use is deemed approval of all changes.

This privacy policy is effective as of 2025-09-04

## Your Consent

By using the Application, you are consenting to the processing of your information as set forth in this Privacy Policy now and as amended by us.

## Contact Us

If you have any questions regarding privacy while using the Application, or have questions about the practices, please contact the Service Provider via email at chawanakorn_s@cmu.ac.th.
`;

export default function PrivacyPolicyScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    // Custom styles for the Markdown content, using your theme's colors
    const markdownStyles = StyleSheet.create({
        heading1: {
            color: colors.text,
            fontSize: 32,
            fontWeight: 'bold',
            marginBottom: 10,
            marginTop: 5,
            borderBottomWidth: 1,
            borderBottomColor: colors.cardBorder,
            paddingBottom: 10,
        },
        heading2: {
            color: colors.text,
            fontSize: 24,
            fontWeight: '600',
            marginBottom: 8,
            marginTop: 20,
        },
        body: {
            color: colors.text,
            fontSize: 16,
            lineHeight: 24, // Increased line height for better readability
        },
        link: {
            color: colors.primary, // Use your theme's primary color for links
            textDecorationLine: 'underline',
        },
        bullet_list: {
            marginBottom: 15,
        },
        list_item: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 8,
        },
        paragraph: {
            marginTop: 0,
            marginBottom: 16,
        },
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Apply the custom styles to the Markdown component */}
                <Markdown style={markdownStyles}>
                    {privacyPolicyMarkdown}
                </Markdown>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: Platform.OS === 'android' ? 30 : 0 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 6,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
});