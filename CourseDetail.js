function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    title: params.get("title"),
    userId: params.get("user")
  };
}

const { title, userId } = getQueryParams();

if (!title || !userId) {
  //alert("잘못된 접근입니다.");
} else {
  // 코스 불러오기
  const docId = `${userId}_${title}`;

  db.collection("courses")
    .doc(docId)
    .get()
    .then(doc => {
      if (!doc.exists) {
        document.getElementById("course-title").textContent = "코스를 찾을 수 없습니다.";
        return;
      }

      const data = doc.data();
      document.getElementById("course-title").textContent = data.title;
      document.getElementById("course-author").textContent = `@${data.userId}`;

      const list = document.getElementById("course-place-list");
      list.innerHTML = "";

      (data.points || []).forEach((point, idx) => {
        const li = document.createElement("li");
        li.textContent = `${idx + 1}. ${point.title} (${point.memo || "메모 없음"})`;
        list.appendChild(li);
      });
    })
    .catch(err => {
      console.error("코스 불러오기 오류:", err);
      alert("데이터 로딩 중 오류 발생");
    });
}