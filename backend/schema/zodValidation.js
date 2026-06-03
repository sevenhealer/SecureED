const z = require('zod')

const creatorSchema = z.object({
    username: z.string().min(6),
    password: z.string().min(8),
    name: z.string().min(1, "Name is required")
})