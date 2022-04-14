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

module.exports = {
	dummy, totalLikes, favouriteBlog
}