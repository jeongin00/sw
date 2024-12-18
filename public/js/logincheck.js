document.addEventListener('DOMContentLoaded', function () {
    fetch('/check-login')
        .then(response => response.json())
        .then(data => {
            const headerRight = document.querySelector('.header-right');
            const welcomeSection = document.querySelector('#welcome-section');
            const progressIndicator = document.querySelector('.progress-indicator');
            const progressLabels = document.querySelectorAll('.progress-labels .label');

            if (data.loggedIn) {
                headerRight.innerHTML = `
                    <span>${data.userName}님&nbsp;&nbsp;&nbsp;</span>
                    <a href="#" onclick="logout()"><button>로그아웃</button></a>
                    <a href="/public/cart.html"><button>장바구니</button></a>
                    <button>주문배송</button>
                    <a href="/public/mypage.html"><button>마이페이지</button></a>
                `;

                // 환영 메시지와 진행 바 추가
                welcomeSection.innerHTML = `
                    <div class="welcome-box">
                        <div class="profile">
                            <div class="profile-circle">S</div>
                            <div class="welcome-content">
                                <div class="welcome-message">
                                  씨앗 <span>${data.userName}</span>님, 반갑습니다!
                                </div>
                                <div class="progress-container">
                                    <div class="progress-bar">
                                        <div class="progress-indicator"></div>
                                    </div>
                                    <div class="progress-labels">
                                        <span class="label" style="left: 0%;">씨앗</span>
                                        <span class="label" style="left: 25%;">새싹</span>
                                        <span class="label" style="left: 50%;">꽃</span>
                                        <span class="label" style="left: 75%;">열매</span>
                                        <span class="label" style="left: 100%;">나무</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // 진행 상태에 따른 변경
                let progressPercent = 0;

                if (data.cnt >= 40) {
                    progressPercent = 100;
                } else if (data.cnt >= 30) {
                    progressPercent = 75;
                } else if (data.cnt >= 20) {
                    progressPercent = 50;
                } else if (data.cnt >= 10) {
                    progressPercent = 25;
                }

                // 공을 진행 바에서 더 오른쪽으로 이동시키기 위해 5%를 더 추가
                progressPercent += 2;

                // 공 이동
                const progressIndicator = document.querySelector('.progress-indicator');
                progressIndicator.style.transition = 'left 0.3s ease'; // 부드럽게 이동하게 하기 위해 transition 추가
                progressIndicator.style.left = `${Math.min(progressPercent, 100)}%`;  // 최대 100%로 제한

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



    // 검색 버튼 클릭 시 호출되는 함수
    async function handleSearch() {
        const query = document.getElementById('search-input').value;
        if (query) {
            try {
                // API 호출을 통해 검색 결과의 page_url을 받아옴
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const results = await response.json();

                if (results.length > 0) {
                    // 첫 번째 검색 결과의 page_url로 이동
                    const firstResult = results[0];
                    window.location.href = firstResult.page_url;
                } else {
                    alert('검색 결과가 없습니다.');
                }
            } catch (error) {
                console.error('검색 오류:', error);
                alert('검색 중 오류가 발생했습니다.');
            }
        } else {
            alert('검색어를 입력해주세요.');
        }
    }

    // 검색 결과를 화면에 표시하고, 상품 클릭 시 연결된 페이지로 이동
    function displaySearchResults(results) {
        const resultsContainer = document.getElementById('results-container');
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>검색 결과가 없습니다.</p>';
            return;
        }

        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('result-item');
            resultItem.innerHTML = `
                <h3><a href="${result.page_url}">${result.name}</a></h3>
                <p>브랜드: ${result.brand}</p>
                <p>가격: ${result.price}원</p>
            `;
            resultsContainer.appendChild(resultItem);
        });
    }
