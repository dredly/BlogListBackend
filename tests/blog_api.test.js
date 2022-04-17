const { blogs } = require('./dummy_data')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')

const api = supertest(app)

beforeEach(async () => {
	await Blog.deleteMany({})
	const blogObjects = blogs.map(blog => new Blog(blog))
	const promiseArray = blogObjects.map(blogObject => blogObject.save())
	await Promise.all(promiseArray)
})

describe('getting all blogs', () => {
	test('blogs are returned as JSON', async () => {
		await api
			.get('/api/blogs')
			.expect(200)
			.expect('Content-Type', /application\/json/)
	})

	test('all blogs are returned', async () => {
		const response = await api.get('/api/blogs')
		expect(response.body).toHaveLength(blogs.length)
	})

	test('the unique identifier property of a blog post is named id', async () => {
		const response = await api.get('/api/blogs')
		expect(response.body[0].id).toBeDefined()
	})
})

describe('adding a blog', () => {
	test('a valid blog can be added', async () => {
		const newBlog = {
			title: 'Test blog',
			author: 'Miguel',
			url: 'google.com',
			likes: 12
		}
		await api
			.post('/api/blogs')
			.send(newBlog)
			.expect(201)
			.expect('Content-Type', /application\/json/)

		const blogsAtEnd = await api.get('/api/blogs')
		const titles = blogsAtEnd.body.map(b => b.title)

		expect(blogsAtEnd.body).toHaveLength(blogs.length + 1)
		expect(titles).toContain('Test blog')
	})
})

afterAll(() => {
	mongoose.connection.close()
})
