import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

// Import routes
import authRoutes from "./routes/auth.route.js"
import courseRoutes from "./routes/course.route.js"
import lessonRoutes from "./routes/lesson.route.js"
import quizRoutes from "./routes/quiz.route.js"
import enrollmentRoutes from "./routes/enrollment.route.js"
import progressRoutes from "./routes/progress.route.js"
import reviewRoutes from "./routes/review.route.js"
import reportingRoutes from "./routes/reporting.route.js"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({limit: "16kb", extended: true}))
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' })
})

export default app
