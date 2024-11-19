const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = (req, res, next) =>{
    Post.find()
        .then(posts =>{
            if(!posts){
                const error = new Error('Post not found');
                error.status = 401;
                throw error;
            }
            res.status(200).json({
                message: 'Post found success',
                posts: posts });
        })
        .catch(err => {
            if (!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.createPost = (req, res, next) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.status = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({
        title,
        content,
        imageUrl: 'images/img.png',
        creator: {
            name: 'Tai Van',
        },
    });
    post
        .save()
        .then(result => {
            console.log(result);
            res.status(201).json({
                message: 'Post created success',
                post: result
            })
        })
        .catch(err => {
            if (!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.getPost = (req, res, next) =>{
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post =>{
            if(!post){
                const error = new Error('Post not found');
                error.status = 401;
                throw error;
            }
            res.status(200).json({ message: 'Post found success', post: post });
        })
        .catch(err => {
            if (!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
}