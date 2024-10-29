document.getElementById('category-toggle').addEventListener('click', function() {
    var categoryMenu = document.getElementById('category-menu');
    if (categoryMenu.style.display === 'none' || categoryMenu.style.display === '') {
        categoryMenu.style.display = 'block';
    } else {
        categoryMenu.style.display = 'none';
    }
});

document.getElementById('search-btn').addEventListener('click', function() {
        // 입력된 검색어 가져오기
        var query = document.getElementById('search-input').value;
        
        // 검색어가 입력되었는지 확인
        if (query) {
            // 검색어가 있으면 alert로 검색어를 출력 (기본 동작 테스트)
            alert('검색어: ' + query + ' 로 검색합니다.');
            
            // 여기에 검색 기능을 처리할 코드를 추가할 수 있습니다.
            // 예를 들어, 서버로 검색어를 전송하여 검색 결과를 가져오는 작업을 할 수 있습니다.
            performSearch(query);  // 검색 함수 호출
        } else {
            // 검색어가 없으면 경고 메시지 표시
            alert('검색어를 입력해주세요.');
        }
    });
    function displaySearchResults(results) {
    var resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = ''; // 이전 검색 결과 초기화

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>검색 결과가 없습니다.</p>';
        return;
    }

    results.forEach(function(result) {
        var resultItem = document.createElement('div');
        resultItem.classList.add('result-item');
        resultItem.innerHTML = `
            <h3>${result.productName}</h3>
            <p>브랜드: ${result.brand}</p>
            <p>가격: ${result.price}</p>
        `;
        resultsContainer.appendChild(resultItem);
    });
}
