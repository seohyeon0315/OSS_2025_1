function setupAuthUI(){
    const loginBtn=document.getElementById("login-btn");
    const registerBtn=document.getElementById("register-btn");
    const logoutBtn=document.getElementById("logout-btn");

    auth.onAuthStateChanged(user => {
        if(user){
            console.log("로그인됨");
            if(loginBtn) loginBtn.style.display="none";
            if(registerBtn) registerBtn.style.display="none";
            if(logoutBtn) logoutBtn.style.display="inline-block";
        }
        else{
            console.log("로그아웃 상태");
            if(loginBtn) loginBtn.style.display="inline-block";
            if(registerBtn) registerBtn.style.display="inline-block";
            if(logoutBtn) logoutBtn.style.display="none";
        }
    })
   
};

function logout(){
    auth.signOut()
    .then(()=> {
      alert("로그아웃 되었습니다.");
      window.location.href="index.html"
    })
    .catch(err => alert("로그아웃 실패 : " + err.message));
}
