// 클릭 시 카테고리 드롭다운 열기/닫기
document.getElementById("category-toggle").addEventListener("click", function(event) {
    event.preventDefault();  // 링크 기본 동작 막기
    var menu = document.getElementById("category-menu");
    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        menu.style.display = "block";
    }
});