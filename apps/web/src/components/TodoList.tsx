import React, { useEffect, useMemo, useState } from 'react';
import './TodoList.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState<string>('');
  const storageKey = 'premium-todos-v1';

  useEffect(() => {
    const rawTodos = localStorage.getItem(storageKey);

    if (!rawTodos) {
      return;
    }

    try {
      const parsedTodos = JSON.parse(rawTodos) as Todo[];
      setTodos(Array.isArray(parsedTodos) ? parsedTodos : []);
    } catch {
      setTodos([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(todos));
  }, [todos]);

  // Add a new todo
  const addTodo = () => {
    if (newTodoText.trim() === '') return;
    setTodos((prevTodos) => [
      ...prevTodos,
      { id: Date.now(), text: newTodoText, completed: false },
    ]);
    setNewTodoText('');
  };

  // Toggle todo completion
  const toggleComplete = (id: number) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Delete a todo
  const deleteTodo = (id: number) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  };

  // Clear all completed todos
  const clearCompleted = () => {
    setTodos((prevTodos) => prevTodos.filter((todo) => !todo.completed));
  };

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos]
  );
  const remainingCount = todos.length - completedCount;

  return (
    <main className="todo-page">
      <div className="todo-glow todo-glow--one" aria-hidden="true" />
      <div className="todo-glow todo-glow--two" aria-hidden="true" />

      <section className="todo-shell">
        <header className="todo-header">
          <p className="todo-kicker">Productivity Hub</p>
          <h1>Todo List</h1>
          <p className="todo-stats">
            {remainingCount} remaining • {completedCount} done
          </p>
        </header>

        <div className="todo-input-row">
          <input
            type="text"
            className="todo-input"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addTodo();
              }
            }}
            placeholder="Add a high-priority task..."
          />
          <button type="button" className="todo-btn todo-btn--add" onClick={addTodo}>
            Add
          </button>
        </div>

        <ul className="todo-list" aria-live="polite">
          {todos.length === 0 && (
            <li className="todo-empty">No tasks yet. Add one to get momentum.</li>
          )}

          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`todo-item ${todo.completed ? 'todo-item--done' : ''}`}
            >
              <label className="todo-checkbox-wrap">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo.id)}
                />
                <span className="todo-checkmark" aria-hidden="true" />
              </label>
              <span className="todo-text">{todo.text}</span>
              <button
                type="button"
                className="todo-btn todo-btn--delete"
                onClick={() => deleteTodo(todo.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="todo-btn todo-btn--clear"
          onClick={clearCompleted}
          disabled={completedCount === 0}
        >
          Clear Completed
        </button>
      </section>
    </main>
  );
};

export default TodoList;
