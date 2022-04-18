const Blog = require('../models/blog')

const nonExistingId = async () => {
	const blog = new Blog({ title: 'Will remove', author: 'Joe mama', url: 'republiquedesmangues.fr' })
	await blog.save()
	await blog.remove()
	return blog._id.toString()
}

module.exports = { nonExistingId }