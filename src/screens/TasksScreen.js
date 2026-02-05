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
import * as Notifications from 'expo-notifications';

const TASKS_STORAGE_KEY = '@tasks_list';

const TasksScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState(null);

    const toggleExpand = (taskId) => {
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    };

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
                            const taskToDelete = tasks.find(t => t.id === taskId);
                            if (taskToDelete?.notificationId) {
                                await Notifications.cancelScheduledNotificationAsync(taskToDelete.notificationId);
                            }
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

    const renderTaskItem = ({ item }) => {
        const isExpanded = expandedTaskId === item.id;
        const isEnded = new Date(item.endTime) < new Date();

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => toggleExpand(item.id)}
                style={[
                    styles.taskCard,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                    item.completed && { opacity: 0.8 }
                ]}
            >
                {/* Priority Indicator Bar */}
                <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(item.priority) }]} />

                <View style={styles.cardMainContent}>
                    <View style={styles.cardHeader}>
                        <TouchableOpacity
                            style={styles.modernCheckBox}
                            onPress={() => toggleTaskCompletion(item.id)}
                        >
                            <View style={[
                                styles.checkBoxInner,
                                { borderColor: item.completed ? theme.colors.primary : theme.colors.border },
                                item.completed && { backgroundColor: theme.colors.primary }
                            ]}>
                                {item.completed && <Ionicons name="checkmark" size={16} color="#FFF" />}
                            </View>
                        </TouchableOpacity>

                        <View style={styles.titleContainer}>
                            <Text style={[
                                styles.newStackTaskTitle,
                                { color: theme.colors.text },
                                item.completed && styles.completedText
                            ]} numberOfLines={1}>
                                {item.title}
                            </Text>
                            <View style={styles.simpleTimeContainer}>
                                <Ionicons
                                    name={isEnded ? "alert-circle-outline" : "time-outline"}
                                    size={12}
                                    color={isEnded ? theme.colors.notification : theme.colors.text}
                                    style={{ opacity: 0.6, marginRight: 4 }}
                                />
                                <Text style={[
                                    styles.simpleTimeText,
                                    { color: isEnded ? theme.colors.notification : theme.colors.text, opacity: 0.6 }
                                ]}>
                                    {isEnded ? "Event Ended" : `${new Date(item.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </Text>
                            </View>
                        </View>

                        <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color={theme.colors.text}
                            style={{ opacity: 0.4 }}
                        />
                    </View>

                    {isExpanded && (
                        <View style={styles.expandedContent}>
                            {item.description ? (
                                <View style={styles.detailSection}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.text, opacity: 0.4 }]}>Description</Text>
                                    <Text style={[styles.cardDescription, { color: theme.colors.text, opacity: 0.8 }]}>
                                        {item.description}
                                    </Text>
                                </View>
                            ) : null}

                            <View style={styles.detailsRow}>
                                <View style={styles.detailItem}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.text, opacity: 0.4 }]}>Category</Text>
                                    <View style={styles.categoryBadge}>
                                        <Ionicons
                                            name={item.category === 'Study' ? 'book' : 'layers'}
                                            size={12}
                                            color={theme.colors.primary}
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text style={[styles.categoryBadgeText, { color: theme.colors.primary }]}>
                                            {item.category}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.detailItem}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.text, opacity: 0.4 }]}>Priority</Text>
                                    <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(item.priority) + '15' }]}>
                                        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
                                        <Text style={[styles.priorityTagText, { color: getPriorityColor(item.priority) }]}>
                                            {item.priority}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.actionButtonsContainer}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: theme.colors.primary + '15' }]}
                                    onPress={() => navigation.navigate('Add Task', { task: item })}
                                >
                                    <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                                    <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>Edit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: theme.colors.notification + '15' }]}
                                    onPress={() => deleteTask(item.id)}
                                >
                                    <Ionicons name="trash-outline" size={18} color={theme.colors.notification} />
                                    <Text style={[styles.actionBtnText, { color: theme.colors.notification }]}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const completedTasksCount = tasks.filter(task => task.completed).length;
    const now = new Date();

    // Only count tasks that are completed OR have already reached their start time
    const dueTasksCount = tasks.filter(task => task.completed || new Date(task.startTime) <= now).length;

    const completionPercentage = dueTasksCount > 0
        ? Math.round((completedTasksCount / dueTasksCount) * 100)
        : 0;

    const activeTasksCount = tasks.filter(task => !task.completed).length;
    const inProgressCount = tasks.filter(task => {
        const start = new Date(task.startTime);
        const end = new Date(task.endTime);
        return !task.completed && now >= start && now <= end;
    }).length;

    const sortedTasks = [...tasks].sort((a, b) => {
        // First priority: Completion status (uncompleted first)
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        // Second priority: If uncompleted, show those that haven't ended yet first
        const aEnded = new Date(a.endTime) < now;
        const bEnded = new Date(b.endTime) < now;
        if (aEnded !== bEnded) {
            return aEnded ? 1 : -1;
        }

        // Third priority: Sort by start time (soonest first)
        return new Date(a.startTime) - new Date(b.startTime);
    });

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Main Tracker: In Progress */}
            <View style={[styles.mainProgressCard, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
                <View style={styles.mainProgressInfo}>
                    <View>
                        <Text style={styles.mainProgressTitle}>Ongoing Sessions</Text>
                        <Text style={styles.mainProgressSubtitle}>Tasks currently in progress</Text>
                    </View>
                    <View style={styles.mainProgressValueContainer}>
                        <Text style={styles.mainProgressValue}>{inProgressCount}</Text>
                    </View>
                </View>
                <View style={[styles.mainProgressBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <View style={[styles.mainProgressBarFill, { width: inProgressCount > 0 ? '100%' : '0%' }]} />
                </View>
            </View>

            <View style={styles.statCardsRow}>
                {/* Active Tasks Card */}
                <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.smallCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                        <Text style={[styles.smallValue, { color: theme.colors.primary }]}>{activeTasksCount}</Text>
                    </View>
                    <Text style={[styles.statLabel, { color: theme.colors.text, opacity: 0.6 }]}>Total Tasks</Text>
                </View>

                {/* Progress Circle Card */}
                <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.smallCircle, { borderColor: theme.colors.primary + '30', borderWidth: 3 }]}>
                        <Text style={[styles.smallValue, { color: theme.colors.text }]}>{completionPercentage}%</Text>
                    </View>
                    <Text style={[styles.statLabel, { color: theme.colors.text, opacity: 0.6 }]}>Completion</Text>
                </View>
            </View>
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
                    data={sortedTasks}
                    keyExtractor={item => item.id}
                    renderItem={renderTaskItem}
                    ListHeaderComponent={renderHeader}
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
    headerContainer: {
        marginBottom: 20,
    },
    mainProgressCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 15,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    mainProgressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    mainProgressTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    mainProgressSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    mainProgressValueContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainProgressValue: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
    },
    mainProgressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    mainProgressBarFill: {
        height: '100%',
        backgroundColor: '#FFF',
    },
    statCardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 0.48,
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    smallCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    smallValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    taskCard: {
        flexDirection: 'row',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    priorityBar: {
        width: 6,
        height: '100%',
    },
    cardMainContent: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    modernCheckBox: {
        marginRight: 12,
    },
    checkBoxInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
    },
    newStackTaskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    simpleTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    simpleTimeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    expandedContent: {
        marginTop: 15,
        paddingLeft: 36,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 15,
    },
    detailSection: {
        marginBottom: 15,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    detailItem: {
        marginRight: 30,
    },
    priorityTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    priorityTagText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        flex: 0.48,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
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
