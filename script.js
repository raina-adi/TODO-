const todoForm = document.getElementById('todoForm');
const todoText = document.getElementById('todoText');
const deadline = document.getElementById('deadline');
const todoList = document.getElementById('todoList');

async function fetchTodos() {
    const res = await fetch('/api/todos');
    const todos = await res.json();
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const li = document.createElement('li');
        const deadlineText = todo.deadline ? new Date(todo.deadline).toLocaleString() : 'No deadline';
        li.innerHTML = `
            <span>${todo.text} <small>(${deadlineText})</small></span>
            <div>
                <button onclick="deleteTodo(${todo.id})">❌</button>
            </div>
        `;
        todoList.appendChild(li);
    });
}

todoForm.addEventListener('submit', async e => {
    e.preventDefault();
    const text = todoText.value;
    const time = deadline.value || null;
    await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, deadline: time })
    });
    todoText.value = '';
    deadline.value = '';
    fetchTodos();
});

async function deleteTodo(id) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    fetchTodos();
}

fetchTodos();
