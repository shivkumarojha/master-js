import type { LessonDefinition, LessonId } from '../simulator/types'
import { motion } from 'framer-motion'

type LessonPickerProps = {
  lessons: LessonDefinition[]
  activeLessonId: LessonId
  onSelectLesson: (lessonId: LessonId) => void
}

export function LessonPicker({
  lessons,
  activeLessonId,
  onSelectLesson,
}: LessonPickerProps) {
  return (
    <section className="lesson-strip">
      {lessons.map((lesson) => {
        const isActive = lesson.id === activeLessonId
        return (
          <motion.button
            layout
            key={lesson.id}
            type="button"
            className={`lesson-chip ${isActive ? 'active' : ''}`}
            onClick={() => onSelectLesson(lesson.id)}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
          >
            <span>{lesson.title}</span>
            <small>{lesson.concepts.join(' - ')}</small>
          </motion.button>
        )
      })}
    </section>
  )
}
