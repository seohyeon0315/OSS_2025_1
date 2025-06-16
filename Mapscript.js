let courseData={};
let markers=[];
let map;
let currentEditingCourse="";
let currentInfoWindow=null;
let mapClickListenerAdded = false;


window.onload = function () {
  kakao.maps.load(function () {
    const container = document.getElementById('map');
    const options = {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 3
    };

    map = new kakao.maps.Map(container, options);
  });
};


function updateCourseList() {
  const list = document.getElementById("course-list");
  list.innerHTML = "";

  for (let name in courseData) {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    li.style.padding="8px 12px";
    //li.style.borderBottom="1px solid #eee";

    // 왼쪽: 코스 이름
    const nameSpan = document.createElement("span");
    nameSpan.textContent = name;
    nameSpan.style.cursor = "pointer";
    nameSpan.onclick = () => showCourse(name);

    // 오른쪽: 버튼 묶음
    const btnGroup = document.createElement("div");
    btnGroup.style.display = "flex";
    btnGroup.style.gap = "13px"; // 수정/삭제 간 간격

    const editBtn = document.createElement("button");
    editBtn.textContent = "수정";
    editBtn.style.background = "none";
    editBtn.style.border = "none";
    editBtn.style.color = "#007bff";
    editBtn.style.textDecoration = "underline";
    editBtn.style.cursor = "pointer";
    editBtn.style.fontSize = "0.9rem";
    editBtn.onclick = () => openSearchUI(name);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.style.background = "none";
    deleteBtn.style.border = "none";
    deleteBtn.style.color = "#cc0000";
    deleteBtn.style.textDecoration = "underline";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.fontSize = "0.9rem";
    deleteBtn.onclick = () => {
      if(currentInfoWindow) currentInfoWindow.close();

      if (confirm(`'${name}' 코스를 삭제할까요?`)) {
        const user=firebase.auth().currentUser;
        if(user){
          const courseId=`${user.uid}_${name}`;

          const userCourseRef=db.collection("courses").doc(courseId);
          const publicCourseRef=db.collection("public_courses").doc(courseId);

          Promise.all([
            userCourseRef.delete(),
            publicCourseRef.delete()
          ])
            .then(() => {
              delete courseData[name];
              updateCourseList();
              clearMarkers();
              document.getElementById("course-place-box").style.display = "none";
              alert(`'${name}' 코스와 공개 코스가 삭제되었습니다.`);
            })
            .catch((err) => {
              alert("코스 삭제 실패: " + err);
            });
        }
      }
    };

    const publicToggle=document.createElement("input");
    publicToggle.type="checkbox";
   
    if (courseData[name]._isPublic === undefined) {
      courseData[name]._isPublic = false;
    }

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = courseData[name]._isPublic ? "공개됨" : "비공개";
    toggleBtn.style.background = courseData[name]._isPublic ? "#4caf50" : "#ccc";
    toggleBtn.style.color = "#fff";
    toggleBtn.style.border = "none";
    toggleBtn.style.padding = "6px 10px";
    toggleBtn.style.marginLeft = "10px";
    toggleBtn.style.borderRadius = "10px";
    toggleBtn.style.cursor = "pointer";

    toggleBtn.onclick = () => {
      const user = firebase.auth().currentUser;

      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }
  const newStatus = !courseData[name]._isPublic;
      db.collection("courses").doc(`${user.uid}_${name}`).update({
        isPublic: newStatus
      }).then(() => {
        courseData[name]._isPublic = newStatus;
        toggleBtn.textContent = newStatus ? "공개됨" : "비공개";
        toggleBtn.style.background = newStatus ? "#4caf50" : "#ccc";
      }).catch((err) => {
        console.error("공개 상태 변경 실패:", err);
        alert("공개 상태 변경에 실패했습니다.");
      });
    };

    btnGroup.appendChild(toggleBtn);
    btnGroup.appendChild(editBtn);
    btnGroup.appendChild(deleteBtn);

    li.appendChild(nameSpan);
    li.appendChild(btnGroup);
    list.appendChild(li);
  }


}
    
function showCourse(courseName) {
   if (!mapClickListenerAdded) {
    kakao.maps.event.addListener(map, "click", function () {
      if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
      }
    });
    mapClickListenerAdded = true;
  }
  document.getElementById("search-bar").style.display = "none";
  document.getElementById("search-results").style.display = "none";
  currentEditingCourse = "";

  const starMarkerImage = new kakao.maps.MarkerImage(
    "/image/star.png",
    new kakao.maps.Size(40, 40),
    { offset: new kakao.maps.Point(20, 40) }
  );

  const points = courseData[courseName];
  clearMarkers();
  if (!points || points.length === 0) {
    document.getElementById("course-place-box").style.display = "none";
    document.getElementById("box-course-title").textContent = "";
    document.getElementById("box-place-list").innerHTML = "";
    return;
  }

  const infoWindows=[];

  points.forEach((p,index) => {
    const marker = new kakao.maps.Marker({
      map,
      position: new kakao.maps.LatLng(p.lat, p.lng),
      title: p.title,
      image: starMarkerImage
    });
    markers.push(marker);

    const infoContent=document.createElement("div");
    infoContent.className="memo-popup";

    infoContent.innerHTML=`
      <div class="memo-title">${p.title}</div><br>
      <div class="memo-box">
        ${p.memo ? p.memo.trim() : "메모가 없습니다."}
      </div>

      <button class="memo-button">메모 작성</button>
    `;
    const memoBtn=infoContent.querySelector("button");
    memoBtn.onclick=()=>{
      if(currentInfoWindow) currentInfoWindow.close();
      const newMemo=prompt("메모를 입력하세요",p.memo || "");
      if(newMemo===null)return;
      if(newMemo.trim()===""){
        alert("내용을 입력해주세요.");
        return;
      }
      courseData[courseName][index].memo=newMemo;
      saveCourseToFirebase(courseName)
      .then(()=>{
        alert("메모가 저장되었습니다.");
        infoWindow.close();
        showCourse(courseName);
      })
      .catch(()=>{
        alert("저장 실패, 다시 시도해주세요.");
      });
    };
    const infoWindow=new kakao.maps.InfoWindow({
      content:infoContent,
      removable:true
    });

    kakao.maps.event.addListener(marker,"click",function(){
      if(currentInfoWindow) currentInfoWindow.close();
      infoWindow.open(map,marker);
      currentInfoWindow=infoWindow;
    });
    
    });

  const box = document.getElementById("course-place-box");
  const title = document.getElementById("box-course-title");
  const list = document.getElementById("box-place-list");
  title.textContent = `[${courseName}] 코스 장소`;
  list.innerHTML = "";

  points.forEach((p, index) => {
    const li = document.createElement("li");
    li.className="course-item";

    const titleSpan = document.createElement("span");
    titleSpan.textContent = `• ${p.title}`;
    titleSpan.className="course-title";
    titleSpan.onclick = () => {
      map.setCenter(new kakao.maps.LatLng(p.lat, p.lng));
      if(currentInfoWindow) currentInfoWindow.close();

      kakao.maps.event.trigger(markers[index],"click");
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.className="delete-button";
    deleteBtn.onclick = (event) => {
      event.stopPropagation();
      if (confirm(`'${p.title}'을 삭제할까요?`)) {
        courseData[courseName].splice(index, 1);
        saveCourseToFirebase(courseName);
        showCourse(courseName);
      }
    };

    li.appendChild(titleSpan);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });

  box.style.display = "block";
  map.setCenter(new kakao.maps.LatLng(points[0].lat, points[0].lng));
}

function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
}

function addCourse() {
  const user=firebase.auth().currentUser;
  if(!user){
    alert("로그인한 사용자만 코스를 추가할 수 있습니다.");
    return;
  }
  const name = prompt("새 코스 이름을 입력하세요:");
  if (name && !courseData[name]) {
      courseData[name] = [];
      saveCourseToFirebase(name);
      updateCourseList();
      alert(`'${name}' 코스가 추가되었습니다.`);
  } else {
      alert("코스 이름이 없거나 이미 존재합니다.");
  }
}


function loadCoursesFromFirestore(){
  const user=firebase.auth().currentUser;

  if(!user){
    alert("로그인이 필요합니다.");
    return;
  }
  db.collection("courses")
  .where("userId","==",user.uid)
  .orderBy("timestamp","desc")
  .get()
  .then((querySnapshot)=>{
    courseData={};
    querySnapshot.forEach((doc)=>{
      const data=doc.data();
      courseData[data.title]=(data.points || []).map(p=>({
        title:p.title,
        lat:p.lat,
        lng:p.lng,
        memo:p.memo || "",
      }));
      courseData[data.title]._isPublic=data.isPublic || false;
    });
    updateCourseList();
    // if(!preservedEditMode && currentEditingCourse){
    //   showCourse(currentEditingCourse);
    // }
  })


  .catch((error)=>{
    console.error("코스 불러오기 실패:",error);
  });
  console.log("현재 로그인 사용자 : ",firebase.auth().currentUser?.uid);
}

firebase.auth().onAuthStateChanged(function(user){
  if(user){
    loadCoursesFromFirestore();
  }
})

function openSearchUI(courseName){
  currentEditingCourse=courseName;
  document.getElementById("search-course-title").textContent=`[${courseName}] 수정 중`;
  document.getElementById("search-bar").style.display="block";
  document.getElementById("search-input").value="";

  const box=document.getElementById("course-place-box");
  if(box)box.style.display="none";
}

function closeSearchUI(){
  document.getElementById("search-bar").style.display="none";
  document.getElementById("search-results").style.display="none";
  currentEditingCourse="";
}

function searchPlaces(){
  const starMarkerImage = new kakao.maps.MarkerImage(
    "/image/star.png",
    new kakao.maps.Size(40,40),
    { offset: new kakao.maps.Point(20, 40) } 
  );

  const query=document.getElementById("search-input").value.trim();
  if(!query){
    alert("검색어를 입력하세요");
    return;
  }
  const ps=new kakao.maps.services.Places();
  ps.keywordSearch(query,function(data,status){
    const resultList=document.getElementById("search-results");
    resultList.innerHTML="";
    if(status===kakao.maps.services.Status.OK){
      resultList.style.display="block";
      clearMarkers();
      data.forEach((place)=>{
        const marker=new kakao.maps.Marker({
          map,
          position: new kakao.maps.LatLng(place.y,place.x),
          title:place.place_name,
        });
        markers.push(marker);

        const li=document.createElement("li");
        li.style.padding="8px";
        li.style.borderBottom="1px solid #ccc";

        // 장소 이름
        const titleSpan=document.createElement("span");
        titleSpan.textContent=place.place_name;
        titleSpan.style.fontWeight="bold";

        const addBtn=document.createElement("button");
        addBtn.className="add-button";
        addBtn.textContent="추가";
        addBtn.style.marginLeft="12px";
        addBtn.onclick=()=>{
          if(!currentEditingCourse) return alert("편집 중인 코스가 없습니다.");
          const point={
            title:place.place_name,
            lat:parseFloat(place.y),
            lng:parseFloat(place.x),
            memo:""
          };
          courseData[currentEditingCourse].push(point);
          saveCourseToFirebase(currentEditingCourse);
          titleSpan.style.color="#007bff";
          titleSpan.style.fontWeight="bold";
          titleSpan.style.padding="2px 4px";
          titleSpan.style.borderRadius="4px";

          marker.setImage(starMarkerImage); //마커색 초록색으로 변경
          //버튼 비활성화
          addBtn.disabled=true;
          addBtn.textContent="추가됨";
          addBtn.style.opacity="0.6";
          alert(`'${place.place_name}'이 코스에 추가되었습니다.`);
        };
        li.appendChild(titleSpan);
        li.appendChild(addBtn);
        resultList.appendChild(li);

        li.onclick=()=>{
          map.setCenter(new kakao.maps.LatLng(place.y,place.x));
        };
      });

      map.setCenter(new kakao.maps.LatLng(data[0].y,data[0].x));
    }else{
      alert("검색 결과가 없습니다.");
      document.getElementById("search-results").style.display="none";
    }
  });
}

function getDefaultImageUrl(courseName) {
  if (courseName.includes("부산"))
    return "https://cdn.pixabay.com/photo/2022/04/04/04/17/beach-7109616_1280.jpg";
  if (courseName.includes("서울"))
    return "/image/seoul.png";
  if (courseName.includes("대구"))
    return "/image/daegu.png";
  return "/image/default.png";
}


//firebase 저장하기
function saveCourseToFirebase(courseName){
  const user=firebase.auth().currentUser;
  if(!user){
    alert("로그인이 필요합니다.");
    return;
  }
  return db.collection("courses").doc(`${user.uid}_${courseName}`).set({
    userId :user.uid,
    title :courseName,
    points :courseData[courseName],
    timestamp:firebase.firestore.FieldValue.serverTimestamp(),
    isPublic: courseData[courseName]._isPublic || false,
    imageUrl:getDefaultImageUrl(courseName)
  }).then(()=>{
    console.log("코스가 저장되었습니다.");
    loadCoursesFromFirestore(false);
  }).catch((err)=>{
    alert("코스 저장 실패 : ",err);
    alert("코스 저장 중 오류가 발생했습니다.");
  });
}

