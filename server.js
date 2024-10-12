const express = reqire('express')
const mysql = reqire('mysql') //npm install mysql
const path = reqire('path') // public 안에 html을 연결해줌
const static = require('serve-static') // 조상 경로 설정 sw폴더를 임의정으로 상위폴더로 설정



// Database connection pool
const pool = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    user: 'root',
    password: '1234',
    database: 'swdata',
    debug:false
})

//웹서버 만들기
const app = express()
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use('/public', static(path.join(__dirname, 'public')));//public 디렉토리 지정

app.post('/process/adduser', (req,res)=> {
    console.log('/process/adduser 호출됨 '+req)

    const paramId = req.body.id;
    const paramName = req.bdoy.name;
    const paramAge = req.body.age;
    const paramPassword = req.body.password;  

    pool.getConnection((err, conn)=> {

        if(err){
            conn.release();
            console.log('Mysql getConnection error. aborted');
            res.writeHead('200', {'content-Type':'text/html; charset=utf8'})
            res.write('<h1>DB서버 연결 실패</h1>')
            res.end();    
            return;
        }

        console.log('데이터베이스 연결 끈 얻었습니다.');

        const exec = conn.query('insert into users(id,name,age,password) values(?,?,?,?)',
                    [paramId, paramName, paramAge, paramPassword],
                    (err, result)=>{
                        conn.release();
                        console.log('실행된 SQL: '+exec.sql)    

                        if(err){
                            console.log('SQL 실행시 오류 발생')
                            console.dir(err);
                            res.writeHead('200', {'content-Type':'text/html; charset=utf8'})
                            res.write('<h1>SQL 실행 실패</h1>')
                            res.end();                           
                            return
                        }
                        if(result){
                            console.dir(result)
                            console.log('Inserted 성공')

                            res.writeHead('200',{'Content-Type':'text/html; charset=utf8'})
                            res.write('<h2>사용자 추가 성공</h2>')
                            res.end();
                        }
                        else{
                            conseole.log('Inserted 실패')

                            res.writeHead('200',{'Content-Type':'text/html; charset=utf8'})
                            res.write('<h1>사용자 추가 실패</h1>')   
                            res.end()
                        }
            }
        )
    })


})




