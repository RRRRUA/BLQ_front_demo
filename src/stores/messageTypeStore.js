import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export const useMessageTypeStore = defineStore('messageType', () => {
  const messageTypes = ref([])
  const loading = ref(false)
  const error = ref(null)

  const mockMessageTypes = [
    {
      id: 1,
      code: 'notification',
      name: 'Notification',
      description: 'General notifications used by templates.',
      status: 'enabled'
    },
    {
      id: 2,
      code: 'alert',
      name: 'Alert',
      description: 'Urgent messages and exception alerts.',
      status: 'enabled'
    },
    {
      id: 3,
      code: 'reminder',
      name: 'Reminder',
      description: 'Routine reminders and follow-up messages.',
      status: 'enabled'
    },
    {
      id: 4,
      code: 'marketing',
      name: 'Marketing',
      description: 'Campaign and promotional messages.',
      status: 'enabled'
    },
    {
      id: 5,
      code: 'system',
      name: 'System',
      description: 'System notices and maintenance messages.',
      status: 'enabled'
    }
  ]

  const loadMessageTypes = () => {
    loading.value = true
    error.value = null

    setTimeout(() => {
      messageTypes.value = mockMessageTypes
      loading.value = false
    }, 300)
  }

  const getMessageTypeByCode = (code) => {
    return messageTypes.value.find((item) => item.code === code)
  }

  const addMessageType = (messageType) => {
    const newItem = {
      ...messageType,
      id: messageTypes.value.length + 1,
      status: messageType.status || 'enabled'
    }

    messageTypes.value.push(newItem)
    ElMessage.success('Message type added')
    return newItem
  }

  const updateMessageType = (id, updates) => {
    const index = messageTypes.value.findIndex((item) => item.id === id)
    if (index === -1) {
      ElMessage.error('Message type not found')
      return false
    }

    messageTypes.value[index] = {
      ...messageTypes.value[index],
      ...updates
    }
    ElMessage.success('Message type updated')
    return true
  }

  const deleteMessageType = (id) => {
    const index = messageTypes.value.findIndex((item) => item.id === id)
    if (index === -1) {
      ElMessage.error('Message type not found')
      return false
    }

    messageTypes.value.splice(index, 1)
    ElMessage.success('Message type deleted')
    return true
  }

  return {
    messageTypes,
    loading,
    error,
    loadMessageTypes,
    getMessageTypeByCode,
    addMessageType,
    updateMessageType,
    deleteMessageType
  }
})
