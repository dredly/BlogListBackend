const { blogs } = require('./dummy_data')
const { nonExistingId, usersInDb } = require('./test_helpers')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')

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

	test('a blog added without likes will have its likes value default to 0', async () => {
		const newBlog = {
			title: 'Test blog',
			author: 'Miguel',
			url: 'google.com',
		}
		const postedBlog = await api
			.post('/api/blogs')
			.send(newBlog)
		expect(postedBlog._body.likes).toBeDefined()
		expect(postedBlog._body.likes).toBe(0)
	})

	test('a blog added without a title and url will result in a 400 response code', async () => {
		const newBlog = {
			author: 'jake'
		}
		await api
			.post('/api/blogs')
			.send(newBlog)
			.expect(400)
	})
})

describe('deleting a blog', () => {
	test('succeeds with status code 204 if id is valid', async () => {
		const blogsAtStart = await api.get('/api/blogs')
		const blogToDelete = blogsAtStart.body[0]
		await api
			.delete(`/api/blogs/${blogToDelete.id}`)
			.expect(204)

		const blogsAtEnd = await api.get('/api/blogs')
		expect(blogsAtEnd.body).toHaveLength(blogs.length - 1)
		const titles = blogsAtEnd.body.map(b => b.title)
		expect(titles).not.toContain(blogToDelete.title)
	})

	test('still responds with status code 204 if blog is not found, but nothing is deleted', async () => {
		const id = await nonExistingId()
		await api
			.delete(`/api/blogs/${id}`)
			.expect(204)
		const blogsAtEnd = await api.get('/api/blogs')
		expect(blogsAtEnd.body).toHaveLength(blogs.length)
	})
})

describe('updating a blog', () => {
	test('succeeds with valid data', async () => {
		const blogsAtStart = await api.get('/api/blogs')
		const blogToUpdate = blogsAtStart.body[0]
		const blogWithChanges = { ...blogToUpdate, likes: 10 }
		await api
			.put(`/api/blogs/${blogToUpdate.id}`)
			.send(blogWithChanges)
			.expect(200)
			.expect('Content-Type', /application\/json/)
	})
	test('fails with status code 400 if given invalid data', async () => {
		const blogsAtStart = await api.get('/api/blogs')
		const blogToUpdate = blogsAtStart.body[0]
		const blogWithChanges = { ...blogToUpdate, likes: -10 }
		await api
			.put(`/api/blogs/${blogToUpdate.id}`)
			.send(blogWithChanges)
			.expect(400)
	})
})

describe('creating a user', () => {
	beforeEach(async () => {
		await User.deleteMany({})
		const passwordHash = await bcrypt.hash('miguel', 10)
		const user = new User({ username: 'root', passwordHash })
		await user.save()
	})

	test('creation succeeds with a fresh username and valid data', async () => {
		const usersAtStart = await usersInDb()
		const newUser = {
			username: 'zlatan123',
			name: 'Zlatan Ibrahimovic',
			password: 'zlatan'
		}
		await api
			.post('/api/users')
			.send(newUser)
			.expect(201)
			.expect('Content-Type', /application\/json/)

		const usersAtEnd = await usersInDb()
		expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

		const usernames = usersAtEnd.map(u => u.username)
		expect(usernames).toContain(newUser.username)
	})

	test('creation fails with proper status code and message if username taken, but data otherwise valid', async () => {
		const usersAtStart = await usersInDb()
		const newUser = {
			username: 'root',
			password: 'rootpass'
		}
		const result = await api
			.post('/api/users')
			.send(newUser)
			.expect(400)
			.expect('Content-Type', /application\/json/)

		expect(result.body.error).toContain('username must be unique')
		const usersAtEnd = await usersInDb()
		expect(usersAtEnd).toEqual(usersAtStart)
	})

	test('creation fails with proper status code and message if password is less than 3 characters', async () => {
		const usersAtStart = await usersInDb()
		const newUser = {
			username: 'johnnyd',
			password: 'jd'
		}
		const result = await api
			.post('/api/users')
			.send(newUser)
			.expect(400)
			.expect('Content-Type', /application\/json/)

		expect(result.body.error).toContain('password must be at least 3 characters')
		const usersAtEnd = await usersInDb()
		expect(usersAtEnd).toEqual(usersAtStart)
	})

	test('creation fails with proper status code and message if username is less than 3 characters', async () => {
		const usersAtStart = await usersInDb()
		const newUser = {
			username: 'j',
			password: 'johnnyd123'
		}
		const result = await api
			.post('/api/users')
			.send(newUser)
			.expect(400)
			.expect('Content-Type', /application\/json/)

		expect(result.body.error).toContain('shorter than the minimum allowed length (3)')
		const usersAtEnd = await usersInDb()
		expect(usersAtEnd).toEqual(usersAtStart)
	})

	test('creation fails with proper status code and message if username not provided', async () => {
		const usersAtStart = await usersInDb()
		const newUser = {
			name: 'joe',
			password: 'joejoe'
		}
		const result = await api
			.post('/api/users')
			.send(newUser)
			.expect(400)
			.expect('Content-Type', /application\/json/)

		expect(result.body.error).toContain('User validation failed: username: Path `username` is required.')
		const usersAtEnd = await usersInDb()
		expect(usersAtEnd).toEqual(usersAtStart)
	})
})

afterAll(() => {
	mongoose.connection.close()
})
