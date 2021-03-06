const Blog = require('../models/blog')
const User = require('../models/user')

const nonExistingId = async () => {
	const blog = new Blog({ title: 'Will remove', author: 'Joe mama', url: 'republiquedesmangues.fr' })
	await blog.save()
	await blog.remove()
	return blog._id.toString()
}

const usersInDb = async () => {
	const users = await User.find({})
	return users.map(u => u.toJSON())
}

module.exports = { nonExistingId, usersInDb }