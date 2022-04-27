const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const config = require('../utils/config')
const logger = require('../utils/logger')
const { asyncForEach } = require('../utils/helper_functions')
const Blog = require('../models/blog')
const User = require('../models/user')

const { initialUsers } = require('./initial_users')
const { initialBlogs } = require('./initial_blogs')

const seedDb = async () => {
	logger.info('Seeding db')
	await Blog.deleteMany({})
	await User.deleteMany({})
	logger.info('Deleted all blogs and users')
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
	logger.info(`Added ${initialUsers.length} users to the db`)
	const allUsers = await User.find({})
	await asyncForEach(initialBlogs, async b => {
		const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)]
		b.user = randomUser._id
		const newBlog = new Blog(b)
		const savedBlog = await newBlog.save()
		randomUser.blogs = randomUser.blogs.concat(savedBlog._id)
		await randomUser.save()
	})
	logger.info(`Added ${initialBlogs.length} blogs to the db`)
	mongoose.connection.close()
}

mongoose.connect(config.MONGODB_URI)
	.then(() => {
		logger.info('connected to MongoDB')
		seedDb()
	})
	.catch((error) => {
		logger.error('error connecting to MongoDB:', error.message)
	})

module.exports = asyncForEach
