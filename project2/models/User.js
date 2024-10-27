const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+\@.+\..+/, '유효한 이메일 주소를 입력해주세요.'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  }
});

UserSchema.pre('save', async function(next){
  if(!this.isModified('password')){
    return next();
  }

  try{
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch(err){
    next(err);
  }
});

UserSchema.methods.comparePassword = function(candidatePassword){
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('USer', UserSchema);