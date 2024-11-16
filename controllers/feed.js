exports.getPosts = (req, res, next) =>{
    res.status(200).json({
        posts: [{ title : 'First Post', content: 'This is the first posts!' }]
    });
};

exports.createPost = (req, res, next) =>{
    const title = req.body.title;
    const content = req.body.content;
    console.log(title, content);
    res.status(201).json({
        message: 'Post created success',
        post: { id: new Date().toISOString(), title: title, content: content }
    })
}