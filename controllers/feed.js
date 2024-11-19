const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const io = require('../socket');

const Post = require('../models/post');
const User = require('../models/user');
exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;

    try {
        // Tính tổng số bài viết
        totalItems = await Post.find().countDocuments();

        // Lấy bài viết với phân trang
        const posts = await Post.find()
            .populate('creator')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        // Kiểm tra nếu không có bài viết nào
        // if (!posts || posts.length === 0) {
        //     const error = new Error('Post not found');
        //     error.status = 401;
        //     throw error;
        // }
        // Trả về bài viết và tổng số bài viết
        res.status(200).json({
            message: 'Post found success',
            posts: posts,
            totalItems: totalItems
        });
    } catch (err) {
        // Xử lý lỗi
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};


exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
    }

    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    const post = new Post({
        title,
        content,
        imageUrl: imageUrl,
        creator: req.userId
    });

    try {
        // Save post
        const result = await post.save();

        // Find user
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        // Update user and save
        creator = user;
        user.posts.push(post);
        await user.save();
        io.getIO().emit('posts', {action: 'create', post: {...post._doc, creator: {_id: req.userId, name: user.name}}});
        // Respond with success
        res.status(201).json({
            message: 'Post created successfully.',
            post: post,
            creator: {
                _id: creator._id,
                name: creator.name
            }
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // Pass the error to the error-handling middleware
    }
};


exports.getPost = async (req, res, next) =>{
    const postId = req.params.postId;

    try {
        const post = await Post.findById(postId);
        if(!post){
            const error = new Error('Post not found');
            error.status = 401;
            throw error;
        }
        res.status(200).json({ message: 'Post found success', post: post });

    }catch(err){
        if (!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.updatePost = async (req, res, next) =>{
    const postId = req.params.postId;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.status = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file){
        imageUrl = req.file.path;
    }
    if (!imageUrl){
        const error = new Error('Image provided');
        error.status = 422;
        throw error;
    }

    try {
        const post = await Post.findById(postId).populate('creator');
        if(!post){
            const error = new Error('Post not found');
            error.status = 422;
            throw error;
        }
        if (post.creator._id.toString() !== req.userId){
            const error = new Error('Not authorized!');
            error.statusCode = 403;
            throw error;
        }
        if (imageUrl !== post.imageUrl){
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        const result = await post.save();
        io.getIO().emit('posts', {action: 'update', post: result});
        res.status(200).json({ message: 'Post updated success', post: result });
    }catch(err){
        if (!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;

    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Post not found.');
            error.statusCode = 404;
            throw error;
        }

        // Check if the user is authorized to delete the post
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized!');
            error.statusCode = 403;
            throw error;
        }

        // Clear image from the server
        clearImage(post.imageUrl);
        const result = await Post.findByIdAndDelete(postId);
        if (!result) {
            const error = new Error('Failed to delete the post.');
            error.statusCode = 500;
            throw error;
        }
        // Find user and remove post reference
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        await user.posts.pull(postId); // Remove the post from the user's post list
        await user.save();
        io.getIO().emit('posts', {action: 'delete', post: postId});
        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (err){
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}