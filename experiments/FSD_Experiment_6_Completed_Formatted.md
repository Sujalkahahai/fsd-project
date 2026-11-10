# **Experiment – 6**

## **Implementation of JWT Authentication and Role-Based Authorization**

**Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**Class: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**Roll No.: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

## **1\. Aim**

To implement user authentication using JSON Web Tokens (JWT) and role-based authorization in a web application using React, Node.js, Express.js and MongoDB.

## **2\. Problem Statement**

Implement a secure authentication system in the existing Event Management System or Mini Project Application.

Develop user registration and login functionality, securely store passwords using hashing, generate and verify JWT tokens, and implement role-based access control to restrict access to protected routes and administrative operations.

Integrate authentication with the React frontend and test the functionality using Postman.

## **3\. Theory Questions**

Answer the following questions:

**1\. What is JWT? Explain its structure and purpose.**

Answer: JWT (JSON Web Token) is a compact, URL-safe token used to transfer claims between parties. In web applications, it is commonly used to represent a user's authenticated identity after login. A JWT has three Base64URL-encoded parts separated by dots: the header (token type and signing algorithm), payload (claims such as user ID, role and expiry), and signature (used to verify that the token was issued by a trusted server and has not been altered). The payload is encoded, not encrypted, so sensitive information must not be placed in it.

**2\. Differentiate between authentication and authorization.**

Answer: Authentication verifies who a user is, usually through credentials such as an email and password. Authorization determines what an authenticated user is allowed to access or do. For example, logging in is authentication, while checking whether the logged-in user has the admin role before allowing access to an admin page is authorization.

**3\. Why are passwords hashed? What is the purpose of bcrypt?**

Answer: Passwords are hashed so the application does not store users' original passwords. A secure password hash is one-way and is checked during login rather than decrypted. bcrypt is a password-hashing library that uses a salt and a configurable work factor to make password guessing more expensive. Passwords should be hashed with bcrypt before saving a user and compared with bcrypt.compare() during login.

**4\. Explain the purpose of JWT signing and verification.**

Answer: JWT signing creates a cryptographic signature using a server-side secret (or private key). It helps ensure that the token was issued by the server and that its contents have not been modified. Verification checks the signature and validates token claims such as expiry. The server should reject tokens with an invalid signature, malformed content or expired time.

**5\. What is middleware in Express.js? Explain its role in JWT authentication.**

Answer: Middleware is a function that runs during the request-response cycle and can inspect or modify the request, response, or pass control to the next middleware using next(). In JWT authentication, middleware reads the token from the Authorization header, verifies it, identifies the user and attaches the user's information to the request. Protected routes then use that information to decide whether access is allowed.

**6\. What is the purpose of Bearer Token in the Authorization header?**

Answer: A Bearer Token is an access token sent by the client in the HTTP Authorization header, usually in the format Authorization: Bearer \<token\>. The server extracts and verifies the token before allowing access to protected resources. Anyone possessing a valid bearer token can use it, so it must be transmitted over HTTPS and kept private.

**7\. Differentiate between HTTP status codes 401 and 403\.**

Answer: 401 Unauthorized means the request does not contain valid authentication credentials, for example when the token is missing, invalid or expired. 403 Forbidden means the server understands who the user is but the user does not have sufficient permission to access the requested resource, for example a normal user attempting an admin-only operation.

**8\. What is role-based access control (RBAC)?**

Answer: Role-Based Access Control (RBAC) is an authorization approach in which permissions are assigned to roles and users are assigned one or more roles. The application checks a user's role before allowing access to protected resources. For example, a user role may be allowed to view events, while an admin role may also create, update or delete events. Role checks must be enforced on the backend, not only hidden in the frontend.

## **4\. Code**

The following representative snippets demonstrate the required JWT authentication and role-based authorization. Adapt import paths and field names to the existing Pathlog project. Keep secrets in environment variables and never include real credentials in submitted code.

**1\. Configuration of JWT secret and expiry in the .env file**

\# server/.env (example placeholders only; do not replace existing secrets)  
JWT\_SECRET=\<use-a-long-random-secret\>  
JWT\_EXPIRES\_IN=1d

\# Keep .env out of Git. Never print or commit the actual secret.

**2\. Creation of the User model using Mongoose**

// server/models/User.js  
const mongoose \= require("mongoose");

const userSchema \= new mongoose.Schema({  
  name: { type: String, required: true, trim: true },  
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },  
  password: { type: String, required: true, select: false },  
  role: { type: String, enum: \["user", "admin"\], default: "user" }  
}, { timestamps: true });

module.exports \= mongoose.model("User", userSchema);

**3\. Password hashing and JWT generation during registration and login**

// Illustrative service logic  
const bcrypt \= require("bcrypt");  
const jwt \= require("jsonwebtoken");  
const User \= require("../models/User");

async function register({ name, email, password }) {  
  const existing \= await User.findOne({ email });  
  if (existing) throw new Error("Email already registered");

  const hashedPassword \= await bcrypt.hash(password, 12);  
  const user \= await User.create({ name, email, password: hashedPassword });  
  return user;  
}

function createToken(user) {  
  return jwt.sign(  
    { sub: user.\_id.toString(), role: user.role },  
    process.env.JWT\_SECRET,  
    { expiresIn: process.env.JWT\_EXPIRES\_IN \|\| "1d" }  
  );  
}

// Login: retrieve password explicitly, then compare it  
async function login(email, password) {  
  const user \= await User.findOne({ email }).select("+password");  
  if (\!user \|\| \!(await bcrypt.compare(password, user.password)))  
    throw new Error("Invalid email or password");

  return { token: createToken(user), user: {  
    id: user.\_id, name: user.name, email: user.email, role: user.role  
  }};  
}

**4\. JWT verification and authentication middleware**

// server/middleware/auth.js  
const jwt \= require("jsonwebtoken");  
const User \= require("../models/User");

async function protect(req, res, next) {  
  try {  
    const header \= req.headers.authorization \|\| "";  
    const \[scheme, token\] \= header.split(" ");  
    if (scheme \!== "Bearer" \|\| \!token)  
      return res.status(401).json({ message: "Authentication required" });

    const payload \= jwt.verify(token, process.env.JWT\_SECRET);  
    const user \= await User.findById(payload.sub).select("\_id name email role");  
    if (\!user) return res.status(401).json({ message: "User no longer exists" });

    req.user \= user;  
    next();  
  } catch (err) {  
    return res.status(401).json({ message: "Invalid or expired token" });  
  }  
}

module.exports \= { protect };

**5\. Role-based authorization using protect and adminOnly middleware**

// server/middleware/authorize.js  
function adminOnly(req, res, next) {  
  if (\!req.user) return res.status(401).json({ message: "Authentication required" });  
  if (req.user.role \!== "admin")  
    return res.status(403).json({ message: "Admin access required" });  
  next();  
}

module.exports \= { adminOnly };

// Example: router.delete("/events/:id", protect, adminOnly, deleteEvent);

**6\. Creation of authentication routes (Register, Login and Get Current User)**

// server/routes/auth.js — concise route example  
const express \= require("express");  
const bcrypt \= require("bcrypt");  
const jwt \= require("jsonwebtoken");  
const User \= require("../models/User");  
const { protect } \= require("../middleware/auth");  
const router \= express.Router();

router.post("/register", async (req, res, next) \=\> {  
  try {  
    const { name, email, password } \= req.body;  
    if (\!name \|\| \!email \|\| \!password \|\| password.length \< 8\)  
      return res.status(400).json({ message: "Valid name, email and password (8+ chars) required" });  
    const exists \= await User.findOne({ email });  
    if (exists) return res.status(409).json({ message: "Email already registered" });  
    const hashed \= await bcrypt.hash(password, 12);  
    const user \= await User.create({ name, email, password: hashed });  
    const token \= jwt.sign({ sub: user.id, role: user.role },  
      process.env.JWT\_SECRET, { expiresIn: process.env.JWT\_EXPIRES\_IN \|\| "1d" });  
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });  
  } catch (err) { next(err); }  
});

router.post("/login", async (req, res, next) \=\> {  
  try {  
    const user \= await User.findOne({ email: req.body.email }).select("+password");  
    if (\!user \|\| \!(await bcrypt.compare(req.body.password \|\| "", user.password)))  
      return res.status(401).json({ message: "Invalid email or password" });  
    const token \= jwt.sign({ sub: user.id, role: user.role },  
      process.env.JWT\_SECRET, { expiresIn: process.env.JWT\_EXPIRES\_IN \|\| "1d" });  
    res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });  
  } catch (err) { next(err); }  
});

router.get("/me", protect, (req, res) \=\> res.status(200).json({ user: req.user }));

module.exports \= router;

**7\. Integration of authentication APIs with the React frontend**

// Example login handler in React  
async function handleLogin(email, password) {  
  const response \= await fetch("http\://localhost:5000/api/auth/login", {  
    method: "POST",  
    headers: { "Content-Type": "application/json" },  
    body: JSON.stringify({ email, password })  
  });  
  const result \= await response.json();  
  if (\!response.ok) throw new Error(result.message \|\| "Login failed");

  // Prefer a secure HttpOnly cookie for production.  
  // If this coursework implementation uses bearer tokens, follow its existing token-storage design.  
  setCurrentUser(result.user);  
  return result;  
}

// Authenticated request example:  
fetch("http\://localhost:5000/api/auth/me", {  
  headers: { Authorization: \`Bearer \${token}\` }  
});

**8\. Implementation of protected frontend routes and role-based access**

// Example React route guard  
function ProtectedRoute({ user, children }) {  
  if (\!user) return \<Navigate to="/login" replace /\>;  
  return children;  
}

function AdminRoute({ user, children }) {  
  if (\!user) return \<Navigate to="/login" replace /\>;  
  if (user.role \!== "admin") return \<Navigate to="/" replace /\>;  
  return children;  
}

// Example usage:  
// \<Route path="/profile" element={\<ProtectedRoute user={user}\>\<Profile /\>\</ProtectedRoute\>} /\>  
// \<Route path="/admin" element={\<AdminRoute user={user}\>\<AdminDashboard /\>\</AdminRoute\>} /\>

// Backend authorization remains mandatory; frontend route guards are not security boundaries.

## **5\. Screenshots**

Insert genuine screenshots from your running Pathlog application and Postman tests. Use the placeholders below. Hide passwords, JWT secrets, full tokens and other sensitive information. For token-based Postman requests, show only a masked or partially hidden token if the interface allows it.

**A. Postman Authentication Testing**

**\[ INSERT SCREENSHOT 1 – POST registration request with successful response (201 Created). \]**

**\[ INSERT SCREENSHOT 2 – POST login request with successful response and token (mask the token). \]**

**\[ INSERT SCREENSHOT 3 – GET current-user endpoint with a valid Bearer token (200 OK). \]**

**\[ INSERT SCREENSHOT 4 – Login with invalid credentials showing the expected error (401 Unauthorized). \]**

**\[ INSERT SCREENSHOT 5 – Accessing a protected endpoint without a token (401 Unauthorized). \]**

**\[ INSERT SCREENSHOT 6 – Accessing an admin-only endpoint using a normal user's token (403 Forbidden). \]**

**B. Role-Based Authorization**

**\[ INSERT SCREENSHOT 7 – Successful access to an admin endpoint using an admin token (200 OK). \]**

**\[ INSERT SCREENSHOT 8 – MongoDB Atlas users collection showing registered users and roles. Hide password hashes and personal information. \]**

**C. Frontend Integration**

**\[ INSERT SCREENSHOT 9 – Registration page. \]**

**\[ INSERT SCREENSHOT 10 – Login page. \]**

**\[ INSERT SCREENSHOT 11 – Successful login showing the updated navbar/user state. \]**

**\[ INSERT SCREENSHOT 12 – Protected page and admin-only access restriction in the frontend. \]**

**Note: Never expose passwords, password hashes, JWT secrets, complete access tokens, database credentials or other sensitive information in screenshots or submitted code.**

## **6\. Result and Conclusion**

Result: JWT-based registration and login, password hashing, token verification and role-based authorization are implemented in the web application. The React frontend communicates with the authentication APIs, and protected operations are restricted according to the authenticated user's role. Confirm this result only after running the application and completing the required Postman checks.

Conclusion: JWT provides a way to authenticate API requests, bcrypt protects stored passwords through one-way hashing, and Express middleware verifies tokens and enforces role-based permissions. Combining backend authorization with frontend route guards provides an integrated authentication experience.