import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TasksScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Yet task added add your tasks</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default TasksScreen;
