document.addEventListener('DOMContentLoaded', function () {
    fetch('/check-login')
        .then(response => response.json())
        .then(data => {
            const headerRight = document.querySelector('.header-right');
            
            if (data.loggedIn) {
                headerRight.innerHTML = `
                    
                    <span>${data.userName}님&nbsp;&nbsp;&nbsp;</span> 
                    <a href="#" onclick="logout()"><button>로그아웃</button></a>
                    <a href="/public/cart.html"><button>장바구니</button></a>
                    <button>주문배송</button>
                    <a href="/public/mypage.html"><button>마이페이지</button></a>
                    <!-- 환영 메시지 추가 -->
                `;
            } else {
                // 로그인 상태가 아닐 때 HTML의 기본 설정 경로를 사용합니다.
            }
        })
        .catch(error => console.error('로그인 상태 확인 실패:', error));
});
function logout() {
    fetch('/process/logout', { method: 'POST', credentials: 'same-origin' }) // 로그아웃 요청
        .then(response => {
            if (response.ok) {
                // 페이지 새로고침하여 로그인 상태 갱신
                window.location.reload(); 
            } else {
                console.error('로그아웃 실패');
            }
        })
        .catch(error => console.error('로그아웃 요청 실패:', error));
}