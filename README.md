# Evalio - AI-Powered Mock Interview Platform

<div align="center">

![Evalio Banner](https://img.shields.io/badge/Evalio-AI%20Interview%20Coach-6366f1?style=for-the-badge&logo=brain&logoColor=white)

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.2-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Practice real interviews with AI that understands your resume and role.**

[Live Demo](#) • [Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [API Docs](#api-documentation)

</div>

---

## 📋 Overview

Evalio is a full-stack AI-powered mock interview platform designed to help job seekers prepare for technical and behavioral interviews. The platform generates personalized interview questions based on your resume and target job description, conducts voice-based interviews, and provides detailed performance analytics.

### Key Highlights

- 🎯 **Personalized Questions** - AI generates questions tailored to your resume and job description
- 🎤 **Voice-to-Voice Interviews** - Natural conversation flow with speech recognition and synthesis
- 📊 **Detailed Analytics** - Performance metrics, skill gap analysis, and improvement tracking
- 🔐 **Secure Authentication** - JWT-based auth with Google OAuth integration
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

---

---

## ✨ Features

### For Candidates

| Feature               | Description                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| **Resume Parsing**    | Upload PDF/DOCX resumes - AI extracts skills and experience automatically |
| **Custom Interviews** | Generate interviews based on job role, experience level, and focus areas  |
| **Voice Interaction** | Speak naturally - the AI interviewer listens and responds in real-time    |
| **Live Feedback**     | Get confidence, pacing, and clarity metrics during the interview          |
| **Detailed Reports**  | Question-by-question analysis with scores and improvement suggestions     |
| **Interview History** | Track all past interviews and monitor progress over time                  |
| **Export to PDF**     | Download professional interview reports for reference                     |

### Technical Features

- 🔒 Password strength validation with visual feedback
- 🔑 Google OAuth single sign-on
- 📝 Rate limiting on sensitive endpoints
- 🛡️ Helmet.js security headers
- 🍪 HTTP-only cookie support
- 📱 Mobile-responsive UI

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React + Vite)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │  Components │  │      Context (Auth)     │  │
│  │  - Home     │  │  - Button   │  │  - User State           │  │
│  │  - SignIn   │  │  - Layout   │  │  - Token Management     │  │
│  │  - Interview│  │  - Protected│  │  - Google OAuth         │  │
│  │  - Report   │  │    Route    │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                            │                                     │
│                    ┌───────▼───────┐                            │
│                    │   API Layer   │                            │
│                    │  (api.js)     │                            │
│                    └───────────────┘                            │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Express.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Routes    │  │ Controllers │  │      Middleware         │  │
│  │  - /auth    │  │  - Auth     │  │  - JWT Verification     │  │
│  │  - /interview│ │  - Interview│  │  - File Upload (Multer) │  │
│  └─────────────┘  └─────────────┘  │  - Rate Limiting        │  │
│                                     └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐   │
│  │   Models    │  │              Services                    │   │
│  │  - User     │  │  - AI Question Generator (OpenAI API)   │   │
│  │  - Session  │  │  - Resume Parser (pdf-parse/mammoth)    │   │
│  └─────────────┘  └─────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────────┐
        │ MongoDB  │  │ Firebase │  │   OpenAI +   │
        │ Atlas    │  │  Auth    │  │   Deepgram   │
        └──────────┘  └──────────┘  └──────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology         | Purpose                         |
| ------------------ | ------------------------------- |
| **React 19**       | UI library with latest features |
| **Vite 7**         | Fast build tool and dev server  |
| **TailwindCSS 4**  | Utility-first CSS framework     |
| **React Router 7** | Client-side routing             |
| **Axios**          | HTTP client for API calls       |
| **Lucide React**   | Modern icon library             |
| **Firebase**       | Google OAuth authentication     |

### Backend

| Technology              | Purpose                    |
| ----------------------- | -------------------------- |
| **Node.js**             | JavaScript runtime         |
| **Express 5**           | Web framework              |
| **MongoDB + Mongoose**  | Database and ODM           |
| **JWT**                 | Token-based authentication |
| **bcryptjs**            | Password hashing           |
| **Multer**              | File upload handling       |
| **pdf-parse / mammoth** | Resume parsing (PDF/DOCX)  |
| **Helmet**              | Security headers           |
| **express-rate-limit**  | API rate limiting          |

### External Services

| Service                | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| **OpenAI GPT-4o-mini** | Question generation and answer evaluation |
| **Deepgram**           | AI voice model for speech processing      |
| **Firebase Auth**      | Google sign-in provider                   |
| **MongoDB Atlas**      | Cloud database hosting                    |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Firebase project with Google Auth enabled
- OpenAI API key
- Deepgram API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/shivaansh27/Evalio
   cd Evalio
   ```

2. **Install dependencies**

   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment variables**

   Create `server/.env`:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/evalio
   JWT_SECRET=your-super-secret-jwt-key
   CLIENT_URL=http://localhost:5173
   OPENAI_API_KEY=your-openai-api-key
   DEEPGRAM_API_KEY=your-deepgram-api-key
   ```

   Create `client/.env`:

   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. **Set up Firebase Admin SDK**

   Download your Firebase service account key and save it as:

   ```
   server/config/serviceAccountKey.json
   ```

5. **Start the development servers**

   ```bash
   # Terminal 1 - Start backend
   cd server
   npm run dev

   # Terminal 2 - Start frontend
   cd client
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint                | Description               | Auth Required |
| ------ | ----------------------- | ------------------------- | ------------- |
| `POST` | `/auth/signup`          | Register new user         | No            |
| `POST` | `/auth/signin`          | Login with email/password | No            |
| `POST` | `/auth/google`          | Login with Google OAuth   | No            |
| `GET`  | `/auth/profile`         | Get current user profile  | Yes           |
| `PUT`  | `/auth/profile`         | Update user profile       | Yes           |
| `PUT`  | `/auth/change-password` | Change password           | Yes           |

### Interview Endpoints

| Method | Endpoint                 | Description                       | Auth Required |
| ------ | ------------------------ | --------------------------------- | ------------- |
| `POST` | `/interview/setup`       | Create new interview session      | Yes           |
| `GET`  | `/interview/sessions`    | Get all user's interview sessions | Yes           |
| `GET`  | `/interview/session/:id` | Get specific session details      | Yes           |
| `POST` | `/interview/answer`      | Submit answer audio               | Yes           |
| `POST` | `/interview/end/:id`     | End interview session             | Yes           |

### Request/Response Examples

<details>
<summary><strong>POST /auth/signup</strong></summary>

**Request:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "message": "Account created successfully.",
  "user": {
    "id": "64f5a2b3c8e9d1a2b3c4d5e6",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

</details>

<details>
<summary><strong>POST /interview/setup</strong></summary>

**Request (multipart/form-data):**

```
resume: [PDF/DOCX file]
jobRole: "Software Engineer"
experienceLevel: "mid"
focusAreas: ["technical", "behavioral"]
```

**Response:**

```json
{
  "message": "Interview session created",
  "session": {
    "_id": "64f5a2b3c8e9d1a2b3c4d5e6",
    "jobRole": "Software Engineer",
    "questions": [...],
    "status": "in-progress"
  }
}
```

</details>

---

## 📁 Project Structure

```
evalio/
├── client/                    # React frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── protectedRoute.jsx
│   │   ├── context/          # React context providers
│   │   │   └── authContext.jsx
│   │   ├── lib/              # Utilities and API helpers
│   │   │   └── api.js
│   │   ├── pages/            # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── SignIn.jsx
│   │   │   ├── SignUp.jsx
│   │   │   ├── SetupInterview.jsx
│   │   │   ├── LiveInterview.jsx
│   │   │   ├── InterviewReport.jsx
│   │   │   ├── InterviewHistory.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Profile.jsx
│   │   ├── App.jsx           # Main app with routing
│   │   └── main.jsx          # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Express backend
│   ├── config/
│   │   ├── connectDb.js      # MongoDB connection
│   │   └── firebaseAdmin.js  # Firebase Admin setup
│   ├── controllers/
│   │   ├── authController.js
│   │   └── interviewController.js
│   ├── middleware/
│   │   ├── authMiddleware.js # JWT verification
│   │   ├── uploadResume.js   # Multer config for resumes
│   │   └── uploadAnswerAudio.js
│   ├── models/
│   │   ├── user.js
│   │   └── interviewSession.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── interviewRoutes.js
│   ├── services/
│   │   └── aiQuestionGenerator.js  # Gemini AI integration
│   ├── utils/
│   │   └── parseResume.js
│   ├── uploads/              # Uploaded files (gitignored)
│   ├── index.js              # Server entry point
│   └── package.json
│
└── README.md
```

---

## 🔒 Security

Evalio implements comprehensive security measures across the application:

### Authentication & Authorization

| Measure                 | Implementation                                            |
| ----------------------- | --------------------------------------------------------- |
| **Password Hashing**    | bcrypt with 10 salt rounds                                |
| **Password Validation** | 8+ chars, uppercase, lowercase, number, special character |
| **JWT Tokens**          | Signed with secret key, 7-day expiry                      |
| **Protected Routes**    | Middleware validates JWT on every protected endpoint      |
| **Google OAuth**        | Firebase Admin SDK verifies tokens server-side            |

### API Security

| Measure              | Implementation                                           |
| -------------------- | -------------------------------------------------------- |
| **Rate Limiting**    | 100 requests/15 min (general), 10 requests/15 min (auth) |
| **Security Headers** | Helmet.js (CSP, X-Frame-Options, HSTS, etc.)             |
| **CORS**             | Whitelist of allowed origins only                        |
| **Input Validation** | MongoDB ObjectId validation, type checking               |
| **JSON Body Limit**  | 10MB max payload size                                    |

### File Upload Security

| Measure                   | Implementation                                          |
| ------------------------- | ------------------------------------------------------- |
| **MIME Type Validation**  | Whitelist: PDF, DOCX (resumes); audio formats (answers) |
| **Extension Validation**  | Double-checks file extension matches MIME type          |
| **Size Limits**           | 5MB for resumes, 15MB for audio files                   |
| **Filename Sanitization** | Strips special characters, adds unique prefix           |
| **Storage Isolation**     | Uploaded files stored outside web root                  |

### Database Security

| Measure                 | Implementation                                      |
| ----------------------- | --------------------------------------------------- |
| **ObjectId Validation** | All IDs validated before database queries           |
| **No Raw Queries**      | Mongoose ODM prevents SQL/NoSQL injection           |
| **Schema Validation**   | Required fields, type enforcement, enum constraints |

### Security Audit Status

✅ **Last Audited**: No critical vulnerabilities found  
✅ **Dependencies**: All using recent stable versions  
✅ **Authentication**: Secure password handling and token management  
✅ **Authorization**: Proper user ownership checks on resources

---

## 🧪 Running Tests

```bash
# Run client tests
cd client
npm test

# Run server tests
cd server
npm test
```

---

## 🎓 What I Learned

Building Evalio was an incredible learning experience. Here are the key takeaways:

### Technical Skills

- **Full-Stack Development**: Building a complete application from database design to user interface
- **Authentication Patterns**: Implementing JWT-based auth with refresh tokens, Google OAuth, and secure password handling
- **AI Integration**: Working with OpenAI GPT-4o-mini for question generation and Deepgram for voice processing
- **File Processing**: Parsing PDFs and DOCX files to extract structured data
- **Real-time Features**: Implementing voice recording, playback, and speech synthesis
- **Security Best Practices**: Rate limiting, password hashing, HTTP-only cookies, and input validation

### Soft Skills

- **Problem Solving**: Debugging complex issues across the full stack
- **Documentation**: Writing clear technical documentation for future maintainability
- **Project Planning**: Breaking down features into manageable tasks
- **User Experience**: Designing intuitive interfaces for non-technical users

### Challenges Overcome

1. **Voice Processing**: Getting speech recognition to work reliably across browsers
2. **PDF Parsing**: Handling various resume formats and extracting relevant information
3. **State Management**: Managing complex form states and multi-step workflows
4. **Performance**: Optimizing AI API calls and implementing proper loading states

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

**Shivansh Sharma** - [shivanshsharma2704@gmail.com](mailto:shivanshsharma2704@gmai.com)

Project Link: [https://github.com/shivaansh27/Evalio](https://github.com/shivaansh27/Evalio)

---

<div align="center">

**Built with ❤️ for job seekers everywhere**

⭐ Star this repo if you found it helpful!

</div>
