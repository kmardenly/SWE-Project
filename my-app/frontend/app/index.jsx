import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Svg, Rect } from 'react-native-svg';
import { supabase } from '@/lib/supabaseClient';
import PicnicBackground from '../components/PicnicBackground';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (!supabase) {
      setError('Supabase is not configured. Add your .env keys and restart Expo.');
      return;
    }

    setError('');
    setIsLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace('/home');
  };

  return (
    // <ImageBackground
    //   source={require('../assets/images/Login_Screen.png')}
    //   style={styles.background}
    //   resizeMode="cover"
    // >
      <View style = {styles.background}>
        <PicnicBackground />
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
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
              </Pressable>
            </View>
            <View style={styles.skipContainer}>
              <Pressable onPress={() => router.replace('/home')}>
                <Text style={styles.skipText}>Skip Login (dev mode) </Text>
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
    </View>
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
    borderColor: '#648aae',
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
    // borderColor: '#c8940a',
    // backgroundColor: '#FFFFFF',
    borderColor: '#348fd9',
    backgroundColor: '#9cdeff',
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
  skipContainer:{
    padding: 10,
    backgroundColor: 'rgba(253, 231, 142, 0.9)',
    borderRadius: 6,
    borderColor: '#c8940a',
    borderWidth: 2,
    marginTop: 20,
  },
  createButton: {
    width: '58%',
    height: 50,
    //backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#348fd9',
    backgroundColor: '#9cdeff',
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
