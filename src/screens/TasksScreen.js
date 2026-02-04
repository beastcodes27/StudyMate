import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_STORAGE_KEY = '@tasks_list';

const TasksScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadTasks = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
            setTasks(jsonValue != null ? JSON.parse(jsonValue) : []);
        } catch (e) {
            Alert.alert('Error', 'Failed to load tasks');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadTasks();
        }, [])
    );

    const onRefresh = () => {
        setIsRefreshing(true);
        loadTasks();
    };

    const toggleTaskCompletion = async (taskId) => {
        try {
            const updatedTasks = tasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            );
            setTasks(updatedTasks);
            await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
        } catch (e) {
            Alert.alert('Error', 'Failed to update task');
        }
    };

    const deleteTask = (taskId) => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const updatedTasks = tasks.filter(task => task.id !== taskId);
                            setTasks(updatedTasks);
                            await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete task');
                        }
                    }
                }
            ]
        );
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return '#FF4D4D';
            case 'Medium': return '#FFA500';
            case 'Low': return '#4CAF50';
            default: return theme.colors.primary;
        }
    };

    const renderTaskItem = ({ item }) => (
        <View style={[styles.taskItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <TouchableOpacity
                style={styles.checkBox}
                onPress={() => toggleTaskCompletion(item.id)}
            >
                <Ionicons
                    name={item.completed ? "checkbox" : "square-outline"}
                    size={26}
                    color={item.completed ? theme.colors.primary : 'gray'}
                />
            </TouchableOpacity>

            <View style={styles.taskContent}>
                <Text style={[
                    styles.taskTitle,
                    { color: theme.colors.text },
                    item.completed && styles.completedText
                ]}>
                    {item.title}
                </Text>
                {item.description ? (
                    <Text style={[styles.taskDescription, { color: theme.colors.text, opacity: 0.6 }]} numberOfLines={1}>
                        {item.description}
                    </Text>
                ) : null}

                <View style={styles.taskFooter}>
                    <View style={[styles.badge, { backgroundColor: theme.colors.border + '50' }]}>
                        <Text style={[styles.badgeText, { color: theme.colors.text }]}>{item.category}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                        <Text style={[styles.badgeText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
                    </View>
                    <Text style={[styles.dueDate, { color: theme.colors.text, opacity: 0.5 }]}>
                        {new Date(item.dueDate).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTask(item.id)}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.notification} />
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {tasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="clipboard-outline" size={80} color={theme.colors.border} />
                    <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                        No tasks added yet.
                    </Text>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => navigation.navigate('Add Task')}
                    >
                        <Text style={styles.addButtonText}>Add Your First Task</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={tasks}
                    keyExtractor={item => item.id}
                    renderItem={renderTaskItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                    }
                />
            )}

            {tasks.length > 0 && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                    onPress={() => navigation.navigate('Add Task')}
                >
                    <Ionicons name="add" size={30} color="#FFF" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 15,
        paddingBottom: 100,
    },
    taskItem: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 15,
        marginBottom: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    checkBox: {
        marginRight: 12,
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    taskDescription: {
        fontSize: 14,
        marginTop: 2,
    },
    taskFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    dueDate: {
        fontSize: 12,
        marginLeft: 'auto',
    },
    deleteButton: {
        padding: 5,
        marginLeft: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        marginTop: 15,
        marginBottom: 20,
        textAlign: 'center',
        opacity: 0.6,
    },
    addButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    addButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
});

export default TasksScreen;
