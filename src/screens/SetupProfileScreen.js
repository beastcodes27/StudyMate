import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';

const STORAGE_KEY = '@user_profile';

const SetupProfileScreen = ({ onComplete }) => {
    const { theme } = useTheme();
    const [username, setUsername] = useState('');
    const [dob, setDob] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Image state
    const [imageUri, setImageUri] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            handleImageUpload(result.assets[0].base64);
        }
    };

    const handleImageUpload = async (base64Image) => {
        setIsUploading(true);
        const data = new FormData();
        data.append('image', base64Image);

        try {
            const response = await fetch('https://api.imgbb.com/1/upload?key=cfe7185111917029d548b5462fb64d51', {
                method: 'POST',
                body: data,
            });

            const json = await response.json();
            if (json.success) {
                setImageUri(json.data.url);
            } else {
                Alert.alert('Upload Failed', 'Could not upload image');
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while uploading. Please check your connection.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!username.trim()) {
            Alert.alert('Missing Name', 'Please enter your username to continue.');
            return;
        }
        if (!gender) {
            Alert.alert('Gender Required', 'Please select your gender.');
            return;
        }

        setIsSaving(true);
        try {
            const profile = {
                username,
                dob: dob.toISOString(),
                gender,
                age: calculateAge(dob).toString(),
                bio: '',
                imageUri: imageUri,
                createdAt: new Date().toISOString()
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
            onComplete();
        } catch (e) {
            Alert.alert('Error', 'Something went wrong while saving your profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const calculateAge = (birthDate) => {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || dob;
        setShowDatePicker(false);
        setDob(currentDate);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Complete Your Profile</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.text, opacity: 0.7 }]}>
                        This helps us personalize your StudyMate journey.
                    </Text>
                </View>

                {/* Profile Image Picker */}
                <View style={styles.imageContainer}>
                    <TouchableOpacity onPress={pickImage} disabled={isUploading || isSaving}>
                        <View style={[styles.imageWrapper, { borderColor: theme.colors.primary, backgroundColor: theme.colors.card }]}>
                            {isUploading ? (
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            ) : imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.profileImage} />
                            ) : (
                                <View style={styles.placeholderContainer}>
                                    <Ionicons name="camera-outline" size={40} color={theme.colors.primary} />
                                    <Text style={[styles.photoLabel, { color: theme.colors.primary }]}>Add Photo</Text>
                                </View>
                            )}
                            {imageUri && !isUploading && (
                                <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
                                    <Ionicons name="pencil" size={14} color="#FFF" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.optionalText, { color: theme.colors.text, opacity: 0.5 }]}>Optional</Text>
                </View>

                <View style={styles.form}>
                    {/* Username Input */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                            <Ionicons name="person-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="What should we call you?"
                                value={username}
                                onChangeText={setUsername}
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    {/* DOB Input */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Birthday</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={[styles.datePickerButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                        >
                            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                            <Text style={[styles.dateText, { color: theme.colors.text }]}>
                                {dob.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={dob}
                                mode="date"
                                display="default"
                                maximumDate={new Date()}
                                onChange={onChangeDate}
                            />
                        )}
                    </View>

                    {/* Gender Input */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Gender</Text>
                        <View style={styles.genderContainer}>
                            {['Male', 'Female', 'Other'].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.genderOption,
                                        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                                        gender === option && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                                    ]}
                                    onPress={() => setGender(option)}
                                >
                                    <Text style={[
                                        styles.genderText,
                                        { color: theme.colors.text },
                                        gender === option && { color: '#FFF' }
                                    ]}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
                    onPress={handleSave}
                    disabled={isSaving || isUploading}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Get Started</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 25,
        paddingTop: 60,
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    imageWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
        position: 'relative',
    },
    profileImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
    },
    placeholderContainer: {
        alignItems: 'center',
    },
    photoLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 5,
    },
    editBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    optionalText: {
        fontSize: 12,
        marginTop: 8,
        fontWeight: '600',
    },
    form: {
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1.5,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1.5,
    },
    dateText: {
        fontSize: 15,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    genderOption: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    genderText: {
        fontSize: 14,
        fontWeight: '700',
    },
    button: {
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: 30,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
});

export default SetupProfileScreen;
