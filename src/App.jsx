import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { Amplify, API, graphqlOperation } from 'aws-amplify';
import awsconfig from './aws-exports';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { Authenticator } from '@aws-amplify/ui-react';
import { Auth } from '@aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';

import { listTodos } from './graphql/queries';
import { createTodo, deleteTodo, updateTodo} from './graphql/mutations';
import awsExports from './aws-exports';

Amplify.configure(awsExports);

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [updatedTodoId, setUpdatedTodoId] = useState('');
  const [updatedTodoDescription, setUpdatedTodoDescription] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      console.log('User:', user.username);
      const todoData = await API.graphql({
        query: listTodos,
        variables: { filter: { owner: { eq: user.username } } },
        authMode: 'AMAZON_COGNITO_USER_POOLS'
      });
      const todoList = todoData.data.listTodos.items;
      console.log('todo list:', todoList);
      setTodos(todoList);
    } catch (error) {
      console.log('Error fetching todos:', error);
    }
  };

  const deleteTodoItem = async (todoId) => {
    try {
      await API.graphql({
        query: deleteTodo,
        variables: { input: { id: todoId } },
        authMode: 'AMAZON_COGNITO_USER_POOLS'
      });
      const updatedTodos = todos.filter((todo) => todo.id !== todoId);
      setTodos(updatedTodos);
    } catch (error) {
      console.log('Error deleting todo:', error);
    }
  };

  const createNewTodo = async (e) => {
    e.preventDefault();
    if (newTodoDescription.trim() === '') {
      return; // Do not create empty todo
    }
    try {
      const user = await Auth.currentAuthenticatedUser();
      const todoData = await API.graphql({
        query: createTodo,
        variables: { input: { description: newTodoDescription, owner: user.username } },
        authMode: 'AMAZON_COGNITO_USER_POOLS'
      });
      const createdTodo = todoData.data.createTodo;
      setTodos((prevTodos) => [...prevTodos, createdTodo]);
      setNewTodoDescription('');
    } catch (error) {
      console.log('Error creating todo:', error);
    }
  };

  const updateTodoDescription = async (todoId) => {
    try {
      await API.graphql({
        query: updateTodo,
        variables: { input: { id: todoId, description: updatedTodoDescription } },
        authMode: 'AMAZON_COGNITO_USER_POOLS'
      });
      const updatedTodos = todos.map((todo) =>
        todo.id === todoId ? { ...todo, description: updatedTodoDescription } : todo
      );
      setTodos(updatedTodos);
      setUpdatedTodoId('');
      setUpdatedTodoDescription('');
    } catch (error) {
      console.log('Error updating todo:', error);
    }
  };

  const cancelUpdate = () => {
    setUpdatedTodoId('');
    setUpdatedTodoDescription('');
  };

  const renderTodoItem = (todo) => {
    if (todo.id === updatedTodoId) {
      return (
        <div key={todo.id} className="todo-row">
          <div className="todo-info">
            <input
              type="text"
              value={updatedTodoDescription}
              onChange={(e) => setUpdatedTodoDescription(e.target.value)}
            />
          </div>
          <div className="todo-actions">
            <button className="save-button" onClick={() => updateTodoDescription(todo.id)}>
              Save
            </button>
            <button className="cancel-button" onClick={cancelUpdate}>
              Cancel
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div key={todo.id} className="todo-row">
          <div className="todo-info">
            <h4>{todo.name}</h4>
            <p>{todo.description}</p>
          </div>
          <div className="todo-actions">
            <button className="update-button" onClick={() => {
              setUpdatedTodoId(todo.id);
              setUpdatedTodoDescription(todo.description); // Set current description
            }}>
              Update
            </button>
            <button className="delete-button" onClick={() => deleteTodoItem(todo.id)}>
              Delete
            </button>
          </div>
        </div>
      );
    }
  };
  
  

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="app-container">
          <header className="app-header">
            <h1>Riekert's Todo App</h1>
            <button onClick={signOut}>Sign Out</button>
          </header>
          <main className="app-content">
            <div className="todo-container">
              <h3>My Todo List</h3>
              <form onSubmit={createNewTodo} className='create-form'>
                <input
                  type="text"
                  placeholder="Todo Description"
                  value={newTodoDescription}
                  onChange={(e) => setNewTodoDescription(e.target.value)}
                />
                <button type="submit">Create</button>
              </form>
              {todos.map((todo) => renderTodoItem(todo))}
            </div>
          </main>
        </div>
      )}
    </Authenticator>
  );
}

export default withAuthenticator(App);
