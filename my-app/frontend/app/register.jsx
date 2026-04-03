import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import PicnicBackground from '../components/PicnicBackground';
 
export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userNameAvailable, setUserNameAvailable] = useState(null);

const checkUserName = async (name) => {
  if (name.trim().length < 3) {
    setUserNameAvailable(null);
    return;
  }

  const { data } = await supabase
    .from('users')
    .select('display_name')
    .eq('display_name', name.trim())
    .maybeSingle();

  setUserNameAvailable(!data); // true if no match found
};

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!supabase) {
      setError('Supabase is not configured. Add your .env keys and restart Expo.');
      return;
    }

    setError('');
    setIsLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!userNameAvailable) {
        setError('Please choose an available username.');
          return;
}

    const { error: profileError } = await supabase
    .from('users')
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      display_name: userName.trim(),
    })
    .eq('user_id', data.user.id);

    setIsLoading(false);

    if (profileError) {
      setError('Account created, but failed to save profile info: ' + profileError.message);
      return;
    }

    router.replace('/');
  };

  return (
    <View style={{ flex: 1 }}>
      <PicnicBackground />
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up with your email.</Text>

        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
          autoCapitalize="words"
          placeholderTextColor="#888"
          style={styles.input}
        />
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last Name"
          autoCapitalize="words"
          placeholderTextColor="#888"
          style={styles.input}
        />
        <TextInput
        value={userName}
        onChangeText={(text) => {
          setUserName(text);
          checkUserName(text);
        }}
        placeholder="User Name"
        autoCapitalize="none"  // usernames shouldn't auto-capitalize
        placeholderTextColor="#888"
        style={styles.input}
      />
      {userName.length >= 3 && (
        <Text style={{ 
          color: userNameAvailable ? 'green' : 'red', 
          alignSelf: 'flex-start',
          fontFamily: 'Gaegu',
          fontSize: 14,
          marginBottom: 6,
        }}>
          {userNameAvailable ? 'Username available' : 'Username taken'}
        </Text>
)}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
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
        <Pressable style={styles.button} onPress={handleRegister} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? 'Creating...' : 'Create Account'}</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => router.replace('/')}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Gafata',
    fontSize: 52,
    color: '#1a1a1a',
    letterSpacing: 3,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Gaegu',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
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
    marginBottom: 12,
    fontSize: 14,
    alignSelf: 'flex-start',
  },
  button: {
    width: '58%',
    height: 48,
    borderRadius: 6,
    borderWidth: 2,
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
});
