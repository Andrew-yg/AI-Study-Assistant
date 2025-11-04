<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="brand">
        <span class="logo-icon">⚡️</span>
        <h1 class="brand-name">PersonalizedForYou</h1>
      </div>
      <button @click="$emit('new-chat')" class="new-chat-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New Chat
      </button>
    </div>

    <div class="sessions-list">
      <div class="sessions-header">Chat History</div>
      <div
        v-for="session in sessions"
        :key="session.id"
        :class="['session-item', { active: session.id === currentSessionId }]"
        @click="$emit('select-session', session.id)"
      >
        <div class="session-title">{{ session.title }}</div>
        <button
          @click.stop="$emit('delete-session', session.id)"
          class="delete-button"
          title="Delete chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>

      <div v-if="sessions.length === 0" class="empty-sessions">
        No chat history yet. Start a new conversation!
      </div>
    </div>

    <div class="sidebar-footer">
      <button @click="handleLogout" class="logout-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        Sign Out
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Session {
  id: string
  title: string
  created_at: string
  updated_at: string
}

defineProps<{
  sessions: Session[]
  currentSessionId: string | null
}>()

defineEmits(['new-chat', 'select-session', 'delete-session'])

const { $supabase } = useNuxtApp()
const router = useRouter()

const handleLogout = async () => {
  await $supabase.auth.signOut()
  router.push('/')
}
</script>

<style scoped>
.sidebar {
  width: 300px;
  background: #1a1a1a;
  color: white;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #2d2d2d;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #2d2d2d;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.logo-icon {
  font-size: 1.5rem;
}

.brand-name {
  font-size: 1rem;
  font-weight: 700;
}

.new-chat-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  color: #1a1a1a;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.new-chat-button:hover {
  background: #f3f4f6;
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.sessions-header {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #9ca3af;
  margin-bottom: 0.75rem;
  padding: 0 0.5rem;
}

.session-item {
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.session-item:hover {
  background: #2d2d2d;
}

.session-item.active {
  background: #2d2d2d;
}

.session-title {
  flex: 1;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-button {
  background: transparent;
  border: none;
  color: #6b7280;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
}

.session-item:hover .delete-button {
  opacity: 1;
}

.delete-button:hover {
  color: #ef4444;
}

.empty-sessions {
  padding: 2rem 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #2d2d2d;
}

.logout-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  color: white;
  border: 1px solid #2d2d2d;
  border-radius: 0.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.logout-button:hover {
  background: #2d2d2d;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    max-width: 300px;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
  }
}
</style>
