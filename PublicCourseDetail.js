document.addEventListener("DOMContentLoaded", () => {
  let data;
  try{
    data = JSON.parse(localStorage.getItem("selectedPublicCourse"));
  }catch(e){
    console.warn("코스 데이터 로딩 실패");
    data=null;
  }
  
  if (!data || !data.title || !data.points) {
    console.warn("데이터가 불완전하거나 없음. 기본값으로 진행합니다.");
    data = {
      title: "제목 없음",
      userId: "알 수 없음",
      points: []
    };
  }

  document.getElementById("course-title").textContent = data.title || "제목 없음";
  document.getElementById("course-desc").textContent = `작성자 ID : ${data.userId || "알수 없음"}`;

  const mapContainer = document.getElementById("map");
  const mapOption = {
    center: new kakao.maps.LatLng(37.5665, 126.9780), // 기본 중심
    level: 5,
  };
  const map = new kakao.maps.Map(mapContainer, mapOption);
  const bounds = new kakao.maps.LatLngBounds();

  const places = data.points || data.places || [];
    places.forEach(place => {
    const position = new kakao.maps.LatLng(place.lat, place.lng);
    const marker = new kakao.maps.Marker({ position, map });

    bounds.extend(position);

    if (place.memo) {
        const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px;">${place.memo}</div>`
        });
        kakao.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
        });
    }
    });

  map.setBounds(bounds);
});