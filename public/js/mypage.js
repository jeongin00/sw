document.addEventListener('DOMContentLoaded', function() {
    // 전역 변수 설정
  let totalCarbonReduction = 0;
  let cartTotal = 0;
  
  // 서버에서 userId를 가져오는 API 호출
  fetch('/api/user')
      .then(response => response.json())
      .then(data => {
          if (data.userId) {
              window.userId = data.userId; // 전역 변수로 userId 설정
          } else {
              console.error('로그인된 사용자가 아닙니다.');
          }
      })
      .catch(error => console.error('유저 ID 불러오기 실패:', error));

  fetch('/api/user-carbon')
      .then(response => response.json())
      .then(data => {
          const carbonTotalDisplay = document.getElementById('carbon-total');
          console.log('받아온 carbon 데이터:', data.carbon); // 받은 carbon 데이터 확인
          carbonTotalDisplay.textContent = data.carbon; // 그대로 kg 단위로 표시
          updateFootprint(data.carbon); // 탄소 발자국 UI 업데이트
      })
      .catch(error => console.error('유저 탄소 데이터 불러오기 실패:', error));
  // 장바구니 데이터를 가져와서 표시하는 부분
  fetch('/get-cart-items')
      .then(response => response.json())
      .then(items => {
          const cartItemsContainer = document.getElementById('cart-items');
          const emptyState = document.getElementById('empty-state');
          let cartTotal = 0;

          // 장바구니 항목을 저장할 객체
          const cartItems = {};

          // 동일한 상품이 있을 경우 수량을 증가
          items.forEach(item => {
              if (cartItems[item.name]) {
                  cartItems[item.name].quantity += 1; // 이미 있으면 수량 증가
              } else {
                  cartItems[item.name] = { ...item, quantity: 1 }; // 없으면 새로 추가
              }
          });

          if (Object.keys(cartItems).length === 0) {
              emptyState.style.display = 'block';
              cartItemsContainer.style.display = 'none';
              return;
          }

          emptyState.style.display = 'none';
          cartItemsContainer.style.display = 'table';

          // 수정된 cartItems를 사용해 UI에 표시




Object.values(cartItems).forEach(item => {
  const imageSrc = `/public/png/${item.category}/${item.num}.png`;
  const itemTotalPrice = item.price * item.quantity;
  
  cartTotal += itemTotalPrice;

  const itemHTML = `
      <div class="cart-item" data-id="${item.name}" data-base-carbon="${item.carbon}">
          <div class="cart-cell item-details">
              <img src="${imageSrc}" alt="${item.name}" />
              <div>
                  <div class="item-name">${item.name}</div>
                  <div class="item-brand">${item.brand}</div>
              </div>
          </div>
          <div class="cart-cell item-price">${item.price}원</div>
          <div class="cart-cell">
              <select class="quantity-select" onchange="updateTotal(${item.price}, ${item.carbon}, this)">
                  ${[...Array(10).keys()].map(i => `<option value="${i + 1}" ${i + 1 === item.quantity ? 'selected' : ''}>${i + 1}</option>`).join('')}
              </select>
          </div>
          <div class="cart-cell item-total-price">${itemTotalPrice}원</div>
          <div class="cart-cell item-carbon">${item.carbon}kg</div>
          <div class="cart-cell cart-controls">
              <button onclick="deleteFromCart('${item.name}', '${window.userId}')">삭제</button>
              <button onclick="purchaseItem('${item.name}')">구매</button>
          </div>
      </div>
  `;
  cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
});
          const cartTotalHTML = `<div class="cart-total">장바구니 총합: <span id="cart-total">${cartTotal}원</span></div>`;
          cartItemsContainer.insertAdjacentHTML('beforeend', cartTotalHTML);
      })
      .catch(error => console.error('장바구니 데이터를 가져오는 중 오류 발생:', error));
});
 




function purchaseItem(productName) {
    const selectedItem = document.querySelector(`[data-id="${productName}"]`);
    const quantity = parseInt(selectedItem.querySelector('.quantity-select').value); // 선택된 수량을 정수로 변환
  
    // 기본 탄소 값 가져오기
    const baseCarbon = parseFloat(selectedItem.dataset.baseCarbon);
    const itemTotalCarbon = baseCarbon * quantity; // 총 탄소량 계산
  
    fetch('/purchase-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, itemTotalCarbon, quantity }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === '구매 완료') {
          alert('구매가 완료되었습니다!');
  
          // 누적 탄소 절감량 업데이트
          const carbonTotalDisplay = document.getElementById('carbon-total');
          const newCarbonTotal =
            parseFloat(carbonTotalDisplay.textContent) + itemTotalCarbon;
          carbonTotalDisplay.textContent = newCarbonTotal.toFixed(2);
  
          // 탄소 발자국 UI 업데이트
          updateFootprint(newCarbonTotal);
  
          // 추가: 포인트 계산 및 UI 업데이트
          const totalPointsDisplay = document.getElementById('total-points');
          const currentPointsDisplay = document.getElementById('current-points');
          const currentPoints = parseInt(
            totalPointsDisplay.textContent.replace(/[^0-9]/g, '')
          );
  
          // 10kg 단위당 1000포인트 추가
          const previousMilestone = Math.floor(
            parseFloat(carbonTotalDisplay.textContent) / 10
          );
          const newMilestone = Math.floor(newCarbonTotal / 10);
          const pointsToAdd = (newMilestone - previousMilestone) * 1000;
  
          if (pointsToAdd > 0) {
            // 서버에 포인트 업데이트 요청
            fetch('/update-carbon-and-points', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ carbonReduction: itemTotalCarbon }),
            })
              .then((response) => response.json())
              .then((updateData) => {
                if (updateData.updatedPoints) {
                  totalPointsDisplay.textContent =
                    updateData.updatedPoints.toLocaleString() + 'P';
                  currentPointsDisplay.textContent =
                    updateData.updatedPoints.toLocaleString() + 'P';
                }
              })
              .catch((error) =>
                console.error('포인트 업데이트 요청 중 오류 발생:', error)
              );
          }
  
          location.reload(); // 페이지 새로고침
        }
      })
      .catch((error) => console.error('구매 요청 중 오류 발생:', error));
  }

  document.addEventListener('DOMContentLoaded', () => {
    // 사용자 포인트 가져오기
    fetch('/api/user-points')
        .then(response => response.json())
        .then(data => {
            if (data.points !== undefined) {
                // 포인트 값 업데이트
                const totalPointsDisplay = document.getElementById('total-points');
                const currentPointsDisplay = document.getElementById('current-points');
               
                const updatedTotalPoints = data.points + 4000;
                totalPointsDisplay.textContent = `${updatedTotalPoints.toLocaleString()}P`;
                currentPointsDisplay.textContent = `${data.points.toLocaleString()}P`;
            }
        })
        .catch(error => console.error('포인트 데이터를 가져오는 중 오류 발생:', error));
});

function deleteFromCart(name) {
  if (!window.userId) {
      console.error('User ID가 정의되지 않았습니다.');
      return;
  }

  console.log(`삭제 요청 중인 항목: Name - ${name}, User ID - ${window.userId}`);
  
  fetch(`/delete-cart-item/${name}/${window.userId}`, { method: 'DELETE' })
      .then(response => {
          if (response.ok) {
              console.log('삭제 성공');
              location.reload(); // 삭제 성공 후 페이지 새로고침
          } else {
              console.error('상품 삭제 실패');
              response.text().then(text => console.error('응답 메시지:', text));
          }
      })
      .catch(error => console.error('삭제 요청 중 오류 발생:', error));
}
items.forEach(item => {
  const itemHTML = `
      <div class="cart-item" data-id="${item.name}">
          <div class="cart-cell item-details">
              <div class="item-name">${item.name}</div>
              <div class="item-brand">${item.brand}</div>
          </div>
          <div class="cart-cell item-price">${item.price}원</div>
          <div class="cart-cell cart-controls">
              <button onclick="deleteFromCart('${item.name}', '${item.user_id}')">삭제</button>
          </div>
      </div>
  `;
  cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
});




function updateTotal(price, carbon, selectElement) {
  const quantity = selectElement.value;

  // 가격 계산
  const itemTotalPriceElement = selectElement.closest('.cart-item').querySelector('.item-total-price');
  itemTotalPriceElement.textContent = `${price * quantity}원`; // 가격 업데이트

  // 탄소량 계산
  const itemCarbonElement = selectElement.closest('.cart-item').querySelector('.item-carbon');
  itemCarbonElement.textContent = `${carbon * quantity}kg`; // 수량에 맞춰 탄소량 업데이트

  // 장바구니 총합 업데이트
  calculateCartTotal();
}




// 장바구니 추가 시 cart total 증가 함수
function addToCart(price) {
  cartTotal += price;
  document.getElementById('cart-total').textContent = `${cartTotal}원`;
}

// 전체 cart total 계산 함수
function calculateCartTotal() {
  cartTotal = Array.from(document.querySelectorAll('.item-total-price'))
      .reduce((sum, element) => sum + parseInt(element.textContent.replace('원', '')), 0);
  document.getElementById('cart-total').textContent = `${cartTotal}원`;
}




let totalCarbonReduction = 0; // kg 단위의 누적 탄소 절감량
const footprintIcons = document.querySelectorAll('.footprint-icon');
const carbonTotalDisplay = document.getElementById('carbon-total');

function updateFootprint(carbon) {
  const footprintIcons = document.querySelectorAll('.footprint-icon');
  
  footprintIcons.forEach((icon, index) => {
      if (carbon >= (index + 1) * 10) {
          // 기준 이상이면 발자국 색상 녹색 유지
          icon.style.color = 'gray';
      } else {
          // 기준 미만이면 발자국 색상을 회색으로 변경
          icon.style.color = 'green';
      }
  });
}




// 탄소 절감량 추가 함수 (예: 장바구니 추가 시 호출)
function addCarbonReduction(carbon) {
  totalCarbonReduction += carbon;
  updateFootprint();
}



// 초기화
updateFootprint();