# 💬 Real-Time Chat Application (Project-Based Learning)

This is a full-featured **real-time chat web application** built using **Node.js**, **Express**, **MongoDB**, and **MySQL** — designed and developed as part of my personal **project-based learning journey**.

The project aims to simulate production-grade systems, focus on backend, and covers a range of technologies including real-time communication, session management, containerization, and scalable architecture.

---

## 🧠 Purpose

This project is built not just to function as a chat app, but as a learning platform for mastering real-world backend and full-stack skills, including:

- Real-time communication via WebSockets
- Session handling with encryption and database persistence
- Multi-database architecture (SQL + NoSQL)
- Scalable deployment using Docker and Kubernetes -
    - |- **[not yet implemented]**
- Clean code structure (MVC pattern)
- Git version control and development best practices

---

## 🚀 Features

- 🔐 **security** – Register and login securely with session management
    - **|- [express session]**
    - **|- [parameterized queries to lower the risk of injection]**
    - **|- [proper sanitization using helmet for XSS]**
    - **|- [rate limiting]**
    - **|- [CORS]**
- 💬 **Private Messaging** – 1-on-1 direct chats between users
- 👥 **Group Messaging** – Join or create chat groups (MVP)
    - |- **[not yet implemented]**
- 📥 **Message Storage** – Uses MongoDB for flexible message handling
- 📄 **User Profiles** – SQL-based structured user and location information
- 🚫 **Blocking System** – Users can block others to prevent unwanted messages 
    - |- **[not yet implemented]**
- 🕒 **Timestamps** – All messages and activities are time-tracked
- 🧩 **Modular Codebase** – Follows an MVC-style structure for maintainability
    - |- **[refactor to OOP]**
- 🐳 **Dockerized** – Easily deployable using Docker containers
    - |- **[not yet implemented]**
- ☁️ **K8s Ready** – Built with container orchestration in mind

---

## 🛠️ Tech Stack

| Layer          | Technology                             |
|----------------|----------------------------------------|
| **Frontend**   | simpe ui and vanilla html, css, js     |
| **Backend**    | Node.js, Express.js, bun               |
| **Real-time**  | Socket.IO or WebSocket                 |
| **Database**   | MongoDB (NoSQL) + MySQL (SQL)          |
| **Auth & Sessions** | Express-Session, Cookies          |
| **DevOps**     | Docker, Kubernetes (planned), Git      |

---

## 📁 Project Structure (Simplified)


- **Refactor the root file** 
- src/
- ├── app.ts
- |
- ├── routes
- |   └── router.ts
- |
- ├── controller
- |   ├── user.controller.test.ts
- |   ├── user.controller.ts
- |   ├── auth
- |   |   ├── logout.controller.ts
- |   |   └── login.controller.ts
- |   └── signup
- |       ├── setp1
- |       |   ├── signup.controller.ts
- |       |   └── signup.controller.test.ts
- |       ├── step2
- |       |   ├── information.controller.ts
- |       |   └── information.controller.test.ts
- |       └── step3
- |           ├── location.controller.ts
- |           └── location.controller.test.ts
- |
- ├── db
- |   ├── mongodb
- |   |   └── mongodb.connection.ts
- |   └── mysql
- |       └── mysql.connection-pool.ts
- |
- ├── middleware
- |   ├── authentication.ts
- |   ├── rate.limit.ts
- |   ├── security.headers.ts
- |   └── session.ts
- |
- ├── model
- |   ├── message.model.ts
- |   ├── contact
- |   |   └── contact.list.model.ts
- |   ├── conversation
- |   |   └── conversation.model.ts
- |   └── user
- |       ├── user.model.ts
- |       ├── user.mongo.model.ts
- |       ├── user.sql.model.ts
- |       └── user.mongo.model.test.ts
- |
- ├── service
- |   ├── auth
- |   |   ├── password.service.ts
- |   |   └── password.service.test.ts
- |   ├── main.message
- |   |   ├── main.message.service.ts
- |   |   └── main.message.service.test.ts
- |   ├── message
- |   |   ├── message.socket.service.ts
- |   |   └── message.socket.service.test.ts
- |   └── user
- |       ├── user.service.ts
- |       └── user.service.test.ts
- |
- ├── socket
- |   ├── socket.server.ts
- |   ├── socket.server.test.ts
- |   └── event
- |       ├── message.event.ts
- |       ├── room.event.ts
- |       ├── message.event.test.ts
- |       └── room.event.test.ts
- |
- ├── types
- |   ├── contact.list.type.d.ts
- |   ├── conversation.list.type.d.ts
- |   ├── main.message.type.d.ts
- |   ├── message.type.d.ts
- |   ├── user.type.d.ts
- |   ├── express-session.d.ts
- |   └── session.d.ts
- |
- └── validation
-     └── user.signup.validation.ts
- 