const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const { email, password, name } = req.body;

    try {
        // Hash the password using bcrypt
        const hashedPw = await bcrypt.hash(password, 12);

        // Create a new user
        const user = new User({
            email: email,
            name: name,
            password: hashedPw,
        });

        // Save the user to the database
        const result = await user.save();

        // Respond with the user ID
        res.status(201).json({
            message: 'User saved successfully.',
            userId: result._id,
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // Pass the error to the error handling middleware
    }
};

exports.login = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                const error = new Error('A user with email could not be found');
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password)
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Validation failed');
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign({
                email: loadedUser.email,
                userId: loadedUser.id.toString()
            },
                'truongvantai',
                { expiresIn: '1h' });
            res.status(200).json({ token: token, userId: loadedUser._id.toString() });

        })
        .catch(err => {
            if (!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        })

}