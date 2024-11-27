// 주문 리스트 데이터 예시
const orders = [
    { orderId: '12345', customerName: '홍길동', product: '노트북', status: '배송 중' },
    { orderId: '12346', customerName: '임꺽정', product: '스마트폰', status: '주문 완료' }
];

// 주문 리스트 테이블에 데이터 추가
function renderOrders() {
    const orderList = document.getElementById('orderList');
    orderList.innerHTML = '';
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${order.product}</td>
            <td>${order.status}</td>
            <td><button>상태 변경</button></td>
        `;
        orderList.appendChild(row);
    });
}

// 매출 데이터 동적 변경
function updateSalesData() {
    document.getElementById('monthlySales').innerText = '1,500,000원';
    document.getElementById('bestSeller').innerText = '태블릿';
}

// 페이지 로딩 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    renderOrders();
    updateSalesData();
});
