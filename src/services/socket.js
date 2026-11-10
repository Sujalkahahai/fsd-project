import { io } from 'socket.io-client';

const TOKEN_KEY = 'pathlog-auth-token';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

// Create a singleton socket instance
export const socket = io({
  autoConnect: false,
  auth: (cb) => {
    cb({ token: getAuthToken() });
  },
});

