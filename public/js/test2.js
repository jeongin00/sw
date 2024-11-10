console.clear();

// 탑 메뉴바 fixed 스크롤 이벤트
window.addEventListener('scroll', function() {
    var scrollTop = window.scrollY;

    var topBar = document.querySelector(".top-bar");
    if (scrollTop === 0) {
        topBar.style.backgroundColor = "rgba(0,0,0,0)";
        topBar.style.height = "110px";
    }
    if (scrollTop > 50) {
        topBar.style.backgroundColor = "rgba(0,0,0,0.8)";
        topBar.style.height = "90px";
    }
});

// 메뉴 클릭 이벤트
var menuItems = document.querySelectorAll(".menu-bar > ul > li");
menuItems.forEach(function(item) {
    item.addEventListener("click", function() {
        this.classList.toggle("active");
        var spans = this.querySelectorAll("a span");
        spans.forEach(function(span) {
            span.classList.toggle("active");
        });

        var submenu = this.querySelector("ul");
        if (submenu) {
            submenu.style.display = submenu.style.display === "block" ? "none" : "block";
            submenu.classList.toggle("active");
        }
    });
});

// 사이드바 작업
document.querySelectorAll(".side-menu-bg, .side-menu-close-btn").forEach(function(element) {
    element.addEventListener("click", function() {
        document.querySelector(".side-menu-bg").style.display = "none";
        document.querySelector(".side-menu-bar").style.display = "none";
    });
});

document.querySelector(".side-btn").addEventListener("click", function() {
    document.querySelector(".side-menu-bg").style.display = "block";
    document.querySelector(".side-menu-bar").style.display = "block";
});

// 슬라이드 작업
var owlCarousel1 = $('.slider-1 > .owl-carousel').owlCarousel({
    autoplay: true,
    autoplayTimeout: 6000,
    loop: true,
    margin: 0,
    nav: true,
    navText: [
        '<img src="http://hansolbio.com/data/skin/front/0743spaceleader/img/mimg/nav_arrow_left.png">',
        '<img src="http://hansolbio.com/data/skin/front/0743spaceleader/img/mimg/nav_arrow_right.png">'
    ],
    responsive: {
        0: {
            items: 1
        }
    }
});

// 첫 번째 점 활성화 처리
var firstDot = document.querySelector('.slider-1 > .owl-carousel > .owl-dots > .owl-dot.active');
if (firstDot) {
    firstDot.classList.remove('active');

    setTimeout(function() {
        firstDot.classList.add('active');
    }, 10);
}

// 상품리스트 버튼 작업
var listBox1DataCurrentIndex = -1;


// 슬라이더2
var owlCarousel2 = $('.slider-2 > .owl-carousel').owlCarousel({
    autoplay: false,
    loop: true,
    margin: 0,
    nav: true,
    navText: [
        '<img src="http://www.hansolbio.com/data/skin/front/0743spaceleader/img/mimg/top_arrow_right.png">',
        '<img src="http://www.hansolbio.com/data/skin/front/0743spaceleader/img/mimg/bottom_arrow_left.png">'
    ],
    responsive: {
        0: {
            items: 1
        }
    }
});
