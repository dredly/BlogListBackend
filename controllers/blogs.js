const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
	const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
	response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
	const blog = new Blog(request.body)
	// Temporarily pick a random user to assign to the blog
	const allUsers = await User.find({})
	const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)]
	blog.user = randomUser._id
	const savedBlog = await blog.save()
	randomUser.blogs = randomUser.blogs.concat(savedBlog._id)
	await randomUser.save()
	response.status(201).json(savedBlog)
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
	await Blog.findByIdAndRemove(request.params.id)
	response.status(204).end()
})

module.exports = blogsRouter