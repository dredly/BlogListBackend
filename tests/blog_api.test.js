const { blogs } = require('./dummy_data')
const { initialUsers } = require('../seeds/initial_users')
const { asyncForEach } = require('../utils/helper_functions')
const { nonExistingId, usersInDb } = require('./test_helpers')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')

const api = supertest(app)

const authenticateUser = async user => {
	// Get a token to simulate a user being logged in
	const password = initialUsers.filter(u => u.username === user.username)[0].password
	const loginResponse = await api
		.post('/api/login')
		.send({
			username: user.username,
			password: password
		})
	return loginResponse.body.token
}

beforeEach(async () => {
	await Blog.deleteMany({})
	await User.deleteMany({})
	const saltRounds = 10
	const initialUsersHashed = await Promise.all(initialUsers.map(async u => {
		const passwordHash = await bcrypt.hash(u.password, saltRounds)
		return new User({
			username: u.username,
			name: u.name,
			passwordHash: passwordHash
		})
	}))
	await User.insertMany(initialUsersHashed)
	const allUsers = await User.find({})
	await asyncForEach(blogs, async b => {
		const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)]
		b.user = randomUser._id
		const newBlog = new Blog(b)
		const savedBlog = await newBlog.save()
		randomUser.blogs = randomUser.blogs.concat(savedBlog._id)
		await randomUser.save()
	})
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
	let token = null
	beforeEach(async () => {
		const testUser = await User.findOne({})
		token = await authenticateUser(testUser)
	})
	test('a valid blog can be added', async () => {
		const newBlog = {
			title: 'Test blog',
			author: 'Miguel',
			url: 'google.com',
			likes: 12
		}
		await api
			.post('/api/blogs')
			.set('Authorization', `bearer ${token}`)
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
			.set('Authorization', `bearer ${token}`)
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
			.set('Authorization', `bearer ${token}`)
			.send(newBlog)
			.expect(400)
	})

	test('a blog added without providing a token will result in an error with a 401 response code', async () => {
		const newBlog = {
			title: 'Test blog',
			author: 'Miguel',
			url: 'google.com',
			likes: 12
		}
		await api
			.post('/api/blogs')
			.send(newBlog)
			.expect(401)

		const blogsAtEnd = await api.get('/api/blogs')
		expect(blogsAtEnd.body).toHaveLength(blogs.length)
	})
})

describe('deleting a blog', () => {
	test('succeeds with status code 204 if id is valid', async () => {
		const blogsAtStart = await api.get('/api/blogs')
		const blogToDelete = blogsAtStart.body[0]
		const blogOwner = await User.findById(blogToDelete.user.id)
		const token = await authenticateUser(blogOwner)
		await api
			.delete(`/api/blogs/${blogToDelete.id}`)
			.set('Authorization', `bearer ${token}`)
			.expect(204)

		const blogsAtEnd = await api.get('/api/blogs')
		expect(blogsAtEnd.body).toHaveLength(blogs.length - 1)
		const titles = blogsAtEnd.body.map(b => b.title)
		expect(titles).not.toContain(blogToDelete.title)
	})

	test('fails with status code 400 if blog id is invalid', async () => {
		const id = await nonExistingId()
		const testUser = await User.findOne({})
		const token = await authenticateUser(testUser)
		await api
			.delete(`/api/blogs/${id}`)
			.set('Authorization', `bearer ${token}`)
			.expect(400)
		const blogsAtEnd = await api.get('/api/blogs')
		expect(blogsAtEnd.body).toHaveLength(blogs.length)
	})
})

describe('updating a blog', () => {
	test('succeeds with valid data', async () => {
		const blogsAtStart = await api.get('/api/blogs')
		const blogToUpdate = blogsAtStart.body[0]
		const blogOwner = await User.findById(blogToUpdate.user.id)
		const token = await authenticateUser(blogOwner)
		const blogWithChanges = { ...blogToUpdate, likes: 10 }
		await api
			.put(`/api/blogs/${blogToUpdate.id}`)
			.set('Authorization', `bearer ${token}`)
			.send(blogWithChanges)
			.expect(200)
			.expect('Content-Type', /application\/json/)
	})
	test('fails with status code 400 if given invalid data', async () => {
		const blogsAtStart = await api.get('/api/blogs')
		const blogToUpdate = blogsAtStart.body[0]
		const blogOwner = await User.findById(blogToUpdate.user.id)
		const token = await authenticateUser(blogOwner)
		const blogWithChanges = { ...blogToUpdate, likes: -10 }
		await api
			.put(`/api/blogs/${blogToUpdate.id}`)
			.set('Authorization', `bearer ${token}`)
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
