const jwt = require('jsonwebtoken')
const logger = require('./logger')
const config = require('./config')
const User = require('../models/user')

const unknownEndpoint = (req, res) => {
	res.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (err, req, res, next) => {
	logger.error(err.message)

	if (err.name === 'CastError') {
		return res.status(400).send({ error: 'Malformatted id' })
	} else if (err.name === 'ValidationError') {
		return res.status(400).json({ error: err.message })
	} else if (err.name === 'JsonWebTokenError') {
		return res.status(401).json({
			error: 'invalid token'
		})
	} else if (err.name === 'TokenExpiredError') {
		return res.status(401).json({
			error: 'token expired'
		})
	}

	next(err)
}

const tokenExtractor = (req, res, next) => {
	const authorization = req.get('authorization')
	if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
		req.token = authorization.substring(7)
	}
	next()
}

const userExtractor = async (req, res, next) => {
	try {
		const decodedToken = jwt.verify(req.token, config.SECRET)
		if (!decodedToken.id) {
			return res.status(401).json({ error: 'token missing or invalid' })
		}
		const user = await User.findById(decodedToken.id)
		req.user = user
		next()
	} catch (err) {
		if (err.name === 'JsonWebTokenError') {
			return res.status(401).json({
				error: 'invalid token'
			})
		} else if (err.name === 'TokenExpiredError') {
			return res.status(401).json({
				error: 'token expired'
			})
		}
	}
}

module.exports = {
	unknownEndpoint,
	errorHandler,
	tokenExtractor,
	userExtractor
}