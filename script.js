const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoDate = document.getElementById('todoDate');
const todoList = document.getElementById('todoList');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

const TODO_KEY = 'todos_v1';

function getLocalTodos() {
    try {
        const raw = localStorage.getItem(TODO_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function formatDateWithoutYear(dateStr) {
    try {
        const d = new Date(dateStr);
        if (isNaN(d)) return 'No date';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}-${month}`;
    } catch (e) {
        return 'No date';
    }
}

function saveLocalTodos(todos) {
    localStorage.setItem(TODO_KEY, JSON.stringify(todos));
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function updateProgress() {
    const todos = getLocalTodos();
    const completed = todos.filter(todo => todo.completed).length;
    const total = todos.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    progressBar.style.setProperty('--progress', `${percentage}%`);
    progressText.textContent = `${completed} / ${total} completed`;
}

// Load todos (try server, fall back to localStorage)
async function loadTodos() {
    todoList.innerHTML = '';
    
    // Check if we have localStorage data
    const localTodos = getLocalTodos();
    
    try {
        const response = await fetch('/api/todos');
        if (!response.ok) throw new Error('Server returned ' + response.status);
        const serverTodos = await response.json();
        
        // If server has data, use it; otherwise use localStorage
        if (serverTodos && serverTodos.length > 0) {
            serverTodos.forEach((todo, idx) => addTodoToUI(todo, idx));
        } else if (localTodos.length > 0) {
            localTodos.forEach((todo, idx) => addTodoToUI(todo, idx));
        }
    } catch (err) {
        console.log('Server fetch failed, using localStorage');
        // Use localStorage as fallback
        if (localTodos.length > 0) {
            localTodos.forEach((todo, idx) => addTodoToUI(todo, idx));
        }
    }

    updateProgress();
}

// Add todo node to UI
function addTodoToUI(todo, index) {
    const li = document.createElement('li');
    li.dataset.id = todo.id;
    if (todo.completed) li.classList.add('completed');

    // If index not provided, calculate it based on current list
    if (index === undefined) {
        index = todoList.children.length;
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed || false;
    checkbox.className = 'complete-checkbox';
    checkbox.addEventListener('change', () => toggleComplete(todo.id));

    const serial = document.createElement('span');
    serial.className = 'serial-num';
    serial.textContent = index + 1;

    const content = document.createElement('div');
    const span = document.createElement('span');
    span.textContent = todo.text;
    const small = document.createElement('small');
    small.textContent = '📅 ' + (todo.date ? formatDateWithoutYear(todo.date) : 'No date');
    content.appendChild(span);
    content.appendChild(document.createTextNode(' '));
    content.appendChild(small);

    const btnWrap = document.createElement('div');
    btnWrap.className = 'btn-wrap';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEdit(li, span, todo));

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = 'Delete';
    del.addEventListener('click', () => {
        if (confirm('Delete this task?')) deleteTodo(todo.id);
    });

    btnWrap.appendChild(editBtn);
    btnWrap.appendChild(del);

    li.appendChild(checkbox);
    li.appendChild(serial);
    li.appendChild(content);
    li.appendChild(btnWrap);
    todoList.appendChild(li);
}

function startEdit(li, span, todo) {
    const currentText = todo.text;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'edit-input';

    // replace span with input
    span.replaceWith(input);
    input.focus();

    function finish(save) {
        const newText = input.value.trim();
        if (save && newText && newText !== currentText) {
            updateTodo(todo.id, { text: newText }).then(updated => {
                todo.text = updated && updated.text ? updated.text : newText;
                const newSpan = document.createElement('span');
                newSpan.textContent = todo.text;
                input.replaceWith(newSpan);
            }).catch(() => {
                // fallback UI update
                todo.text = newText;
                const newSpan = document.createElement('span');
                newSpan.textContent = todo.text;
                input.replaceWith(newSpan);
            });
        } else {
            const newSpan = document.createElement('span');
            newSpan.textContent = currentText;
            input.replaceWith(newSpan);
        }
    }

    input.addEventListener('blur', () => finish(true));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            finish(true);
        } else if (e.key === 'Escape') {
            finish(false);
        }
    });
}

async function updateTodo(id, patch) {
    // Try server
    try {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch)
        });
        if (!response.ok) throw new Error('Server update failed');
        const updated = await response.json();
        return updated;
    } catch (err) {
        // Fallback: update localStorage
        const todos = getLocalTodos();
        const idx = todos.findIndex(t => String(t.id) === String(id));
        if (idx !== -1) {
            todos[idx] = { ...todos[idx], ...patch };
            saveLocalTodos(todos);
            return todos[idx];
        }
        throw err;
    }
}

async function toggleComplete(id) {
    // Try server
    try {
        const response = await fetch(`/api/todos/${id}/toggle`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Server toggle failed');
        const updated = await response.json();
        // Update localStorage
        const todos = getLocalTodos();
        const idx = todos.findIndex(t => String(t.id) === String(id));
        if (idx !== -1) {
            todos[idx] = updated;
            saveLocalTodos(todos);
        }
        // Update UI
        const li = document.querySelector(`li[data-id="${id}"]`);
        if (li) {
            li.classList.toggle('completed');
            const checkbox = li.querySelector('.complete-checkbox');
            if (checkbox) checkbox.checked = updated.completed;
        }
        updateProgress();
    } catch (err) {
        // Fallback: toggle localStorage
        const todos = getLocalTodos();
        const idx = todos.findIndex(t => String(t.id) === String(id));
        if (idx !== -1) {
            todos[idx].completed = !todos[idx].completed;
            saveLocalTodos(todos);
            // Update UI
            const li = document.querySelector(`li[data-id="${id}"]`);
            if (li) {
                li.classList.toggle('completed');
                const checkbox = li.querySelector('.complete-checkbox');
                if (checkbox) checkbox.checked = todos[idx].completed;
            }
            updateProgress();
        }
    }
}

// Add new todo
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    const date = todoDate.value || null;

    // Try server
    try {
        const response = await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, date })
        });
        if (!response.ok) throw new Error('Server error');
        const newTodo = await response.json();
        addTodoToUI(newTodo);
        updateProgress();
    } catch (err) {
        // Fallback to localStorage
        const todos = getLocalTodos();
        const newTodo = { id: generateId(), text, date, completed: false };
        todos.push(newTodo);
        saveLocalTodos(todos);
        addTodoToUI(newTodo);
        updateProgress();
    }

    todoInput.value = '';
    todoDate.value = '';
});

// Delete todo
async function deleteTodo(id) {
    console.log('Deleting task with ID:', id);
    
    // Remove from localStorage first (more reliable)
    const todos = getLocalTodos().filter(t => String(t.id) !== String(id));
    saveLocalTodos(todos);
    console.log('Removed from localStorage. Remaining:', todos.length);

    // Try server delete (async, non-blocking)
    try {
        const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
        if (response.ok) {
            console.log('Deleted from server');
        } else {
            console.log('Server delete returned:', response.status);
        }
    } catch (err) {
        console.log('Server delete error:', err);
    }

    // Reload UI from localStorage (not from server)
    loadTodos();
}

// Initial load
loadTodos();

// Dark Mode Toggle
const themeToggle = document.getElementById('themeToggle');
const THEME_KEY = 'theme_preference';

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
        themeToggle.title = 'Switch to Light Mode';
    } else {
        themeToggle.textContent = '🌙';
        themeToggle.title = 'Switch to Dark Mode';
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    themeToggle.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

themeToggle.addEventListener('click', toggleTheme);

// Load theme on page load
loadTheme();
