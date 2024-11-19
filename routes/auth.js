const express = require('express');
const { body } = require('express-validator');
const User = require('../models/user');
const authController = require('../controllers/auth');
const res = require("express/lib/response");
const router = express.Router();

router.post('/signup', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, {req})=> {
            return User.findOne({email: value})
                .then((user) => {
                    if (user) {
                        return Promise.reject('Email already exists');
                    }
                });
        })
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({ min: 5 }),
    body('name')
        .trim()
        .not()
        .isEmpty(),
], authController.signup);

router.post('/login',[
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, {req})=> {
            return User.findOne({email: value})
                .then((user) => {
                    if (!user) {
                        return Promise.reject('Email not exists');
                    }
                });
        })
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({ min: 5 })
], authController.login);

module.exports = router;