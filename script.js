

function goToMyCourse() {
  auth.onAuthStateChanged(user => {
    if (user) {
      // 로그인 상태
      window.location.href = "MyCourse.html";
    } else {
      // 비로그인 상태
      alert("로그인이 필요합니다!");
      window.location.href = "login.html";
    }
  });
}


function register(event){
  event.preventDefault();
  const email=document.getElementById("regEmail").value;
  const password=document.getElementById("regPw").value;
  auth.createUserWithEmailAndPassword(email,password)
    .then(()=>{
      alert("회원가입 성공");
      window.location.href="login.html";
    })
    .catch(err=>{
      alert("회원가입 실패: " + err.message);
    });

}

function login(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPw").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("로그인 성공!");
      window.location.href = "index.html";
    })
    .catch(err => {
      alert("로그인 실패: " + err.message);
    });
}


