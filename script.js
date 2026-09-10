const storageKey = 'purple-todo-tasks';
let tasks = loadTasks();
let currentFilter = 'all';
const elements = {
  form: document.querySelector('#task-form'), input: document.querySelector('#task-input'), list: document.querySelector('#task-list'), empty: document.querySelector('#empty-state'), status: document.querySelector('#status-message'), today: document.querySelector('#today'), allCount: document.querySelector('#all-count'), activeCount: document.querySelector('#active-count'), completedCount: document.querySelector('#completed-count'), remaining: document.querySelector('#remaining-label'), clearCompleted: document.querySelector('#clear-completed')
};
function loadTasks() { try { const saved = JSON.parse(localStorage.getItem(storageKey)); return Array.isArray(saved) ? saved : []; } catch { return []; } }
function saveTasks() { localStorage.setItem(storageKey, JSON.stringify(tasks)); }
function formatDate(timestamp) { return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(timestamp); }
function escapeHtml(text) { return text.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
function render() {
  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  const visibleTasks = tasks.filter((task) => currentFilter === 'all' || (currentFilter === 'active' ? !task.completed : task.completed));
  elements.list.innerHTML = visibleTasks.map((task) => `<article class="task-item${task.completed ? ' is-completed' : ''}" data-id="${task.id}"><button class="check-button" type="button" data-action="toggle" aria-label="${task.completed ? '取消完成' : '标记完成'}">${task.completed ? '✓' : ''}</button><div class="task-copy"><p class="task-text">${escapeHtml(task.text)}</p><p class="task-time">${formatDate(task.createdAt)}</p></div><button class="delete-button" type="button" data-action="delete" aria-label="删除任务">✕</button></article>`).join('');
  elements.empty.hidden = visibleTasks.length > 0;
  elements.allCount.textContent = tasks.length; elements.activeCount.textContent = activeTasks.length; elements.completedCount.textContent = completedTasks.length; elements.remaining.textContent = `${activeTasks.length} 项待完成`;
  elements.clearCompleted.disabled = completedTasks.length === 0;
  elements.status.textContent = tasks.length > 0 && activeTasks.length === 0 ? '太棒了，今天的事情都完成啦！' : activeTasks.length === 1 ? '还剩最后一件，稳稳完成它。' : '把想做的事，一件件完成。';
}
function updateFilterButtons() { document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('is-active', button.dataset.filter === currentFilter)); }
elements.form.addEventListener('submit', (event) => {
  event.preventDefault(); const text = elements.input.value.trim(); if (!text) return;
  tasks.unshift({ id: crypto.randomUUID(), text, completed: false, createdAt: Date.now() }); saveTasks(); elements.input.value = ''; currentFilter = 'all'; updateFilterButtons(); render(); elements.input.focus();
});
document.querySelector('.filters').addEventListener('click', (event) => { const button = event.target.closest('[data-filter]'); if (!button) return; currentFilter = button.dataset.filter; updateFilterButtons(); render(); });
elements.list.addEventListener('click', (event) => {
  const button = event.target.closest('button'); const item = event.target.closest('[data-id]'); if (!button || !item) return;
  const task = tasks.find((entry) => entry.id === item.dataset.id); if (!task) return;
  if (button.dataset.action === 'toggle') task.completed = !task.completed;
  if (button.dataset.action === 'delete') tasks = tasks.filter((entry) => entry.id !== task.id);
  saveTasks(); render();
});
elements.clearCompleted.addEventListener('click', () => { tasks = tasks.filter((task) => !task.completed); saveTasks(); render(); });
elements.today.textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date());
render();