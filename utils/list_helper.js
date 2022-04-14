const dummy = (blogs) => {
	if (blogs) {
		return 1
	}
	return 1
}

const totalLikes = blogs => {
	return blogs.map(b => b.likes).reduce((a, b) => a + b, 0)
}

const favouriteBlog = blogs => {
	if (blogs.length === 0) return
	const mostLikes = Math.max(...blogs.map(b => b.likes))
	const favourite = blogs.filter(b => b.likes === mostLikes)[0]
	return {
		title: favourite.title,
		author: favourite.author,
		likes: favourite.likes
	}
}

const countBlogs = (blogs, author) => {
	return blogs.filter(blog => blog.author === author).length
}

const mostBlogs = blogs => {
	if (blogs.length === 0) return
	const blogsPerAuthor = blogs.map(b => b.author).map(author => {
		return {
			'author': author,
			'blogs': countBlogs(blogs, author)
		}
	})
	return blogsPerAuthor.reduce((prev, current) => current.blogs > prev.blogs ? current : prev)
}

const countLikes = (blogs, author) => {
	return blogs
		.filter(blog => blog.author === author)
		.map(blog => blog.likes)
		.reduce((a, b) => a + b)
}

const mostLikes = blogs => {
	if (blogs.length === 0) return
	const likesPerAuthor = blogs.map(b => b.author).map(author => {
		return {
			'author': author,
			'likes': countLikes(blogs, author)
		}
	})
	return likesPerAuthor.reduce((prev, current) => current.likes > prev.likes ? current : prev)
}

module.exports = {
	dummy, totalLikes, favouriteBlog, mostBlogs, mostLikes
}