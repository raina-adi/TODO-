const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoDate = document.getElementById('todoDate');
const todoList = document.getElementById('todoList');

// Load todos from server
async function loadTodos() {
    const response = await fetch('/api/todos');
    const todos = await response.json();
    todoList.innerHTML = '';
    todos.forEach(todo => {
        addTodoToUI(todo);
    });
}

// Add todo to UI
function addTodoToUI(todo) {
    const li = document.createElement('li');
    const dateText = todo.date ? new Date(todo.date).toLocaleDateString() : 'No date';
    li.innerHTML = `
        <div>
            <span>${todo.text}</span>
            <small>📅 ${dateText}</small>
        </div>
        <button class="delete-btn" onclick="deleteTodo(${todo.id})">Delete</button>
    `;
    todoList.appendChild(li);
}

// Add new todo
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = todoInput.value;
    const date = todoDate.value || null;
    
    const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, date })
    });
    
    const newTodo = await response.json();
    addTodoToUI(newTodo);
    todoInput.value = '';
    todoDate.value = '';
});

// Delete todo
async function deleteTodo(id) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    loadTodos();
}

// Load todos on page load
loadTodos();
