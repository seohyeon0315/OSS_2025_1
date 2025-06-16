let allCourses =[];

document.addEventListener("DOMContentLoaded", () => {
db.collection("courses")
  .where("isPublic", "==", true)
  .orderBy("timestamp", "desc")
  .get()
  .then(async snapshot => {
    allCourses = [];

    snapshot.forEach(doc => {
      allCourses.push(doc.data());
    });

    const favoriteTitles = await getFavoriteTitles();
    renderCourses(allCourses, favoriteTitles);
  })
  .catch(err => {
    console.error("공개 코스 불러오기 실패:", err);
  });

 function getDefaultImageUrl(title) {
  if (title.includes("부산")){
    return "https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcRbmOQmP-om9t7L26GUF3Oc1c_K2EsySAK5-nw0NXSSUweF7GoAWKS6AZ94ObCdL5iSiQTYA_hIvnIZnm607BssI17x2wBrODBs2mM_3g";
  }
  if (title.includes("서울")){
    return "/image/seoul.png";
  }
    if (title.includes("경주")){
    return "https://lh3.googleusercontent.com/gps-cs-s/AC9h4npR1cjFu-GWj6HX3IbYTcP-ZsOcQEgFykLcaKbdf63TFswvFdFfKqIPAcuBI0p5rrh2zWJsGOn6kp4C4cgZ_CypCX67e7uwOUYRUnQ0suShwoQTVYcMnNMQZ3mdSKYbjywUdg=w608-h351-n-k-no";
    }
    if(title.includes("대구")){

    return "/image/daegu.png";
    }
  return "/image/default.png";  
}

function renderCourses(courseList,favoriteTitles) {
  favoriteTitles=favoriteTitles || [];
  const container = document.getElementById("publicCourseList");
  container.innerHTML = "";

  courseList.forEach(data => {
    const card = document.createElement("div");
    card.className = "course-card";

    const img = document.createElement("img");
    const fallbackImg = getDefaultImageUrl(data.title || "");
    console.log("[이미지 URL]", data.imageUrl || fallbackImg);
    img.src = data.imageUrl || fallbackImg;

    const author = document.createElement("div");
    author.className = "author";
    author.textContent = `@${data.userId}`;

    const title = document.createElement("h4");
    title.textContent = data.title || "제목 없음";

    const desc = document.createElement("p");
    const summary = (data.points || []).map(p => p.title).join(" -> ");
    desc.textContent = summary || "장소 없음";

    const heart = document.createElement("button");
    heart.className = "heart";
    heart.innerHTML = "♡";

    const isFav=favoriteTitles.includes(data.title);
    heart.innerHTML = isFav ? "♥" : "♡";


    heart.addEventListener("click",async()=>{
      const user=firebase.auth().currentUser;
      if(!user){
        alert("로그인이 필요합니다.");
        return;
      }

      const favRef=db.collection("users").doc(user.uid).collection("favorites").doc(data.title);
      const doc=await favRef.get();

      if(doc.exists){ //이미 즐겨찾기 된 상태
        await removeFromFavorites(data.title);
        heart.textContent="♡";
      }else{
        await addToFavorites(data.title);
        heart.textContent="♥";
      }
    })

    const button = document.createElement("button");
    button.className = "course-button";
    button.textContent = "코스 구경하기";
    button.onclick = () => {
      localStorage.setItem("selectedPublicCourse",JSON.stringify(data));
      window.location.href="PublicCourseDetail.html";
    };

    card.appendChild(author);
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(heart);
    card.appendChild(button);

    container.appendChild(card);
  });
}

//키워드 검색 필터링
window.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("courseSearchInput");
  const button = document.getElementById("courseSearchBtn");

  function handleSearch() {
    if (!input) return;

    const keyword = input.value.trim().toLowerCase();

    const filtered = allCourses.filter(course =>
      course.title.toLowerCase().includes(keyword) ||
      (course.points || []).some(p => p.title.toLowerCase().includes(keyword))
    );

    Courses(filtered);
  }

  if (input) {
    input.addEventListener("input", handleSearch);
    input.addEventListener("keypress", e => {
      if (e.key === "Enter") handleSearch();
    });
  }

  if (button) {
    button.addEventListener("click", handleSearch);
  }
});

function addToFavorites(courseTitle){
  const user=firebase.auth().currentUser;
  if(!user){
    alert("로그인이 필요합니다.");
    return;
  }

  const userId=user.uid;
  const favRef=db.collection("users").doc(userId).collection("favorites").doc(courseTitle);
  
  return favRef.set({
    title:courseTitle,
    createAt:FieldValue.serverTimestamp()
  }).then(()=>{
    console.log("즐겨찾기 추가됨.");
  }).catch(error=>{
    console.error("즐겨찾기 추가 실패 : ",error);
  });
}

function removeFromFavorites(courseTitle){
  const user=firebase.auth().currentUser;
  if(!user) return;
  const userId=user.uid;
  const favRef=db.collection("users").doc(userId).collection("favorites").doc(courseTitle);

  favRef.delete().then(()=>{
    console.log("즐겨찾기 제거됨");
  }).catch(error=>{
    console.error("즐겨찾기 제거 실패 : ",error);
  })
}

let isShowingFavorites = false;

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleFavorites");
  if (!toggleBtn) {
    console.warn("toggleFavorites 버튼이 아직 DOM에 없음");
    return;
  }

  toggleBtn.addEventListener("click", async () => {
    const user = firebase.auth().currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const favSnapshot = await db.collection("users").doc(user.uid).collection("favorites").get();
    const favoriteTitles = favSnapshot.docs.map(doc => doc.id);

    isShowingFavorites = !isShowingFavorites;

    if (isShowingFavorites) {
      const filtered = allCourses.filter(course => favoriteTitles.includes(course.title));
      renderCourses(filtered,favoriteTitles);
    } else {
      renderCourses(allCourses,favoriteTitles);
    }
  });
});
});



function loadPublicCourses() {
  const favorites = getFavorites();
  const courseContainer = document.getElementById("publicCourseList");

  db.collection("courses")
    .where("isPublic", "==", true)
    .get()
    .then(snapshot => {
      courseContainer.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        const isFavorited = favorites.includes(id);

        const courseEl = document.createElement("div");
        courseEl.className = "course-card"; 

        courseEl.innerHTML = `
          <img src="${data.thumbnail || 'default.jpg'}" class="course-img" alt="${data.title}">
          <div class="course-info">
            <h3>${data.title}</h3>
            <p>작성자: ${data.userId}</p>
            <button class="heart-icon ${isFavorited ? "favorited" : ""}" onclick="toggleFavorite('${id}')">♥</button>
          </div>
        `;

        courseContainer.appendChild(courseEl);
      });
    });
}

async function getFavoriteTitles() {
  const user = firebase.auth().currentUser;
  if (!user) return [];
  const favSnapshot = await db.collection("users").doc(user.uid).collection("favorites").get();
  return favSnapshot.docs.map(doc => doc.id);
}