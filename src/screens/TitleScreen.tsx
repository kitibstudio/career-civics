import { motion } from 'framer-motion'

export function TitleScreen({
  hasSave,
  onStart,
  onContinue,
}: {
  hasSave: boolean
  onStart: () => void
  onContinue: () => void
}) {
  return (
    <section className="screen hero-title">
      <motion.div
        className="hero-copy"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow">MEP Career Strategy</p>
        <h1 className="h1 brand-mark">Career Civics</h1>
        <p className="lede">
          Build a building-design career the way Civ builds a civilisation — one month per turn,
          Habits and Specialisms in shared slots, and promotion earned by breadth, not years.
        </p>
        <div className="cta-row">
          <button className="btn btn-primary" onClick={onStart}>
            New career
          </button>
          {hasSave && (
            <button className="btn btn-ghost" onClick={onContinue}>
              Continue
            </button>
          )}
        </div>
        <p className="footer-note">Sample consultancy · no sign-in · progress saves in this browser</p>
      </motion.div>
    </section>
  )
}
