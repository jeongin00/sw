const express = require('express');
const mysql = require('mysql'); // npm install mysql
const path = require('path'); // public 안에 html을 연결해줌
const static = require('serve-static'); // 조상 경로 설정 sw폴더를 임의정으로 상위폴더로 설정

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

// 웹서버 만들기
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', static(path.join(__dirname, 'public'))); // public 디렉토리 지정

// 서버 시작 시 테이블 생성 호출
createTable();

// 정적 파일 제공 설정(이렇게해야 폴더 두개 겸용가능)
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// 유나 메인페이지를 기본 페이지로 설정 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html')); // frontend 폴더의 index.html을 기본 페이지로 설정
});
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
            'insert into users(id,name,age,password) values(?,?,?,?)',
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
                    console.log('Inserted 성공');

                    res.writeHead('200', { 'Content-Type': 'text/html; charset=utf8' });
                    res.write('<h2>사용자 추가 성공</h2>');
                    res.end();
                } else {
                    console.log('Inserted 실패');

                    res.writeHead('200', { 'Content-Type': 'text/html; charset=utf8' });
                    res.write('<h1>사용자 추가 실패</h1>');
                    res.end();
                }
            }
        );
    });
});

app.post('/process/login', (req, res) => {
    console.log('/process/login 호출됨 ' + req);
    const paramId = req.body.id;
    const paramPassword = req.body.password;

    console.log('로그인 요청 ' + paramId + ' ' + paramPassword);

    pool.getConnection((err, conn) => {
        if (err) {
            conn.release();
            console.log('Mysql getConnection error. aborted');
            res.writeHead('200', { 'Content-Type': 'text/html; charset=utf8' });
            res.write('<h1>로그인 실패</h1>');
            res.end();
            return;
        }
        const exec = conn.query(
            'select `id` from `users` where `id` = ? and `password`= ?',
            [paramId, paramPassword],
            (err, rows) => {
                conn.release();
                console.log('실행된 SQL query: ' + exec.sql);

                if (err) {
                    console.dir(err);
                    res.writeHead('200', { 'Content-Type': 'text/html; charset=utf8' });
                    res.write('<h1>SQL query 실행 실패</h1>');
                    res.end();
                    return;
                }
                if (rows.length > 0) {
                    console.log('아이디[%s], 패스워드가 일치하는 사용자 [%s] 찾음', paramId, rows[0].name);
                    res.writeHead('200', { 'Content-Type': 'text/html; charset=utf8' });
                    res.write('<h2>로그인 성공</h2>');
                    res.end();
                    return;
                } else {
                    console.log('아이디[%s], 패스워드 일치없음', paramId);
                    res.writeHead('200', { 'Content-Type': 'text/html; charset=utf8' });
                    res.write('<h2>로그인 실패. 아이디와 패스워드를 확인하세요</h2>');
                    res.end();
                    return;
                }
            }
        );
    });
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});




