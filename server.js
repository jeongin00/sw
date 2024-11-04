const express = require('express');
const mysql = require('mysql2'); // npm install mysql + 2로 변경
const path = require('path');
const static = require('serve-static');

const app = express();
const port = 3000;

// Database connection pool
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'swdata',
    debug: false
});

// 테이블 생성 함수
const createTable = () => {
    pool.getConnection((err, conn) => {
        if (err) {
            console.log('MySQL 연결 오류:', err);
            return;
        }

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(100) NOT NULL COMMENT '사용자 로그인 id',
                name VARCHAR(100) NOT NULL COMMENT '사용자 이름',
                age SMALLINT UNSIGNED NOT NULL COMMENT '사용자 나이',
                password VARCHAR(300) NOT NULL COMMENT '로그인 암호, 패스워드',
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `;

        conn.query(createTableQuery, (err, result) => {
            conn.release();
            if (err) {
                console.log('테이블 생성 중 오류 발생:', err);
                return;
            }
        });
    });
};

// 서버 시작 시 테이블 생성 호출
createTable();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', static(path.join(__dirname, 'public')));
app.use('/frontend', static(path.join(__dirname, 'frontend')));

// 메인 페이지 설정
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// 사용자 추가 API
app.post('/process/adduser', (req, res) => {
    const { id, name, age, password } = req.body;

    pool.getConnection((err, conn) => {
        if (err) {
            conn.release();
            console.log('MySQL getConnection error. aborted');
            res.status(500).send('<h1>DB서버 연결 실패</h1>');
            return;
        }

        const exec = conn.query(
            'INSERT INTO users (id, name, age, password) VALUES (?, ?, ?, ?)',
            [id, name, age, password],
            (err, result) => {
                conn.release();
                if (err) {
                    console.log('SQL 실행 중 오류 발생:', err);
                    res.status(500).send('<h1>SQL query 실행 실패</h1>');
                    return;
                }
                res.status(200).send('<h2>사용자 추가 성공</h2>');
            }
        );
    });
});

// 로그인 API
app.post('/process/login', (req, res) => {
    const { id, password } = req.body;

    pool.getConnection((err, conn) => {
        if (err) {
            conn.release();
            console.log('MySQL getConnection error. aborted');
            res.status(500).send('<h1>로그인 실패</h1>');
            return;
        }

        const exec = conn.query(
            'SELECT id FROM users WHERE id = ? AND password = ?',
            [id, password],
            (err, rows) => {
                conn.release();
                if (err) {
                    res.status(500).send('<h1>SQL query 실행 실패</h1>');
                    return;
                }
                if (rows.length > 0) {
                    res.status(200).send('<h2>로그인 성공</h2>');
                } else {
                    res.status(200).send('<h2>로그인 실패. 아이디와 패스워드를 확인하세요</h2>');
                }
            }
        );
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


// 서버 실행
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다`);
});
