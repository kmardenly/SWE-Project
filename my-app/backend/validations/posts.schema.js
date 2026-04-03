const { z } = require('zod');

const mediaItemSchema = z.object({
    mediaUrl: z.string().trim().url('mediaUrl must be a valid URL'),
    mediaType: z
        .string()
        .trim()
        .toLowerCase()
        .refine((value) => ['image'].includes(value), {
            message: "mediaType must be 'image'",
        }),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    order: z.number().int().min(0).optional().default(0),
});

const createPostSchema = z.object({
    creatorId: z.string().trim().uuid('creatorId must be a valid UUID'),

    title: z
        .string()
        .trim()
        .min(1, 'title is required')
        .max(50, 'title must be 50 characters or less'),

    caption: z
        .string()
        .trim()
        .max(200, 'caption must be 200 characters or less')
        .optional()
        .default(''),

    craftType: z
        .string()
        .trim()
        .min(1, 'craftType is required')
        .max(30, 'craftType must be 30 characters or less'),

    tags: z
        .array(
            z.string().trim().min(1, 'tag cannot be empty').max(30, 'tag too long')
        )
        .max(10, 'no more than 10 tags')
        .optional()
        .default([]),

    //media: z.array(mediaItemSchema).max(5, 'no more than 5 media items').optional().default([]),
});

module.exports = {
    createPostSchema,
    mediaItemSchema,
};