# Mutual Transfer Project

A modern authentication system built with React, Firebase, and Tailwind CSS.

## Features

- User registration and login
- Google authentication
- Password reset functionality
- Responsive design
- Form validation
- Loading states and error handling

## Tech Stack

- React + Vite
- Firebase Authentication
- Firebase Firestore
- Tailwind CSS
- React Router DOM

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd mutual-transfer-project
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Development

Run the development server:
```bash
npm run dev
```

## Building for Production

Build the project:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Deployment

This project can be deployed to various platforms:

### Vercel
1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

### Firebase Hosting
1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase:
```bash
firebase init
```

4. Deploy to Firebase:
```bash
firebase deploy
```

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication methods:
   - Email/Password
   - Google Sign-in
3. Set up Firestore database
4. Configure Firestore rules

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 