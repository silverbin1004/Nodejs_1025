require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const path = require('path');

const User = require('./models/User');

const app = express();

mongoose.connect(process.env.MONGO_URL,{

})
.then(()=>{
  console.log('MongoDB 연결 성공');
})
.catch((err)=>{
  console.error("MongoDB 연결 Error: ", err);
})

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));

app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false}
}));

app.use(csrf({cookie: true}));
app.use(express.static(path.join(__dirname,'public')));

app.use((req,res, next)=>{
  res.locals.csrfToken = req.csrfToken();
  res.locals.currentUser = req.session.user;
  next();
});

app.get('/',(req,res)=>{
  if(req.session.user){
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

app.get('/signup', (req,res)=>{
  res.render('signup', {error: null});
});

app.post('/signup', async (req,res)=>{
  const {username, email, password, confirmPassword} = req.body;

  if(!username || !email || !password || !confirmPassword){
    return res.render('signup', {error: '모든 필드를 입력하세요.'});
  }
  if(password != confirmPassword){
    return res.render('signup', {error: '비밀번호가 일치하지 않습니다.'});
  }
  try{
    const existingUser = await User.findOne({$or: [{email}, {username}]});
    
    if(existingUser){
      return res.render('signup', {error: '이미 존재하는 사용자입니다.'});
    }

    const user = new User({username, email, password});
    await user.save();

    req.session.user = { id: user._id, username: user.username, email: user.email };
    res.redirect('/dashboard');
  } catch(err){
    console.error(err);
    res.render('signup', {error: '회원가입 중 오류가 발생했습니다.'});
  }
});

app.get('/login', (req,res)=>{
  res.render('login', {error: null});
});

app.post('/login', async (req,res)=>{
  const {email, password} = req.body;

  if(!email || !password){
    return res.render('login', {error: '모든 필드를 입력해 주세요.'});
  }

  try{
    const user = await User.findOne({email});
    if(!user){
      return res.render('login', {error: '이메일 또는 비밀번호가 일치하지 않습니다.'});
    }

    const isMatch = await user.comparePassword(password);
    if(!isMatch){
      return res.render('login', {error: '이메일 또는 비밀번호가 일치하지 않습니다.'});
    }

    req.session.user = {id: user.id, username: user.username, email: user.email};
    res.redirect('/dashboard');
  } catch(err){
    console.error(err);
    res.render('login', {error: '로그인 중 오류가 발생했습니다.'});
  }
});

app.get('/dashboard', (req,res)=>{
  if(!req.session.user){
    return res.redirect('/login');
  }
  res.render('dashboard', {user: req.session.user});
});

app.get('/logout', (req,res)=>{
  req.session.destroy(err => {
    if(err){
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});