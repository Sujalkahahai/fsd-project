# **Experiment – 7**

## **Implementation of Real-Time Features using WebSockets and Socket.IO**

**Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**Class: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**Roll No.: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

## **1\. Aim**

To implement real-time communication in the Pathlog web application using WebSockets and Socket.IO by establishing a connection between the React frontend and Node.js backend and displaying real-time notifications for supported Pathlog activities.

## **2\. Problem Statement**

Implement real-time communication in the existing Pathlog application using Socket.IO. Pathlog remains a learning and study-tracking application; this experiment must not introduce EventHub or event-management functionality.

Develop a real-time notification mechanism for relevant actions that already exist in Pathlog, such as creating, updating or deleting documented learning resources or other supported learning records. The exact notification triggers must follow the existing Pathlog documentation and implemented features.

Integrate Socket.IO with the existing Express backend and React frontend, handle authenticated client connections and disconnections, and display notifications dynamically without requiring users to refresh the page. Notifications must be scoped to the relevant authenticated Pathlog user.

## **3\. Theory Questions**

Answer the following questions:

**1\. What are WebSockets? Explain their purpose.**

Answer: WebSockets are a communication protocol that provides a persistent, full-duplex connection between a client and a server over a single TCP connection. After the connection is established, both sides can send data independently without repeatedly creating new HTTP requests. WebSockets are useful for applications that need fast, two-way updates, such as live notifications, chat and collaborative interfaces.

**2\. What is Socket.IO? How is it different from WebSockets?**

Answer: Socket.IO is a JavaScript library that enables real-time, event-based communication between clients and servers. It commonly uses WebSocket when available and can fall back to other transports when necessary. It also provides features such as automatic reconnection, event names, rooms and namespaces. WebSocket is a communication protocol, whereas Socket.IO is a higher-level library with its own protocol and features; a plain WebSocket client cannot directly communicate with a Socket.IO server.

**3\. Differentiate between HTTP communication and WebSocket communication.**

Answer: HTTP generally follows a request-response model: the client sends a request and the server returns a response. For repeated updates, the client often has to send repeated requests or poll the server. WebSocket keeps a connection open so the client and server can both send messages at any time. HTTP is suitable for conventional API operations, while WebSocket is useful for immediate, continuous updates.

**4\. What is the purpose of socket.io and socket.io-client?**

Answer: The socket.io package is installed on the Node.js backend. It creates the Socket.IO server, manages client connections and emits or receives real-time events. The socket.io-client package is installed in the frontend. It connects the React application to the Socket.IO server and allows the browser to send and receive events.

**5\. Explain the purpose of io.on("connection") in Socket.IO.**

Answer: io.on("connection") registers a handler that runs whenever a client successfully connects to the Socket.IO server. The callback receives that client’s socket object. The server can use it to identify the connected user, join the socket to an appropriate room, register event handlers and log connection or disconnection activity.

**6\. What is the difference between socket.emit() and io.emit()?**

Answer: socket.emit() sends an event to one specific socket connection. io.emit() broadcasts an event to all currently connected sockets. For private Pathlog notifications, the server should normally emit to a room belonging to the authenticated user, rather than broadcasting personal information to every connected user.

**7\. What are connection and disconnection events in Socket.IO?**

Answer: The connection event occurs when a client establishes a Socket.IO connection with the server. It is used to register the socket, join rooms and set up event listeners. The disconnect event occurs when the client disconnects, closes the connection or loses connectivity. It can be used for logging and cleaning up connection-specific resources.

**8\. Why is useEffect() used when integrating Socket.IO with React?**

Answer: useEffect() is used to perform side effects in a React component, such as connecting to a Socket.IO server and registering event listeners. It allows the connection to be established when the relevant component or provider is mounted and listeners to be removed when it is unmounted or when dependencies change. This helps avoid duplicate listeners and memory leaks.

**9\. What is the purpose of socket.off() and socket.disconnect()?**

Answer: socket.off() removes a previously registered event listener. It is commonly used in a React effect cleanup function so the same handler is not registered multiple times. socket.disconnect() closes the client’s Socket.IO connection. Removing listeners and disconnecting when appropriate prevents unwanted background connections and duplicate notifications.

**10\. Explain how real-time notifications improve an Event Management System.**

Answer: Real-time notifications inform users immediately when relevant information changes, without requiring them to refresh the page. In a learning application such as Pathlog, the same principle can be used for updates related to documented learning activities or records. This makes the interface more responsive and keeps connected views up to date.

## **4\. Code**

The following snippets demonstrate the required Socket.IO integration in the context of Pathlog. They are illustrative: use the actual file paths, authentication mechanism, API controllers and documented Pathlog record types in the repository. Do not add EventHub, an Event model or event-management routes.

**1\. Installation of Socket.IO dependencies (backend and frontend)**

\# Run in the existing backend folder  
npm install socket.io

\# Run in the existing React/Vite frontend folder  
npm install socket.io-client

**2\. HTTP server creation and Socket.IO configuration in server.js**

// server/server.js \- integrate with the existing Express app  
const http \= require("http");  
const { Server } \= require("socket.io");  
const app \= require("./app"); // use the actual existing app export

const server \= http.createServer(app);  
const io \= new Server(server, {  
  cors: {  
    origin: process.env.CLIENT\_ORIGIN \|\| "http\://localhost:5173",  
    methods: \["GET", "POST"\],  
    credentials: true  
  }  
});

// Make the Socket.IO instance available to existing controllers  
app.set("io", io);

// Keep the existing database connection/startup flow.  
// Start this HTTP server only after the existing DB connection succeeds.  
module.exports \= { app, server, io };

**3\. Handling client connection and disconnection**

// Attach this after creating the Socket.IO server.  
// For a private learning app, authenticate the socket and join a user-specific room.  
const jwt \= require("jsonwebtoken");  
const User \= require("./models/User"); // use the existing user model path

io.use(async (socket, next) \=\> {  
  try {  
    const token \= socket.handshake.auth?.token;  
    if (\!token) return next(new Error("Authentication required"));  
    const payload \= jwt.verify(token, process.env.JWT\_SECRET);  
    const user \= await User.findById(payload.sub).select("\_id");  
    if (\!user) return next(new Error("User not found"));  
    socket.data.userId \= user.\_id.toString();  
    next();  
  } catch (err) {  
    next(new Error("Invalid or expired token"));  
  }  
});

io.on("connection", (socket) \=\> {  
  socket.join(socket.data.userId);  
  console.log("Pathlog client connected:", socket.id);

  socket.on("disconnect", (reason) \=\> {  
    console.log("Pathlog client disconnected:", socket.id, reason);  
  });  
});

**4\. Accessing Socket.IO in controllers using app.set("io", io)**

// Inside an existing authenticated Pathlog controller  
// Example: after a supported learning record has been saved successfully  
const io \= req.app.get("io");  
const userId \= req.user.\_id.toString();

io.to(userId).emit("pathlog:notification", {  
  id: savedRecord.\_id.toString(),  
  type: "resource.created",  
  title: "Resource added",  
  message: "Your learning resource was added successfully.",  
  createdAt: new Date().toISOString()  
});

// Use the actual authenticated user and existing controller data.  
// Never emit private learning data to every connected socket.

**5\. Emitting notifications for supported Pathlog record creation, update and deletion**

// Reuse this helper in existing Pathlog controllers.  
function notifyPathlogUser(req, notification) {  
  const io \= req.app.get("io");  
  if (\!io \|\| \!req.user?.\_id) return;  
  io.to(req.user.\_id.toString()).emit("pathlog:notification", {  
    ...notification,  
    createdAt: new Date().toISOString()  
  });  
}

// Call only after the relevant database operation succeeds.  
// Examples below use an existing Resource feature; adapt to the  
// actual documented Pathlog controller and schema.  
notifyPathlogUser(req, {  
  type: "resource.created",  
  title: "Resource added",  
  message: "A learning resource was added."  
});

notifyPathlogUser(req, {  
  type: "resource.updated",  
  title: "Resource updated",  
  message: "A learning resource was updated."  
});

notifyPathlogUser(req, {  
  type: "resource.deleted",  
  title: "Resource deleted",  
  message: "A learning resource was deleted."  
});

**6\. Establishing Socket.IO connection in React**

// client/src/services/socket.js  
import { io } from "socket.io-client";

export const socket \= io(import.meta.env.VITE\_API\_URL, {  
  autoConnect: false,  
  auth: (callback) \=\> {  
    // Read the token from the existing Pathlog auth/session mechanism.  
    callback({ token: getExistingAuthToken() });  
  }  
});

// getExistingAuthToken() represents the existing project's token accessor.  
// Do not create a second, conflicting authentication storage mechanism.

**7\. Listening for notifications and storing them using React state**

// Example inside the existing authenticated layout/provider  
import { useEffect, useState } from "react";  
import { socket } from "../services/socket";

function usePathlogNotifications(isAuthenticated) {  
  const \[notifications, setNotifications\] \= useState(\[\]);

  useEffect(() \=\> {  
    if (\!isAuthenticated) return;

    const handleNotification \= (notification) \=\> {  
      setNotifications((current) \=\> \[notification, ...current\]);  
    };

    socket.connect();  
    socket.on("pathlog:notification", handleNotification);

    return () \=\> {  
      socket.off("pathlog:notification", handleNotification);  
      socket.disconnect();  
    };  
  }, \[isAuthenticated\]);

  return notifications;  
}

**8\. Implementing NotificationBell and integrating it into Navbar**

// NotificationBell.jsx \- simple example using notifications from the hook  
function NotificationBell({ notifications }) {  
  const \[open, setOpen\] \= useState(false);

  return (  
    \<div className="notification-menu"\>  
      \<button onClick={() \=\> setOpen((value) \=\> \!value)}  
              aria-label="View notifications"\>  
        Notifications ({notifications.length})  
      \</button\>

      {open && (  
        \<div className="notification-dropdown"\>  
          {notifications.length \=== 0 ? (  
            \<p\>No new notifications\</p\>  
          ) : notifications.map((item, index) \=\> (  
            \<div key={item.id \|\| \`\${item.type}-\${item.createdAt}-\${index}\`}\>  
              \<strong\>{item.title}\</strong\>  
              \<p\>{item.message}\</p\>  
            \</div\>  
          ))}  
        \</div\>  
      )}  
    \</div\>  
  );  
}

// Render \<NotificationBell notifications={notifications} /\>  
// inside the existing Pathlog Navbar. Preserve its current design.

## **5\. Screenshots**

Insert genuine screenshots from the running Pathlog application. The examples must show only existing Pathlog features and the real-time notification layer. Do not include EventHub or event-management screens. Hide JWTs, passwords, database credentials and private user data.

**\[ INSERT SCREENSHOT 1 – A supported Pathlog record (for example, a documented learning resource) is created and the connected user receives a real-time notification. \]**

**\[ INSERT SCREENSHOT 2 – A supported Pathlog record is updated and the connected user receives a real-time notification. \]**

**\[ INSERT SCREENSHOT 3 – A supported Pathlog record is deleted and the connected user receives a real-time notification. \]**

**\[ INSERT SCREENSHOT 4 – Backend terminal showing successful Socket.IO client connection and disconnection logs. \]**

**\[ INSERT SCREENSHOT 5 – Pathlog Navbar notification bell displaying the notification count after a real notification is received. \]**

**\[ INSERT SCREENSHOT 6 – Pathlog notification dropdown displaying the received notifications. \]**

**Note: Use the actual Pathlog record types and screens documented in the project. Do not create unrelated Event Management features merely to obtain screenshots. Never expose tokens, passwords, connection strings or other sensitive information.**

## **6\. Result and Conclusion**

Result: Real-time communication is integrated into Pathlog using Socket.IO. The React client establishes an authenticated connection with the Node.js backend, and connected users receive notifications for supported Pathlog actions without refreshing the page. Confirm this result only after testing the actual implemented Pathlog workflows.

Conclusion: WebSockets and Socket.IO enable two-way, event-based communication between the frontend and backend. In Pathlog, authenticated, user-scoped notifications make relevant learning-record updates visible immediately while keeping each user’s information private.