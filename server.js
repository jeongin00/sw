const express = require('express');
const mysql = require('mysql'); // npm install mysql
const path = require('path'); // public 안에 html을 연결해줌
const static = require('serve-static'); // 조상 경로 설정 sw폴더를 임의정으로 상위폴더로 설정
const session = require('express-session');

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

// 유저 추가
app.post('/process/adduser', (req, res) => {
    console.log('/process/adduser 호출됨 ' + req);

    const paramId = req.body.id;
    const paramName = req.body.name;
    const paramAge = req.body.age;
    const paramPassword = req.body.password;

    pool.getConnection((err, conn) => {
        if (err) {
            conn.release();
            console.log('Mysql getConnection error. aborted');
            res.writeHead('200', { 'Content-Type': 'text/html; charset=utf8' });
            res.write('<h1>DB서버 연결 실패</h1>');
            res.end();
            return;
        }

        console.log('데이터베이스 연결 끈 얻었습니다.');

        const exec = conn.query(
            'insert into users(id, name, age, password) values(?, ?, ?, ?)',
            [paramId, paramName, paramAge, paramPassword],
            (err, result) => {
                conn.release();
                console.log('실행된 SQL: ' + exec.sql);

                if (err) {
                    console.log('SQL 실행시 오류 발생');
                    console.dir(err);
                    res.writeHead('200', { 'Content-Type': 'text/html; charset=utf8' });
                    res.write('<h1>SQL query 실행 실패</h1>');
                    res.end();
                    return;
                }

                if (result) {
                    console.dir(result);
                    console.log('사용자 추가 성공');
                    res.redirect('/public/login.html'); // 회원가입 성공 시 로그인 페이지로 리디렉션
                } else {
                    console.log('사용자 추가 실패');
                    res.writeHead('200', { 'Content-Type': 'text/html; charset=utf8' });
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
                    req.session.userId = rows[0].id; // 세션에 사용자 ID 저장
                    console.log(' 저장된 userId:', req.session.userId); // 확인
                    res.redirect('/public/mypage.html');
                }
            }
        );
    });
});

// 상품 추가
app.post('/add-product', (req, res) => {
    console.log('/add-product 호출됨');

    const { category, brand, name, price, carbon, userId } = req.body; // 클라이언트로부터 받은 상품 정보와 userId

    pool.getConnection((err, conn) => {
        if (err) {
            conn.release();
            console.log('Mysql getConnection error. aborted');
            res.status(500).json({ success: false, message: 'DB 연결 실패' });
            return;
        }

        const query = `
            INSERT INTO product (name, brand, category, price, carbon)
            VALUES (?, ?, ?, ?, ?)
        `;

        conn.query(query, [name, brand, category, price, carbon || null], (err, result) => {
            if (err) {
                console.log('SQL 실행 오류:', err);
                conn.release(); // 연결 해제
                res.status(500).json({ success: false, message: '상품 추가 실패' });
                return;
            }

            if (result.affectedRows > 0) {
                console.log('상품 추가 성공');

                // 장바구니에도 추가
                const productId = result.insertId; // 추가된 제품의 ID
                const cartQuery = 'INSERT INTO cart (user_id, product_id) VALUES (?, ?)';
                
                console.log('장바구니에 추가할 userId:', userId); // 로그 추가
                conn.query(cartQuery, [userId, productId], (err, cartResult) => {
                    conn.release(); // 연결 해제

                    if (err) {
                        console.error('장바구니 추가 실패:', err);
                        return res.status(500).json({ success: false, message: '상품 추가는 성공했으나 장바구니 추가 실패' });
                    }

                    console.log(`장바구니에 추가 성공!`);
                    res.status(200).json({ success: true, message: '상품 추가 성공 및 장바구니에 추가되었습니다.' });
                });
            } else {
                console.log('상품 추가 실패');
                conn.release(); // 연결 해제
                res.status(500).json({ success: false, message: '상품 추가 실패' });
            }
        });
    });
});



// 매장 정보 조회 API
app.get('/api/stores', (req, res) => {
    const { province, city } = req.query;

    // 기본 쿼리 설정: 모든 매장을 가져오도록 설정
    let query = `SELECT name, province, city, phone, image_url FROM stores`;
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
    if (!req.session.userId) { // 로그인 상태 확인
        return res.redirect('/public/login.html'); // 로그인 페이지로 리디렉션
    }
    res.sendFile(path.join(__dirname, 'public', 'mypage.html')); // 마이페이지 제공
});

// 로그인 상태 확인
app.get('/check-login', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true }); // 로그인 상태일 경우
    } else {
        res.status(401).json({ loggedIn: false }); // 로그인 상태가 아닐 경우
    }
});

// 서버 리스닝
app.listen(3000, () => {
    console.log('http://localhost:3000/');
});
