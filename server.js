const express = require('express');
const mysql = require('mysql2'); // npm install mysql
const path = require('path'); // public 안에 html을 연결해줌
const static = require('serve-static'); // 조상 경로 설정 sw폴더를 임의정으로 상위폴더로 설정
const session = require('express-session');
const cors = require('cors');
const port = 3000;

// 웹서버 만들기
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'swdata',
    debug: false
});

app.use(cors()); // 모든 도메인에서 접근 허용
// 세션 설정
app.use(session({
    secret: '1234',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // HTTPS 사용 시 true로 설정
        maxAge: 24 * 60 * 60 * 1000 // 1일
    }
}));

// 정적 파일 제공 설정
app.use('/public', static(path.join(__dirname, 'public'))); // public 디렉토리 지정
app.use('/frontend', express.static(path.join(__dirname, 'frontend'))); // frontend 디렉토리 지정

// 유나 메인페이지를 기본 페이지로 설정 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html')); // frontend 폴더의 index.html을 기본 페이지로 설정
});

app.get('/api/user', (req, res) => {
    if (req.session.userId) {
        res.json({ userId: req.session.userId });
    } else {
        res.status(401).json({ message: '로그인하지 않음' });
    }
});

// 상품 검색 API
app.get('/api/search', (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ message: '검색어를 입력해주세요.' });
    }

    // 부분 일치 검색을 위해 %검색어% 형태로 LIKE 사용
    const searchQuery = `
        SELECT name, brand, price, page_url 
        FROM product 
        WHERE name LIKE ? OR brand LIKE ?
    `;
    const searchValues = [`%${query}%`, `%${query}%`]; // 부분 일치 검색어 설정

    pool.getConnection((err, conn) => {
        if (err) {
            console.error('MySQL 연결 오류:', err);
            return res.status(500).json({ message: 'DB 연결 실패' });
        }

        conn.query(searchQuery, searchValues, (err, results) => {
            conn.release();
            if (err) {
                console.error('SQL 실행 오류:', err);
                return res.status(500).json({ message: '검색 실패' });
            }

            if (results.length === 0) {
                res.status(404).json({ message: '검색 결과가 없습니다.' });
            } else {
                res.json(results); // 검색 결과 반환
            }
        });
    });
});
// 유저 추가
app.post('/process/adduser', (req, res) => {
    console.log('/process/adduser 호출됨 ' + req);

    const paramId = req.body.id;
    const paramName = req.body.name;
    const paramAge = req.body.age;
    const paramPassword = req.body.password;

    pool.getConnection((err, conn) => {
        if (err) {
            console.log('Mysql getConnection error. aborted', err); // 연결 오류만 로깅
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf8' });
            res.write('<h1>DB 서버 연결 실패</h1>');
            res.end();
            return; // 연결 실패 시 return으로 종료
        }
    
        console.log('데이터베이스 연결 끈 얻었습니다.');
    
        const exec = conn.query(
            'INSERT INTO users(id, name, age, password) VALUES(?, ?, ?, ?)',
            [paramId, paramName, paramAge, paramPassword],
            (err, result) => {
                conn.release(); // 쿼리 실행 후에만 연결 해제
                console.log('실행된 SQL: ' + exec.sql);
    
                if (err) {
                    console.log('SQL 실행 시 오류 발생', err);
                    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf8' });
                    res.write('<h1>SQL query 실행 실패</h1>');
                    res.end();
                    return;
                }
    
                if (result) {
                    console.log('사용자 추가 성공');
                    res.redirect('/public/login.html'); // 회원가입 성공 시 로그인 페이지로 리디렉션
                } else {
                    console.log('사용자 추가 실패');
                    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf8' });
                    res.write('<h1>사용자 추가 실패</h1>');
                    res.end();
                }
            }
        );
    });
    
});

// 로그인 처리
app.post('/process/login', (req, res) => {
    const paramId = req.body.id;
    const paramPassword = req.body.password;

    pool.getConnection((err, conn) => {
        if (err) {
            console.log('DB 연결 오류:', err);
            res.status(500).send('DB 연결 오류');
            return;
        }

        const exec = conn.query(
            'SELECT id, name FROM users WHERE id = ? AND password = ?',
            [paramId, paramPassword],
            (err, rows) => {
                conn.release();
                if (err || rows.length === 0) {
                    res.status(401).send('<h2>로그인 실패. 아이디와 비밀번호를 확인하세요</h2>');
                } else {
                    console.log('로그인 성공:', rows[0]);
                    req.session.userId = rows[0].id;
                    req.session.userName = rows[0].name; // 세션에 사용자 이름 저장
                    res.redirect('/public/mypage.html');
                }
            }
        );
    });
});




// 매장 정보 조회 API
app.get('/api/stores', (req, res) => {
    const { province, city } = req.query;

    // 기본 쿼리 설정: 모든 매장을 가져오도록 설정
    let query = `SELECT name, lat, lng, province, city, phone, image_url FROM stores`;
    const values = [];

    // 만약 province와 city 파라미터가 존재하면 WHERE 조건 추가
    if (province && city) {
        query += ` WHERE province = ? AND city = ?`;
        values.push(province, city);
    }

    pool.getConnection((err, conn) => {
        if (err) {
            console.error('MySQL getConnection error:', err);
            res.status(500).send('<h1>DB 서버 연결 실패</h1>');
            return;
        }

        conn.query(query, values, (err, rows) => {
            conn.release(); // 연결 해제
            if (err) {
                console.error('SQL 실행 중 오류 발생:', err);
                res.status(500).send('<h1>SQL query 실행 실패</h1>');
                return;
            }
            res.status(200).json(rows); // 매장 데이터를 JSON 형식으로 반환
        });
    });
});


// 마이페이지 제공
app.get('/public/mypage.html', (req, res) => {
    if (!req.session.userId) { // 세션에 userId가 없는 경우
        return res.redirect('/public/login.html'); // 로그인 페이지로 리디렉션
    }
    res.sendFile(path.join(__dirname, 'public', 'mypage.html')); // 로그인된 경우에만 마이페이지 제공
});

// 로그인 상태 확인
app.get('/check-login', (req, res) => {
    if (req.session.userId) {
        const userName = req.session.userName; // 세션에 저장된 사용자 이름 가져오기
        res.json({ loggedIn: true, userName });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/process/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('세션 삭제 실패:', err);
            res.status(500).send('로그아웃 실패');
        } else {
            res.status(200).send('로그아웃 성공');
        }
    });
});

app.post('/add-to-cart', (req, res) => {
    const productName = req.body.productName;
    const userId = req.session.userId;  // 로그인된 사용자 ID 가져오기

    if (!userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    pool.getConnection((err, conn) => {
        if (err) {
            console.log('DB 연결 오류:', err);
            return res.status(500).json({ success: false, message: 'DB 연결 실패' });
        }

        // product 테이블에서 상품 정보 조회
        const query = 'SELECT * FROM product WHERE name = ?';
        conn.query(query, [productName], (err, results) => {
            if (err || results.length === 0) {
                conn.release();
                return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
            }

            const product = results[0];

            // cart 테이블에 추가
            const cartQuery = `
                INSERT INTO cart (name, brand, category, price, carbon, num, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            conn.query(cartQuery, [product.name, product.brand, product.category, product.price, product.carbon, product.num, userId], (err, result) => {
                conn.release();
                if (err) {
                    console.log('장바구니 추가 실패:', err);
                    return res.status(500).json({ success: false, message: '장바구니 추가 실패' });
                }

                res.status(200).json({ success: true, message: '장바구니에 추가되었습니다.' });
            });
        });
    });
});


app.delete('/delete-cart-item/:name/:user_id', (req, res) => {
    const { name, user_id } = req.params;

    const deleteQuery = 'DELETE FROM cart WHERE name = ? AND user_id = ?';
    pool.query(deleteQuery, [name, user_id], (err, result) => {
        if (err) {
            console.error('삭제 중 오류 발생:', err);
            res.status(500).send('삭제 실패');
        } else if (result.affectedRows === 0) {
            console.log('삭제할 항목을 찾을 수 없음'); // affectedRows가 0인 경우, 해당 항목이 없는 것
            res.status(404).send('삭제할 항목이 없습니다');
        } else {
            console.log('삭제 성공:'); // 성공 로그
            res.status(200).send('삭제 성공');
        }
    });
});



app.get('/get-cart-items', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        console.log('로그인되지 않은 상태입니다.');
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const query = `
    SELECT name, brand, category, price, carbon, num 
    FROM cart 
    WHERE user_id = ?
    `;

    pool.query(query, [userId], (err, rows) => {
        if (err) {
            console.error('장바구니 조회 오류:', err);
            return res.status(500).json({ message: '서버 오류로 인해 장바구니를 조회할 수 없습니다.' });
        }
        res.json(rows); // 장바구니에 담긴 상품 정보를 JSON으로 반환
    });
});

app.post('/purchase-item', (req, res) => {
    const { userId } = req.session;
    const { productName, itemTotalCarbon } = req.body; // itemTotalCarbon을 받아옴

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const getCartQuery = `
        SELECT carbon FROM cart WHERE user_id = ? AND name = ?
    `;
    pool.query(getCartQuery, [userId, productName], (err, cartResults) => {
        if (err || cartResults.length === 0) {
            console.error('카트 조회 중 오류 발생:', err);
            return res.status(500).json({ message: '카트 조회 실패' });
        }

        // 여기서 itemTotalCarbon 값을 사용
        // 기존의 cart에서 가져온 carbon을 itemTotalCarbon으로 대체
        const carbon = itemTotalCarbon; 

        // 유저의 carbon을 itemTotalCarbon으로 업데이트
        const updateUserCarbonQuery = `
            UPDATE users SET carbon = COALESCE(carbon, 0) + ? WHERE id = ?
        `;
        pool.query(updateUserCarbonQuery, [carbon, userId], (err) => {
            if (err) {
                console.error('유저 탄소 업데이트 중 오류 발생:', err);
                return res.status(500).json({ message: '탄소 절감량 업데이트 실패' });
            }

            // 카트에서 해당 항목 삭제
            const deleteCartItemQuery = `DELETE FROM cart WHERE user_id = ? AND name = ?`;
            pool.query(deleteCartItemQuery, [userId, productName], (err) => {
                if (err) {
                    console.error('카트 항목 삭제 중 오류 발생:', err);
                    return res.status(500).json({ message: '카트 항목 삭제 실패' });
                }

                res.status(200).json({ message: '구매 완료', totalCarbonReduction: carbon });
            });
        });
    });
});



app.get('/api/user-carbon', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        console.log('세션에 userId가 없습니다. 인증되지 않은 접근입니다.');
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const query = `SELECT carbon FROM users WHERE id = ?`;
    pool.query(query, [userId], (err, results) => {
        if (err) {
            console.error('유저 탄소 조회 중 오류 발생:', err);
            return res.status(500).json({ message: '유저 탄소 조회 실패' });
        }

        if (results.length > 0) {
            const userCarbon = results[0].carbon || 0;
            console.log('조회된 carbon 데이터:', userCarbon);
            res.json({ carbon: userCarbon });
        } else {
            console.log('해당 userId에 대한 데이터가 없습니다.');
            res.status(404).json({ message: '사용자 데이터를 찾을 수 없습니다.' });
        }
    });
});



// 구독상품 페이지
// 구독상품 페이지 - 카테고리에 따라 상품을 필터링하는 API
app.get('/products', (req, res) => {
    const category = req.query.category;
    let query = 'SELECT * FROM product_subscribe';
    const values = [];

    if (category && category !== '전체') {
        query += ' WHERE category = ?';
        values.push(category);
    }

    pool.getConnection((err, conn) => {
        if (err) {
            console.error('MySQL getConnection error:', err);
            res.status(500).json({ error: 'DB connection failed' });
            return;
        }

        conn.query(query, values, (err, results) => {
            conn.release();

            if (err) {
                console.error('SQL query error:', err);
                res.status(500).json({ error: 'SQL query failed' });
                return;
            }

            res.json(results);
        });
    });
});

// 정적 파일 제공 설정 (예: public 폴더에 이미지가 있는 경우)
app.use('/frontend/img', express.static(path.join(__dirname, 'frontend/img')));


//productdetail.html의 코드
// app.get('/product/:id', (req, res) => {
//     const productId = req.params.id;

//     pool.getConnection((err, conn) => {
//         if (err) {
//             conn.release();
//             console.log('데이터베이스 연결 오류');
//             res.status(500).send('데이터베이스 연결 실패');
//             return;
//         }

//         const query = 'SELECT * FROM product WHERE id = ?';
//         conn.query(query, [productId], (err, results) => {
//             conn.release();
//             if (err || results.length === 0) {
//                 console.log('상품 정보를 가져오는 중 오류 발생:', err);
//                 res.status(500).send('상품을 찾을 수 없습니다.');
//             } else {
//                 res.json(results[0]);
//             }
//         });
//     });
// });


// 패키지 상세 페이지
// 패키지 상세 정보를 가져오는 API
app.get('/package/:id', (req, res) => {
    const packageId = req.params.id; // URL에서 패키지 ID 추출

    pool.getConnection((err, conn) => {
        if (err) {
            conn.release();
            console.error('MySQL getConnection error:', err);
            res.status(500).json({ error: 'DB connection failed' });
            return;
        }

        const query = 'SELECT * FROM product_subscribe WHERE id = ?';
        conn.query(query, [packageId], (err, results) => {
            conn.release();
            if (err || results.length === 0) {
                console.error('SQL query error:', err);
                res.status(500).json({ error: 'Package not found' });
            } else {
                res.json(results[0]);
            }
        });
    });
});

// 구독 상태 확인 및 업데이트
app.get('/check-subscription', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: '로그인 필요' });
    }

    const userId = req.session.userId;

    pool.query('SELECT issubscribe FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'DB 오류' });
        }

        if (results.length > 0 && results[0].issubscribe === 1) {
            // 이미 구독된 상태
            res.json({ isSubscribed: true });
        } else {
            // 구독 상태 업데이트
            pool.query('UPDATE users SET issubscribe = 1 WHERE id = ?', [userId], (err) => {
                if (err) {
                    return res.status(500).json({ message: 'DB 업데이트 오류' });
                }
                res.json({ isSubscribed: false });
            });
        }
    });
});

// 서버 리스닝
app.listen(3000,() => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});