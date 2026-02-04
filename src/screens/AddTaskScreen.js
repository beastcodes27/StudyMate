import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_STORAGE_KEY = '@tasks_list';

const AddTaskScreen = ({ navigation }) => {
    const { theme } = useTheme();

    // State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Study');
    const [customCategory, setCustomCategory] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const categories = ['Study', 'Project', 'Exam', 'Exercise', 'Other'];
    const priorities = ['Low', 'Medium', 'High'];

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || dueDate;
        setShowDatePicker(false);
        setDueDate(currentDate);
    };

    const handleSaveTask = async () => {
        if (!title.trim()) {
            Alert.alert('Validation', 'Task title is required');
            return;
        }

        if (category === 'Other' && !customCategory.trim()) {
            Alert.alert('Validation', 'Please specify your custom category');
            return;
        }

        setIsSaving(true);
        try {
            const finalCategory = category === 'Other' ? customCategory : category;

            const newTask = {
                id: Date.now().toString(),
                title,
                description,
                category: finalCategory,
                priority,
                dueDate: dueDate.toISOString(),
                completed: false,
                createdAt: new Date().toISOString()
            };

            const existingTasksJson = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
            let tasks = existingTasksJson ? JSON.parse(existingTasksJson) : [];
            tasks.unshift(newTask); // Add new task to the beginning

            await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));

            setShowSuccessPopup(true);
        } catch (e) {
            Alert.alert('Error', 'Failed to save task');
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const Selector = ({ label, options, currentSelection, onSelect }) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
            <View style={styles.selectorContainer}>
                {options.map(option => (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.selectorOption,
                            { borderColor: theme.colors.border },
                            currentSelection === option && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                        ]}
                        onPress={() => onSelect(option)}
                    >
                        <Text style={[
                            styles.selectorText,
                            { color: theme.colors.text },
                            currentSelection === option && { color: '#FFF' }
                        ]}>{option}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.content}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Title</Text>
                        <TextInput
                            style={[styles.input, {
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                                backgroundColor: theme.colors.card
                            }]}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="What needs to be done?"
                            placeholderTextColor="gray"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, {
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                                backgroundColor: theme.colors.card
                            }]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Add more details..."
                            placeholderTextColor="gray"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <Selector
                        label="Category"
                        options={categories}
                        currentSelection={category}
                        onSelect={setCategory}
                    />

                    {category === 'Other' && (
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>Custom Category</Text>
                            <TextInput
                                style={[styles.input, {
                                    color: theme.colors.text,
                                    borderColor: theme.colors.border,
                                    backgroundColor: theme.colors.card
                                }]}
                                value={customCategory}
                                onChangeText={setCustomCategory}
                                placeholder="Enter custom category"
                                placeholderTextColor="gray"
                            />
                        </View>
                    )}

                    <Selector
                        label="Priority"
                        options={priorities}
                        currentSelection={priority}
                        onSelect={setPriority}
                    />

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Due Date</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={[styles.input, {
                                borderColor: theme.colors.border,
                                backgroundColor: theme.colors.card,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }]}
                        >
                            <Text style={{ color: theme.colors.text }}>
                                {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={dueDate}
                                mode="datetime"
                                is24Hour={true}
                                display="default"
                                onChange={onDateChange}
                            />
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                        onPress={handleSaveTask}
                        disabled={isSaving}
                    >
                        <Text style={styles.saveButtonText}>
                            {isSaving ? 'Saving...' : 'Create Task'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Success Popup Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showSuccessPopup}
                onRequestClose={() => setShowSuccessPopup(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={[styles.successCard, { backgroundColor: theme.colors.card }]}>
                        <View style={[styles.successIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                            <Ionicons name="checkmark-done" size={50} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.successTitle, { color: theme.colors.text }]}>Task Created!</Text>
                        <Text style={[styles.successMessage, { color: theme.colors.text, opacity: 0.7 }]}>
                            Your task "{title}" has been successfully added to your list.
                        </Text>
                        <TouchableOpacity
                            style={[styles.closePopupButton, { backgroundColor: theme.colors.primary }]}
                            onPress={() => {
                                setShowSuccessPopup(false);
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.closePopupButtonText}>Awesome!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
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
        height: 80,
        textAlignVertical: 'top',
    },
    selectorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    selectorOption: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderRadius: 20,
        margin: 5,
        minWidth: 70,
        alignItems: 'center',
    },
    selectorText: {
        fontSize: 14,
        fontWeight: '500',
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successCard: {
        width: '100%',
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    successIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    successMessage: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    closePopupButton: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    closePopupButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AddTaskScreen;
