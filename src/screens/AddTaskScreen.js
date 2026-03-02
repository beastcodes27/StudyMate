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
import * as Notifications from 'expo-notifications';

const TASKS_STORAGE_KEY = '@tasks_list';

// Function to request permissions
async function requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    return finalStatus === 'granted';
}

const AddTaskScreen = ({ navigation, route }) => {
    const { theme } = useTheme();
    const editTask = route.params?.task;

    // State
    const [title, setTitle] = useState(editTask?.title || '');
    const [description, setDescription] = useState(editTask?.description || '');
    const [category, setCategory] = useState(editTask?.category || 'Study');
    const [customCategory, setCustomCategory] = useState('');
    const [priority, setPriority] = useState(editTask?.priority || 'Medium');
    const [startTime, setStartTime] = useState(editTask?.startTime ? new Date(editTask.startTime) : new Date());
    const [endTime, setEndTime] = useState(editTask?.endTime ? new Date(editTask.endTime) : new Date(new Date().getTime() + 3600000));
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const categories = ['Study', 'Project', 'Exam', 'Exercise', 'Other'];
    const priorities = ['Low', 'Medium', 'High'];

    // Dynamic Header Title
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: editTask ? 'Edit Task' : 'Add Task'
        });
    }, [navigation, editTask]);

    // Sync state with route params
    React.useEffect(() => {
        if (editTask) {
            setTitle(editTask.title || '');
            setDescription(editTask.description || '');
            if (categories.includes(editTask.category)) {
                setCategory(editTask.category);
                setCustomCategory('');
            } else {
                setCategory('Other');
                setCustomCategory(editTask.category);
            }
            setPriority(editTask.priority || 'Medium');
            setStartTime(new Date(editTask.startTime));
            setEndTime(new Date(editTask.endTime));
        } else {
            // Reset to defaults for a new task
            setTitle('');
            setDescription('');
            setCategory('Study');
            setCustomCategory('');
            setPriority('Medium');
            const now = new Date();
            // Round to next hour for better UX
            const start = new Date(now.getTime() + 3600000);
            start.setMinutes(0, 0, 0);
            setStartTime(start);
            setEndTime(new Date(start.getTime() + 3600000));
        }
    }, [editTask]);

    // State for stabilizing minimum date across renders
    const [pickerMinDate, setPickerMinDate] = useState(new Date());

    const onStartTimeChange = (event, selectedDate) => {
        if (event.type === 'dismissed') {
            setShowStartTimePicker(false);
            return;
        }

        const currentDate = selectedDate || startTime;
        setShowStartTimePicker(false);

        // Ensure currentDate is a valid Date object
        const validDate = (currentDate instanceof Date && !isNaN(currentDate))
            ? currentDate
            : new Date();

        setStartTime(validDate);

        // Automatically adjust end time if it's before the new start time
        if (endTime <= validDate) {
            setEndTime(new Date(validDate.getTime() + 3600000));
        }
    };

    const onEndTimeChange = (event, selectedDate) => {
        if (event.type === 'dismissed') {
            setShowEndTimePicker(false);
            return;
        }

        const currentDate = selectedDate || endTime;
        setShowEndTimePicker(false);

        // Ensure currentDate is a valid Date object
        const validDate = (currentDate instanceof Date && !isNaN(currentDate))
            ? currentDate
            : new Date();

        setEndTime(validDate);
    };

    const formatDate = (date) => {
        try {
            if (!date) return 'Select Time';
            const d = date instanceof Date ? date : new Date(date);
            if (isNaN(d.getTime())) return 'Select Time';
            return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } catch (e) {
            return 'Select Time';
        }
    };

    const openStartTimePicker = () => {
        setPickerMinDate(new Date());
        setShowStartTimePicker(true);
    };

    const openEndTimePicker = () => {
        setPickerMinDate(startTime || new Date());
        setShowEndTimePicker(true);
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

        // Validation for future time
        const now = new Date();
        const startCheck = startTime instanceof Date ? startTime : new Date(startTime);
        const endCheck = endTime instanceof Date ? endTime : new Date(endTime);

        if (isNaN(startCheck.getTime()) || startCheck.getTime() < now.getTime() - 60000) {
            Alert.alert('Invalid Time', 'Tasks cannot be scheduled in the past. Please select a future time.');
            return;
        }

        if (isNaN(endCheck.getTime()) || endCheck.getTime() <= startCheck.getTime()) {
            Alert.alert('Invalid Time', 'End time must be after the start time.');
            return;
        }

        setIsSaving(true);
        try {
            const hasPermission = await requestPermissions();
            const finalCategory = category === 'Other' ? customCategory : category;

            // Fetch username for notifications
            const profileJson = await AsyncStorage.getItem('@user_profile');
            const profile = profileJson ? JSON.parse(profileJson) : { username: 'Student' };
            const userName = profile.username || 'Student';

            const existingTasksJson = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
            let tasks = existingTasksJson ? JSON.parse(existingTasksJson) : [];

            // Schedule notifications
            let notificationIds = [];
            if (hasPermission) {
                try {
                    // If editing, cancel the previous notifications
                    if (editTask?.notificationIds) {
                        for (const id of editTask.notificationIds) {
                            if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => { });
                        }
                    }

                    const nowMs = Date.now();
                    const startMs = startCheck.getTime();
                    const endMs = endCheck.getTime();

                    // 1. Approaching (5 minutes before - if far enough in future)
                    const fiveMinsBefore = startMs - (5 * 60 * 1000);
                    if (fiveMinsBefore > nowMs) {
                        const id = await Notifications.scheduleNotificationAsync({
                            content: {
                                title: "Upcoming Event ⏰",
                                body: `Hello ${userName}, ${title} is approaching!`,
                                sound: true,
                            },
                            trigger: { date: new Date(fiveMinsBefore) },
                        }).catch(() => null);
                        if (id) notificationIds.push(id);
                    }

                    // 2. Started
                    if (startMs > nowMs) {
                        const id = await Notifications.scheduleNotificationAsync({
                            content: {
                                title: "Task Starting! 📚",
                                body: `Hello ${userName}, ${title} is started.`,
                                sound: true,
                            },
                            trigger: { date: startCheck },
                        }).catch(() => null);
                        if (id) notificationIds.push(id);
                    }

                    // 3. Ended
                    if (endMs > nowMs) {
                        const id = await Notifications.scheduleNotificationAsync({
                            content: {
                                title: "Task Finished ✅",
                                body: `Hello ${userName}, ${title} is ended.`,
                                sound: true,
                            },
                            trigger: { date: endCheck },
                        }).catch(() => null);
                        if (id) notificationIds.push(id);
                    }

                    // Immediate success alert as requested
                    Alert.alert('Success', `Hello ${userName}, you have successfully added an ${title} event`);

                } catch (notifError) {
                    console.error('Notification scheduling failed:', notifError);
                }
            }

            if (editTask) {
                // Update existing task
                tasks = tasks.map(t => t.id === editTask.id ? {
                    ...t,
                    title,
                    description,
                    category: finalCategory,
                    priority,
                    startTime: startCheck.toISOString(),
                    endTime: endCheck.toISOString(),
                    notificationIds: notificationIds.length > 0 ? notificationIds : (t.notificationIds || [])
                } : t);
            } else {
                // Create new task
                const newTask = {
                    id: Date.now().toString(),
                    title,
                    description,
                    category: finalCategory,
                    priority,
                    startTime: startCheck.toISOString(),
                    endTime: endCheck.toISOString(),
                    completed: false,
                    createdAt: new Date().toISOString(),
                    notificationIds
                };
                tasks.unshift(newTask);
            }

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

                    <View style={styles.timeRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>Starting Time</Text>
                            <TouchableOpacity
                                onPress={openStartTimePicker}
                                style={[styles.input, {
                                    borderColor: theme.colors.border,
                                    backgroundColor: theme.colors.card,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }]}
                            >
                                <Text style={{ color: theme.colors.text, fontSize: 13 }}>
                                    {formatDate(startTime)}
                                </Text>
                                <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                            </TouchableOpacity>
                            {showStartTimePicker && (
                                <DateTimePicker
                                    value={startTime instanceof Date && !isNaN(startTime) ? startTime : new Date()}
                                    mode="datetime"
                                    is24Hour={true}
                                    display="default"
                                    minimumDate={pickerMinDate}
                                    onChange={onStartTimeChange}
                                />
                            )}
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>Ending Time</Text>
                            <TouchableOpacity
                                onPress={openEndTimePicker}
                                style={[styles.input, {
                                    borderColor: theme.colors.border,
                                    backgroundColor: theme.colors.card,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }]}
                            >
                                <Text style={{ color: theme.colors.text, fontSize: 13 }}>
                                    {formatDate(endTime)}
                                </Text>
                                <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                            </TouchableOpacity>
                            {showEndTimePicker && (
                                <DateTimePicker
                                    value={endTime instanceof Date && !isNaN(endTime) ? endTime : new Date()}
                                    mode="datetime"
                                    is24Hour={true}
                                    display="default"
                                    minimumDate={pickerMinDate}
                                    onChange={onEndTimeChange}
                                />
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                        onPress={handleSaveTask}
                        disabled={isSaving}
                    >
                        <Text style={styles.saveButtonText}>
                            {isSaving ? 'Saving...' : (editTask ? 'Update Task' : 'Create Task')}
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
                        <Text style={[styles.successTitle, { color: theme.colors.text }]}>
                            {editTask ? 'Task Updated!' : 'Task Created!'}
                        </Text>
                        <Text style={[styles.successMessage, { color: theme.colors.text, opacity: 0.7 }]}>
                            Your task "{title}" has been successfully {editTask ? 'updated' : 'added'} to your list.
                        </Text>
                        <TouchableOpacity
                            style={[styles.closePopupButton, { backgroundColor: theme.colors.primary }]}
                            onPress={() => {
                                setShowSuccessPopup(false);
                                navigation.setParams({ task: undefined });
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
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
