import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import PicnicBackground from '../components/PicnicBackground';
 
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userNameAvailable, setUserNameAvailable] = useState(null);

  const normalizedUsernamePreview = userName.trim().toLowerCase();
  const usernamePatternOk = USERNAME_REGEX.test(normalizedUsernamePreview);

const checkUserName = async (name) => {
  const normalized = name.trim().toLowerCase();
  if (!USERNAME_REGEX.test(normalized)) {
    setUserNameAvailable(null);
    return;
  }

  if (!supabase) {
    setUserNameAvailable(null);
    return;
  }

  const { data } = await supabase
    .from('users')
    .select('username')
    .eq('username', normalized)
    .maybeSingle();

  setUserNameAvailable(!data); // true if no match found
};

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    if (!userName.trim()) {
      setError('Please choose a username.');
      return;
    }

    const normalizedUsername = userName.trim().toLowerCase();
    if (!USERNAME_REGEX.test(normalizedUsername)) {
      setError('Username must be 3-20 characters: lowercase letters, numbers, or underscores.');
      return;
    }

    if (userNameAvailable !== true) {
      setError('Please choose an available username.');
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

    const displayNameFromName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ').trim();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: normalizedUsername,
        },
      },
    });

    if (signUpError) {
      setIsLoading(false);
      setError(signUpError.message);
      return;
    }

    if (!data?.user?.id) {
      setIsLoading(false);
      setError('Could not create account. Check your email confirmation settings.');
      return;
    }

    const { error: profileError } = await supabase
      .from('users')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: normalizedUsername,
        ...(displayNameFromName ? { display_name: displayNameFromName } : {}),
        email: email.trim(),
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
      {usernamePatternOk && userNameAvailable !== null && (
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
