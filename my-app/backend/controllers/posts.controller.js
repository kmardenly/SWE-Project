const { createPostSchema } = require('../validations/posts.schema');
const { createPostService } = require('../services/posts.service');

async function createPost(req, res) {
    try {
        const validatedData = createPostSchema.parse(req.body);
        const result = await createPostService(validatedData);

        return res.status(201).json(result);
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.errors,
            });
        }

        console.error(error);
        return res.status(500).json({ message: 'Failed to create post' });
    }
}

module.exports = { createPost };