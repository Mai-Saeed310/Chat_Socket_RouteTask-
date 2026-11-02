# Real-Time Chat App (Socket.IO)

A real-time chat application with a **Node.js / Express / TypeScript** back-end and a simple browser front-end. 
It supports one-to-one and group chats over **Socket.IO**, 
JWT authentication with email OTP verification, Google sign-up, and file uploads to **AWS S3**.

## Features
- **Real-time messaging** with Socket.IO
  - Private (one-to-one) chat between two users
  - Group chats with a name, an optional image, and rooms
  - Socket connections are authenticated with the same JWT used by the REST API
  - Each user's active socket IDs are tracked in Redis, so a user can be connected from several tabs/devices
- **Authentication & security**
  - Sign up with email confirmation by OTP (OTP is hashed in Redis and expires after 2 minutes)
  - Sign in with access token (1 hour) and refresh token (1 year)
  - Account is blocked for 5 minutes after 5 failed sign-in attempts
  - Forget / reset / update password, resend OTP, and log out
  - Sign up with Google
  - Separate secrets and token prefixes for `User` and `Admin` roles
  - `helmet`, `cors`, and rate limiting (100 requests per 15 minutes)
  - Request validation with Zod
- **File storage**: upload, list, download, pre-signed URLs, and delete files on AWS S3 (Multer for memory/disk upload)
- **Front-end**: a login page and a chat page (private and group conversations, notification sound)

## Tech Stack

| Area | Technology |
| --- | --- |
| Server | Node.js, Express 5, TypeScript |
| Real-time | Socket.IO |
| Database | MongoDB with Mongoose |
| Cache / sessions | Redis |
| Auth | JSON Web Tokens, bcrypt, Google Auth Library |
| Storage | AWS S3, Multer |
| Email | Nodemailer |
| Validation | Zod |
| Security | Helmet, CORS, express-rate-limit |
| Front-end | HTML, CSS, JavaScript, Axios, Socket.IO client |

## Project Structure

```
├── src/
│   ├── index.ts                 # entry point
│   ├── app.controller.ts        # Express app setup and routes
│   ├── models/                  # Mongoose models (user, chat)
│   ├── DB/                      # MongoDB connection and repositories
│   ├── modules/
│   │   ├── auth/                # sign up / sign in / password / files
│   │   ├── chat/                # chat REST routes, service and Socket.IO events
│   │   └── realtime/            # Socket.IO server and authentication
│   └── common/                  # middleware, enums, services (S3, Redis), email, security
├── SOCKET_CHAT_APP_FE/SOCKET_CHAT_APP/   # chat front-end (login + chat pages)
├── FE/                          # small Socket.IO test client
└── dist/                        # compiled JavaScript
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB and Redis
- An AWS S3 bucket, a Gmail/SMTP account, and a Google OAuth client ID (for the related features)

### Installation

```bash
git clone https://github.com/Mai-Saeed310/Chat_Socket_RouteTask-.git
cd Chat_Socket_RouteTask-
npm install
```

### Configuration

The code reads its settings from `src/config/config.service.ts`, and the `config/` folder is listed in `.gitignore`,
so you need to create it yourself. The settings it must export are:

| Name | Description |
| --- | --- |
| `PORT` | Server port (the front-end expects `3000`) |
| `DB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection URL |
| `SALT_ROUNDS` | bcrypt salt rounds |
| `PREFIX_USER`, `PREFIX_ADMIN` | Authorization prefixes (the front-end sends `user`) |
| `ACCESS_SECRET_KEY_USER`, `REFRESH_SECRET_KEY_USER` | JWT secrets for users |
| `ACCESS_SECRET_KEY_ADMIN`, `REFRESH_SECRET_KEY_ADMIN` | JWT secrets for admins |
| `EMAIL`, `PASSWORD` | Sender email account and app password |
| `CLIENT_ID` | Google OAuth client ID |
| `AWS_REGION`, `AWS_BUCKET_NAME`, `AWS_ACCESS_KEY`, `AWS_ACCESS_SECRET_KEY` | AWS S3 settings |

Example using `dotenv` (`src/config/config.service.ts`):

```ts
import dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({ path: resolve(`.env.${process.env.NODE_ENV || "development"}`) });

export const PORT = Number(process.env.PORT) || 3000;
export const DB_URI = process.env.DB_URI!;
export const REDIS_URL = process.env.REDIS_URL!;
export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
export const PREFIX_USER = process.env.PREFIX_USER!;
export const PREFIX_ADMIN = process.env.PREFIX_ADMIN!;
export const ACCESS_SECRET_KEY_USER = process.env.ACCESS_SECRET_KEY_USER!;
export const REFRESH_SECRET_KEY_USER = process.env.REFRESH_SECRET_KEY_USER!;
export const ACCESS_SECRET_KEY_ADMIN = process.env.ACCESS_SECRET_KEY_ADMIN!;
export const REFRESH_SECRET_KEY_ADMIN = process.env.REFRESH_SECRET_KEY_ADMIN!;
export const EMAIL = process.env.EMAIL!;
export const PASSWORD = process.env.PASSWORD!;
export const CLIENT_ID = process.env.CLIENT_ID!;
export const AWS_REGION = process.env.AWS_REGION!;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY!;
export const AWS_ACCESS_SECRET_KEY = process.env.AWS_ACCESS_SECRET_KEY!;
```

Then add a matching `.env.development` file with your real values. Never commit secrets.

### Run the server

```bash
# development (compiles with tsc in watch mode and restarts on changes)
npm run start:dev

# production mode
npm run start:prod
```

### Run the front-end

The front-end is plain HTML/JS and talks to `http://localhost:3000`.
Serve the `SOCKET_CHAT_APP_FE/SOCKET_CHAT_APP` folder with any static server (for example the VS Code **Live Server** extension), 
open `index.html`, sign in, and you will be redirected to the chat page.

## Authentication

Protected REST endpoints and the Socket.IO handshake use the same header value:

```
Authorization: <PREFIX> <access_token>
```

For Socket.IO, send it in the handshake:

```js
const socket = io("http://localhost:3000", {
  auth: { authorization: "user <access_token>" },
});
```

## REST API

### Auth — `/auth`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/sign-up` | No | Register and send a confirmation OTP by email |
| POST | `/auth/confirm-email` | No | Confirm the email with the OTP |
| POST | `/auth/resend-otp` | No | Resend the confirmation OTP |
| POST | `/auth/sign-in` | No | Sign in and receive access/refresh tokens |
| POST | `/auth/signup/gmail` | No | Sign up with a Google account |
| POST | `/auth/forgetPassword` | No | Send a password-reset OTP |
| POST | `/auth/resetPasswordOtp` | No | Reset the password using the OTP |
| POST | `/auth/updatePassword` | Yes | Change the password |
| POST | `/auth/logOut` | Yes | Log out |
| GET | `/auth/profile` | Yes | Get the profile with friends and groups |

### Chat

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/auth/:userId/chat` | Yes | Get the private chat with another user (last 5 messages) |
| POST | `/chat/create-group` | Yes | Create a group (`group`, `participants`, optional image in field `attachment`). Participants must be in your friends list |
| GET | `/chat/group/:groupId` | Yes | Get a group chat (last 5 messages) |

### Files (AWS S3) — `/auth`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/upload` | No | Upload a single image (field `attachment`) |
| POST | `/auth/upload-large` | Yes | Upload a large file from disk (field `attachment`) |
| POST | `/auth/upload-files` | Yes | Upload multiple files (field `attachments`) |
| POST | `/auth/upload-url` | Yes | Create a pre-signed upload URL |
| GET | `/auth/get-file/*path` | No | Get a file |
| GET | `/auth/get-files` | No | List files |
| GET | `/auth/pre-signed/*path` | No | Get a pre-signed download URL |
| DELETE | `/auth/delete` | No | Delete a file |
| DELETE | `/auth/deleteFiles` | No | Delete multiple files |
| DELETE | `/auth/deleteFolder` | No | Delete a folder |

## Socket.IO Events

**Client → server**

| Event | Payload | Description |
| --- | --- | --- |
| `sendMessage` | `{ sendTo, content }` | Send a private message (creates the chat on first message) |
| `join_room` | `{ roomId }` | Join a group room you belong to |
| `sendGroupMessage` | `{ groupId, content }` | Send a message to a group |
| `sayHi` | any | Simple test event |

**Server → client**

| Event | Payload | Description |
| --- | --- | --- |
| `successMessage` | `{ conversation }` | Sent to the sender's sockets after a message is saved |
| `newMessage` | `{ conversation, from, groupId? }` | Sent to the receiver (or to the group room) |

## Data Models

- **User**: first name, last name, email, password (hashed), age, phone, address, gender, role (`User` / `Admin`), provider (`System` / `Google`), profile picture, confirmed flag, and friends.
- **Chat**: participants, messages (content, sender, timestamps), and for groups: group name, group image and `roomId`.

## Notes

- Group creation requires the selected users to be in the creator's `friends` list. This repository has no endpoint for adding friends yet, so friends need to be set in the database.
- The `dist/` folder contains compiled output committed with the project.

## Author

Mai Saeed
GitHub: https://github.com/Mai-Saeed310

## License

ISC
