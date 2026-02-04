import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const STORAGE_KEY = '@user_profile';

const ProfileScreen = () => {
    const { theme } = useTheme();

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Form fields
    const [username, setUsername] = useState('');
    const [age, setAge] = useState('');
    const [dob, setDob] = useState(new Date());
    const [gender, setGender] = useState('');
    const [bio, setBio] = useState('');
    const [imageUri, setImageUri] = useState(null);

    // Load profile on mount
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            if (jsonValue != null) {
                const profile = JSON.parse(jsonValue);
                setUsername(profile.username || '');
                setAge(profile.age || '');
                setDob(profile.dob ? new Date(profile.dob) : new Date());
                setGender(profile.gender || '');
                setBio(profile.bio || '');
                setImageUri(profile.imageUri || null);
                setHasProfile(true);
            } else {
                // If no profile, automatically go to edit mode
                setIsEditing(true);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    };

    const saveProfile = async () => {
        if (!username.trim()) {
            Alert.alert('Validation', 'Username is required');
            return;
        }

        const profile = {
            username,
            age,
            dob: dob.toISOString(),
            gender,
            bio,
            imageUri
        };

        try {
            const jsonValue = JSON.stringify(profile);
            await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
            setHasProfile(true);
            setIsEditing(false);
            Alert.alert('Success', 'Profile saved successfully!');
        } catch (e) {
            Alert.alert('Error', 'Failed to save profile');
        }
    };

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || dob;
        setShowDatePicker(false);
        setDob(currentDate);
    };

    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8, // Slightly reduce quality for faster upload
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            handleImageUpload(result.assets[0].base64);
        }
    };

    const handleImageUpload = async (base64Image) => {
        setUploading(true);
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
                Alert.alert('Upload Failed', 'Could not upload image to ImgBB');
                console.error("ImgBB Error:", json);
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while uploading the image');
            console.error("Upload Error:", error);
        } finally {
            setUploading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        {isEditing ? (hasProfile ? 'Edit Profile' : 'Create Profile') : 'My Profile'}
                    </Text>
                    {hasProfile && !isEditing && (
                        <TouchableOpacity onPress={() => setIsEditing(true)}>
                            <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Image Section */}
                <View style={styles.imageContainer}>
                    <TouchableOpacity onPress={isEditing ? pickImage : null} disabled={!isEditing || uploading}>
                        <View style={[styles.imageWrapper, { borderColor: theme.colors.border }]}>
                            {uploading ? (
                                <ActivityIndicator size="small" color={theme.colors.primary} />
                            ) : imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.profileImage} />
                            ) : (
                                <View style={[styles.placeholderImage, { backgroundColor: theme.colors.card }]}>
                                    <Ionicons name="person" size={60} color={theme.colors.text} />
                                </View>
                            )}
                            {isEditing && !uploading && (
                                <View style={[styles.cameraIcon, { backgroundColor: theme.colors.primary }]}>
                                    <Ionicons name="camera" size={20} color="#FFF" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Form or Display Section */}
                <View style={styles.infoContainer}>
                    {isEditing ? (
                        // EDIT MODE
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>Username</Text>
                                <TextInput
                                    style={[styles.input, {
                                        color: theme.colors.text,
                                        borderColor: theme.colors.border,
                                        backgroundColor: theme.colors.card
                                    }]}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Enter username"
                                    placeholderTextColor="gray"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>Age</Text>
                                <TextInput
                                    style={[styles.input, {
                                        color: theme.colors.text,
                                        borderColor: theme.colors.border,
                                        backgroundColor: theme.colors.card
                                    }]}
                                    value={age}
                                    onChangeText={setAge}
                                    placeholder="Enter age"
                                    placeholderTextColor="gray"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>Date of Birth</Text>
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={[styles.input, {
                                        borderColor: theme.colors.border,
                                        backgroundColor: theme.colors.card,
                                        justifyContent: 'center'
                                    }]}
                                >
                                    <Text style={{ color: theme.colors.text }}>
                                        {dob instanceof Date ? dob.toLocaleDateString() : 'Select Date'}
                                    </Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        testID="dateTimePicker"
                                        value={dob}
                                        mode="date"
                                        display="default"
                                        onChange={onChangeDate}
                                    />
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>Gender</Text>
                                <View style={styles.genderContainer}>
                                    {['Male', 'Female', 'Other'].map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={[
                                                styles.genderOption,
                                                { borderColor: theme.colors.border },
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

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>Bio</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, {
                                        color: theme.colors.text,
                                        borderColor: theme.colors.border,
                                        backgroundColor: theme.colors.card
                                    }]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Tell us about yourself"
                                    placeholderTextColor="gray"
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                                onPress={saveProfile}
                            >
                                <Text style={styles.saveButtonText}>Save Profile</Text>
                            </TouchableOpacity>

                            {hasProfile && (
                                <TouchableOpacity
                                    style={[styles.cancelButton]}
                                    onPress={() => {
                                        setIsEditing(false);
                                        loadProfile(); // Reset changes
                                    }}
                                >
                                    <Text style={{ color: theme.colors.notification }}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        // DISPLAY MODE
                        <View style={styles.centerContent}>
                            <View style={styles.displayItemCentered}>
                                <Text style={[styles.displayText, { color: theme.colors.text, fontSize: 26, fontWeight: 'bold' }]}>{username}</Text>
                                <Text style={[styles.displaySubtext, { color: theme.colors.text, opacity: 0.7 }]}>{bio || 'No bio yet'}</Text>
                            </View>

                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statLabel, { color: theme.colors.primary }]}>Age</Text>
                                    <Text style={[styles.statValue, { color: theme.colors.text }]}>{age || '--'}</Text>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statLabel, { color: theme.colors.primary }]}>Born</Text>
                                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                        {dob instanceof Date ? dob.toLocaleDateString() : dob}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    imageWrapper: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    profileImage: {
        width: 134,
        height: 134,
        borderRadius: 67,
    },
    placeholderImage: {
        width: 134,
        height: 134,
        borderRadius: 67,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        padding: 10,
        borderRadius: 25,
    },
    infoContainer: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    displayItem: {
        marginBottom: 24,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(150,150,150,0.2)',
        paddingBottom: 10,
    },
    displayLabel: {
        fontSize: 14,
        marginBottom: 4,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    displayText: {
        fontSize: 20,
    },
    centerContent: {
        alignItems: 'center',
        marginTop: 10,
    },
    displayItemCentered: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    displaySubtext: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 40,
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    genderOption: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    genderText: {
        fontWeight: 'bold',
        fontSize: 14,
    }
});

export default ProfileScreen;
