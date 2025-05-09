window.onload = function () {
  kakao.maps.load(function () {
    const container = document.getElementById('map');
    const options = {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 3
    };

    const map = new kakao.maps.Map(container, options);

    document.getElementById('add-marker-btn').addEventListener('click', function () {
      const marker = new kakao.maps.Marker({
        position: map.getCenter(),
        map: map
      });
    });
  });
};
