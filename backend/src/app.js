import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { errorHandler } from "./middleware/errorHandler.middleware.js"


import authRoutes from "./routes/auth.routes.js"
import courseRoutes from "./routes/course.routes.js"
import lessonRoutes from "./routes/lesson.routes.js"
import quizRoutes from "./routes/quiz.routes.js"
import enrollmentRoutes from "./routes/enrollment.routes.js"
import progressRoutes from "./routes/progress.routes.js"
import reviewRoutes from "./routes/review.routes.js"
import reportingRoutes from "./routes/reporting.routes.js"


const app = express()

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))

app.use(express.json({ limit: "16mb" }))
app.use(express.urlencoded({ limit: "16kb", extended: true }))
app.use(express.static("public"))
app.use(cookieParser())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/reporting', reportingRoutes)


app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' })
})

app.use(errorHandler)

export default app
