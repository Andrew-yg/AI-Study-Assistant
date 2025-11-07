<template>
  <div :class="['sidebar', { collapsed: isCollapsed }]">
    <button @click="toggleSidebar" class="toggle-button" :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
      <svg v-if="!isCollapsed" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
    <div class="sidebar-header">
      <div class="brand">
        <span class="logo-icon">⚡️</span>
        <h1 v-if="!isCollapsed" class="brand-name">PersonalizedForYou</h1>
      </div>
      <button @click="$emit('new-chat')" class="new-chat-button" :title="isCollapsed ? 'New Chat' : ''">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span v-if="!isCollapsed">New Chat</span>
      </button>
    </div>

    <div class="sessions-list">
      <div v-if="!isCollapsed" class="sessions-header">Chat History</div>
      <div
        v-for="session in sessions"
        :key="session.id"
        :class="['session-item', { active: session.id === currentSessionId }]"
        @click="$emit('select-session', session.id)"
      >
        <div class="session-title" :title="session.title">{{ session.title }}</div>
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
      <button @click="goToMaterials" class="materials-button" :title="isCollapsed ? 'My Materials' : ''">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span v-if="!isCollapsed">My Materials</span>
      </button>
      <button @click="handleLogout" class="logout-button" :title="isCollapsed ? 'Sign Out' : ''">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        <span v-if="!isCollapsed">Sign Out</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Session {
  id: string
  title: string
}

defineProps<{
  sessions: Session[]
  currentSessionId: string | null
}>()

defineEmits(['new-chat', 'select-session', 'delete-session'])

const router = useRouter()
const { signOut } = useAuth()
const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const goToMaterials = () => {
  router.push('/materials')
}

const handleLogout = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Sign out failed:', error)
  }
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
  position: relative;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed {
  width: 70px;
}

.toggle-button {
  position: absolute;
  top: 1rem;
  right: -12px;
  width: 24px;
  height: 24px;
  background: #1a1a1a;
  border: 1px solid #2d2d2d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
  transition: all 0.2s;
  cursor: pointer;
  padding: 0;
}

.toggle-button:hover {
  background: #2d2d2d;
  transform: scale(1.1);
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
  overflow: hidden;
}

.logo-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.brand-name {
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.2s;
}

.sidebar.collapsed .brand-name {
  opacity: 0;
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
  overflow: hidden;
}

.sidebar.collapsed .new-chat-button {
  padding: 0.75rem;
}

.new-chat-button span {
  white-space: nowrap;
  transition: opacity 0.2s;
}

.new-chat-button:hover {
  background: #f3f4f6;
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  overflow-x: hidden;
}

.sessions-header {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #9ca3af;
  margin-bottom: 0.75rem;
  padding: 0 0.5rem;
  white-space: nowrap;
  transition: opacity 0.2s;
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
  overflow: hidden;
}

.sidebar.collapsed .session-item {
  justify-content: center;
  padding: 0.75rem 0.5rem;
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
  transition: opacity 0.2s;
}

.sidebar.collapsed .session-title {
  display: none;
}

.sidebar.collapsed .session-item::before {
  content: '💬';
  font-size: 1.25rem;
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
  flex-shrink: 0;
}

.sidebar.collapsed .delete-button {
  display: none;
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
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.materials-button,
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
  overflow: hidden;
}

.sidebar.collapsed .materials-button,
.sidebar.collapsed .logout-button {
  padding: 0.75rem;
}

.materials-button span,
.logout-button span {
  white-space: nowrap;
  transition: opacity 0.2s;
}

.materials-button:hover,
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
