import { Image, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }}
        style={styles.backgroundImage}
      >
        {/* Top right menu button */}
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuDots}>⋯</Text>
        </TouchableOpacity>

        {/* Profile photo */}
        <View style={styles.profilePhotoContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80' }}
            style={styles.profilePhoto}
          />
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>Profile</Text>
          
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <View style={styles.aboutTextContainer}>
              <Text style={styles.aboutText}>
                My name is John Doe, I am from United Kingdom,{"\n"}
                I love hiking and cultural attraction, currently am{"\n"}
                travelling in Chiang Mai!
              </Text>
            </View>
          </View>
          
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Full Name:</Text>
              <Text style={styles.detailValue}>John Doe</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of Birth:</Text>
              <Text style={styles.detailValue}>1/1/1987</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender:</Text>
              <Text style={styles.detailValue}>Male</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email Address:</Text>
              <Text style={styles.detailValue}>johndoe@gmail.com</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Password:</Text>
              <Text style={styles.detailValue}>••••••••••••••••</Text>
            </View>
          </View>
        </View>


      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(138, 43, 226, 0.8)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  menuDots: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
  },
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    flex: 1,
    marginBottom: 20,
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  aboutSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  aboutTextContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  detailsSection: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },

});