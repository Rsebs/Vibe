import { Tabs } from 'expo-router'
import { FolderSync, Globe } from 'lucide-react-native'
import React from 'react'
import PlayerBar from '@/components/PlayerBar'

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#1DB954',
          tabBarInactiveTintColor: '#B3B3B3',
          tabBarStyle: {
            backgroundColor: '#121212',
            borderTopWidth: 0,
            elevation: 0,
          },
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#fff',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Streaming',
            tabBarIcon: ({ color }) => <Globe color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="local"
          options={{
            title: 'Música Local',
            tabBarIcon: ({ color }) => <FolderSync color={color} size={24} />,
          }}
        />
      </Tabs>
      <PlayerBar />
    </>
  )
}
