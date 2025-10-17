import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import React, { useState, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { getApp } from 'firebase/app';

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const recaptchaVerifier = useRef<any>(null);

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const fullPhoneNumber = `+91${phoneNumber}`;

      if (Platform.OS === 'web') {
        // Web: Use RecaptchaVerifier
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 
          size: 'invisible' 
        });
        const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
        setConfirmation(confirmationResult);
        Alert.alert('Success', 'OTP sent to your phone number!');
      } else {
        // Mobile: Use Firebase Recaptcha Verifier Modal
        const phoneProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneProvider.verifyPhoneNumber(
          fullPhoneNumber,
          recaptchaVerifier.current
        );
        setVerificationId(verificationId);
        Alert.alert('Success', 'OTP sent to your phone number!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
      console.error('Firebase Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS === 'web' && confirmation) {
        // Web verification
        const userCredential = await confirmation.confirm(otpCode);
        console.log('User signed in successfully!', userCredential.user);
        Alert.alert('Success!', 'You have been signed in.');
      } else if (verificationId) {
        // Mobile verification
        const credential = PhoneAuthProvider.credential(verificationId, otpCode);
        const userCredential = await signInWithCredential(auth, credential);
        console.log('User signed in successfully!', userCredential.user);
        Alert.alert('Success!', 'You have been signed in.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Invalid OTP code. Please try again.');
      console.error('Firebase Verification Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Web reCAPTCHA container */}
      {Platform.OS === 'web' && <View id="recaptcha-container"></View>}
      
      {/* Mobile reCAPTCHA modal */}
      {Platform.OS !== 'web' && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={getApp().options}
          attemptInvisibleVerification={true}
        />
      )}
      
      <Text style={styles.title}>Welcome</Text>
      
      {!confirmation && !verificationId ? (
        <>
          <Text style={styles.subtitle}>Enter your phone number to begin</Text>
          <TextInput
            style={styles.input}
            placeholder="9876543210"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={10}
          />
          <Button 
            title={loading ? 'Sending...' : 'Send OTP'} 
            onPress={handleSendOTP} 
            disabled={loading} 
          />
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Enter the OTP sent to your number</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            keyboardType="number-pad"
            value={otpCode}
            onChangeText={setOtpCode}
            maxLength={6}
          />
          <Button 
            title={loading ? 'Verifying...' : 'Verify OTP'} 
            onPress={handleVerifyOTP} 
            disabled={loading} 
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LoginScreen;