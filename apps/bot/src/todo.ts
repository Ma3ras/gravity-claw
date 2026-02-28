// src/todo.ts

import React, { useState } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState<string>('');

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

  return (
    <div>
      <h1>Todo List</h1>
      <input
        type="text"
        value={newTodoText}
        onChange={(e) => setNewTodoText(e.target.value)}
      />
      <button onClick={addTodo}>Add Todo</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleComplete(todo.id)}
            />
            {todo.text}
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <button onClick={clearCompleted}>Clear Completed</button>
    </div>
  );
};

export default TodoList;