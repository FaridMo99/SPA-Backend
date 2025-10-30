# ⚙️ Friendly Backend

The backend for **Friendly** is a API server built with **Node.js** and **TypeScript**. It is designed for scalability and real-time interaction, featuring session-based authentication, a PostgreSQL database, real-time chat, and cloud-based asset management.

---

## ✨ Features

* **Session-Based Authentication:** User authentication is managed through **Passport.js Local Strategy**, with session data securely saved on **Redis** for fast, scalable access.
* **Email Verification:** Account integrity is possible through email verification by **Node-Mailjet**.
* **Real-Time Communication:** Utilizes **Socket.io** to establish a **real-time bidirectional connection** for real-time chat and instant updates.
* **Asset Management:** User-uploaded media (images) are handled by **Multer** and persisted to the cloud using **Cloudinary** for reliable storage and delivery.
* **Password Hashing:** Passwords are securely hashed using **Bcrypt**.
* **Schema Validation:** All incoming data is validated against schemas using **Zod** to maintain data integrity.
* **Data Persistence:** All relational data is stored in a **PostgreSQL** database and queried efficiently using the **Prisma ORM**.
* **System Integrity:** Comprehensive **process error handling** and extensive **logging** are implemented to ensure stability, quick debugging, and observability.

---

## 🛠️ Tech Stack

* **Node.js & Express:** The runtime environment and web framework for building the API.
* **TypeScript:** For static typing, enhanced code quality, and fewer runtime errors.
* **Prisma:** Modern, type-safe ORM for database interaction.
* **PostgreSQL:** The primary relational database for structured data.
* **Redis:** Used for high-speed session storage and caching.
* **Passport.js:** Middleware for handling session-based authentication.
* **Bcrypt:** Library for hashing and comparing user passwords.
* **Socket.io:** Enables real-time, bi-directional event-based communication.
* **Node-Mailjet:** Service for sending transactional emails (account verification).
* **Zod:** Schema declaration and validation library.
* **Multer:** Middleware for handling file uploads.
* **Cloudinary:** Cloud service for media storage and asset delivery.

---

## Frontend

[The Frontend Repository](https://github.com/FaridMo99/SPA)
