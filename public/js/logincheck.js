function checkLogin() {
    fetch('/check-login', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('로그인 필요');
        }
        return response.json();
    })
    .then(data => {
        if (data.loggedIn) {
            window.location.href = '/public/mypage.html'; // 로그인 된 경우 마이페이지로 이동
        } else {
            alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
            window.location.href = '/public/login.html'; // 로그인 안 된 경우 로그인 페이지로 이동
        }
    })
    .catch(error => {
        alert(error.message);
        window.location.href = '/public/login.html'; // 오류 발생 시 로그인 페이지로 이동
    });
}