const listHelper = require('../utils/list_helper')
const { listWithOneBlog, blogs } = require('./dummy_data')

test('dummy returns one', () => {
	const blogs = []

	const result = listHelper.dummy(blogs)
	expect(result).toBe(1)
})

describe('total likes', () => {

	test('of empty list is zero', () => {
		const result = listHelper.totalLikes([])
		expect(result).toBe(0)
	})

	test('when list has only one blog, equals the likes of that', () => {
		const result = listHelper.totalLikes(listWithOneBlog)
		expect(result).toBe(5)
	})

	test('of a bigger list is calculated right', () => {
		const result = listHelper.totalLikes(blogs)
		expect(result).toBe(36)
	})

})

describe('favourite blog', () => {

	test('of empty list is undefined', () => {
		const result = listHelper.favouriteBlog([])
		expect(result).toBe(undefined)
	})

	test('when list has only one blog, returns that blog', () => {
		const result = listHelper.favouriteBlog(listWithOneBlog)
		expect(result).toEqual({
			title: 'Go To Statement Considered Harmful',
			author: 'Edsger W. Dijkstra',
			likes: 5
		})
	})

	test('of a bigger list is calculated right', () => {
		const result = listHelper.favouriteBlog(blogs)
		expect(result).toEqual({
			title: 'Canonical string reduction',
			author: 'Edsger W. Dijkstra',
			likes: 12
		})
	})

})

describe('most blogs', () => {

	test('of empty list is undefined', () => {
		const result = listHelper.mostBlogs([])
		expect(result).toBe(undefined)
	})

	test('when list has only one blog, return author of that blog having 1 blog', () => {
		const result = listHelper.mostBlogs(listWithOneBlog)
		expect(result).toEqual({
			author: 'Edsger W. Dijkstra',
			blogs: 1
		})
	})

	test('of a bigger list is calculated right', () => {
		const result = listHelper.mostBlogs(blogs)
		expect(result).toEqual({
			author: 'Robert C. Martin',
			blogs: 3
		})
	})
})

describe('most likes', () => {

	test('of empty list is undefined', () => {
		const result = listHelper.mostLikes([])
		expect(result).toBe(undefined)
	})

	test('when list has only one blog, return author of that blog having the correct number of likes', () => {
		const result = listHelper.mostLikes(listWithOneBlog)
		expect(result).toEqual({
			author: 'Edsger W. Dijkstra',
			likes: 5
		})
	})

	test('of a bigger list is calculated right', () => {
		const result = listHelper.mostLikes(blogs)
		expect(result).toEqual({
			author: 'Edsger W. Dijkstra',
			likes: 17
		})
	})
})