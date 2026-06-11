// Sentinel Dashboard - Firebase Configuration
// Replace these placeholders with your actual Firebase Project config details:
const firebaseConfig = {
  apiKey: "AIzaSyCvUhJcB20lwo3qvOFM0lAopwRVNOMWVX4",
  authDomain: "my-sentinel-5e573.firebaseapp.com",
  projectId: "my-sentinel-5e573",
  storageBucket: "my-sentinel-5e573.firebasestorage.app",
  messagingSenderId: "734370576144",
  appId: "1:734370576144:web:a42aed0c6e977dcf891795"
};
// Check if Firebase credentials have been configured by the user
function isFirebaseConfigured() {
    return (
        typeof firebaseConfig !== "undefined" &&
        firebaseConfig.apiKey &&
        firebaseConfig.apiKey.trim() !== "" &&
        firebaseConfig.databaseURL &&
        firebaseConfig.databaseURL.trim() !== ""
    );
}
