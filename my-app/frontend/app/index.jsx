import { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    router.replace('./home');
  };

  return (
    <ImageBackground
      source={require('../assets/images/Login_Screen.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.loginSection}>
          <Text style={styles.title}>LOGIN</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="User"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#888"
            style={styles.input}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor="#888"
            style={styles.input}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>
        </View>

        <View style={styles.createSection}>
          <Text style={styles.newCrafter}>New Crafter?</Text>

          <Pressable
            style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.createButtonText}>Create Account</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 36,
    paddingBottom: 58,
  },
  loginSection: {
    width: '100%',
    alignItems: 'center',
  },
  createSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 180,
  },
  title: {
    fontFamily: 'Gafata',
    fontSize: 52,
    color: '#1a1a1a',
    letterSpacing: 3,
    marginBottom: 18,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 2,
    borderColor: '#c8940a',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    marginBottom: 10,
    fontFamily: 'Gaegu',
    fontSize: 17,
    color: '#333',
  },
  error: {
    fontFamily: 'Gaegu',
    color: '#DC2626',
    marginBottom: 8,
    fontSize: 15,
    alignSelf: 'flex-start',
  },
  button: {
    width: '58%',
    height: 48,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#c8940a',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonPressed: {
    backgroundColor: '#f5f5f5',
  },
  buttonText: {
    fontFamily: 'Gaegu',
    fontSize: 22,
    color: '#333',
  },
  newCrafter: {
    fontFamily: 'Gaegu',
    fontSize: 20,
    color: '#555',
    marginBottom: 12,
  },
  createButton: {
    width: '84%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#c8940a',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonPressed: {
    backgroundColor: 'rgba(200,148,10,0.08)',
  },
  createButtonText: {
    fontFamily: 'Gaegu',
    fontSize: 22,
    color: '#333',
  },
});
