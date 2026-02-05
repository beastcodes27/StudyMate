import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
    const { theme, toggleTheme } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    const toggleNotifications = () => setNotificationsEnabled(previousState => !previousState);

    const handleResetData = () => {
        Alert.alert(
            "Reset Data",
            "Are you sure you want to clear all app data? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear();
                            Alert.alert("Success", "App data has been reset.");
                        } catch (e) {
                            Alert.alert("Error", "Failed to reset data.");
                        }
                    }
                }
            ]
        );
    };

    const SettingItem = ({ icon, title, type, value, onValueChange, onPress, color }) => {
        const handlePress = () => {
            if (type === 'toggle' && onValueChange) {
                onValueChange(!value);
            } else if (onPress) {
                onPress();
            }
        };

        return (
            <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
                onPress={handlePress}
                disabled={type === 'text'}
                activeOpacity={0.7}
            >
                <View style={styles.settingLeft}>
                    <Ionicons name={icon} size={24} color={color || theme.colors.text} style={styles.icon} />
                    <Text style={[styles.settingText, { color: color || theme.colors.text }]}>{title}</Text>
                </View>
                {type === 'toggle' && (
                    <Switch
                        trackColor={{ false: "#767577", true: theme.colors.primary }}
                        thumbColor={value ? "#f4f3f4" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={onValueChange}
                        value={value}
                    />
                )}
                {type === 'link' && (
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
                )}
            </TouchableOpacity>
        );
    };

    const SectionHeader = ({ title }) => (
        <Text style={[styles.sectionHeader, { color: theme.colors.primary }]}>{title}</Text>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <SectionHeader title="Appearance" />
                <SettingItem
                    icon="moon"
                    title="Dark Mode"
                    type="toggle"
                    value={theme.isDark}
                    onValueChange={toggleTheme}
                />

                <SectionHeader title="General" />
                <SettingItem
                    icon="notifications"
                    title="Notifications"
                    type="toggle"
                    value={notificationsEnabled}
                    onValueChange={toggleNotifications}
                />

                <SectionHeader title="About" />
                <SettingItem
                    icon="information-circle"
                    title="Version 1.0.0"
                    type="text"
                />
                <SettingItem
                    icon="document-text"
                    title="Terms of Service"
                    type="link"
                    onPress={() => setModalVisible(true)}
                />

                <SectionHeader title="Danger Zone" />
                <SettingItem
                    icon="warning"
                    title="Reset App Data"
                    type="link"
                    color={theme.colors.notification}
                    onPress={handleResetData}
                />
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalView, { backgroundColor: theme.colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Terms of Service</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalContent}>
                            <Text style={[styles.modalText, { color: theme.colors.text }]}>
                                1. Acceptance of Terms{'\n'}
                                By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.{'\n\n'}
                                2. Use License{'\n'}
                                Permission is granted to temporarily download one copy of the materials (information or software) on StudyMate's app for personal, non-commercial transitory viewing only.{'\n\n'}
                                3. Disclaimer{'\n'}
                                The materials on StudyMate's app are provided "as is". StudyMate makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.{'\n\n'}
                                4. Limitations{'\n'}
                                In no event shall StudyMate or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on StudyMate's app.
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 0.5,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 15,
    },
    settingText: {
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalView: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        height: '70%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalContent: {
        flex: 1,
    },
    modalText: {
        fontSize: 14,
        lineHeight: 20,
    },
});

export default SettingsScreen;
