const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const Comment = require('../models/comment')

blogsRouter.get('/', async (request, response) => {
	const blogs = await Blog.find({})
		.populate('user', { username: 1, name: 1 })
		.populate('comments', { text: 1 })
	response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
	const blog = await Blog.findById(request.params.id)
		.populate('user', { username: 1, name: 1 })
		.populate('comments', { text: 1 })
	if (!blog) {
		return response.status(400).json({ error: 'This blog does not exist' })
	}
	response.json(blog)
})

blogsRouter.post('/', async (request, response) => {
	const user = request.user
	const blog = new Blog(request.body)
	blog.user = user._id
	const savedBlog = await blog.save()
	user.blogs = user.blogs.concat(savedBlog._id)
	await user.save()
	response.status(201).json(savedBlog)
})

blogsRouter.post('/:id/comments', async (request, response) => {
	const blog = await Blog.findById(request.params.id)
	const comment = new Comment(request.body)
	comment.blog = blog._id
	const savedComment = await comment.save()
	blog.comments = blog.comments.concat(savedComment._id)
	await blog.save()
	response.status(201).json(savedComment)
})

blogsRouter.put('/:id', async (request, response) => {
	const body = request.body

	const blog = {
		title: body.title,
		author: body.author,
		url: body.url,
		likes: body.likes
	}

	const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
		new: true, runValidators: true, context: 'query'
	})
	response.json(updatedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
	const user = request.user
	const blog = await Blog.findById(request.params.id)
	if (!blog) {
		return response.status(400).json({ error: 'This blog does not exist' })
	}
	if (blog.user.toString() !== user._id.toString()) {
		return response.status(403).json({ error: 'forbidden - you can only delete your own blog' })
	}
	await Blog.findByIdAndRemove(request.params.id)
	response.status(204).end()
})

module.exports = blogsRouter