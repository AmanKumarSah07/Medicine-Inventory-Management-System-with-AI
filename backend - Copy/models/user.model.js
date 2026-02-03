const mongoose = require('mongoose');

const userschema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password:{
    type: String,
    required: true,
    unique: true,
  },
  })
  const user=mongoose.model('user',userschema);
  module.export=userschema;