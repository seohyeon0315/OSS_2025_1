const firebaseConfig = {
  apiKey: "AIzaSyCZsE3ANyZgweRKMBXXFNO6kxK2b5sw4a0",
  authDomain: "tripiary-cbdea.firebaseapp.com",
  projectId: "tripiary-cbdea",
  storageBucket: "tripiary-cbdea.firebasestorage.app",
  messagingSenderId: "31164671773",
  appId: "1:31164671773:web:6b637c8b21626a3b2c63f4",
  measurementId: "G-TMTYQEKVYD"
}; 
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const FieldValue=firebase.firestore.FieldValue;

auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
  .then(() =>
    console.log("세션 지속성 설정 완료"))
  .catch(err => console.error("지속성 설정 실패:",err));
