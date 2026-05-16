import styles from "./page.module.css";

function IconButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button type="button" className={styles.iconButton} aria-label={label} title={label}>
      {icon}
    </button>
  );
}

function CircleAvatar({ label }: { label: string }) {
  return <span className={styles.circleAvatar} aria-hidden="true">{label}</span>;
}

export default function CalendarPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>AI Calendar</h1>
      </header>

      <section className={styles.profileRow}>
        <div className={styles.profileLeft}>
          <div className={styles.brandAvatar}>G</div>
          <div>
            <h2>Geex Arts</h2>
            <p>Available for work · Follow</p>
          </div>
        </div>
        <div className={styles.profileActions}>
          <IconButton label="Favorite" icon="♡" />
          <IconButton label="Bookmark" icon="⌂" />
          <IconButton label="Calendar" icon="◷" />
          <button type="button" className={styles.primaryAction}>Get in touch</button>
        </div>
      </section>

      <div className={styles.profileMeta}>
        <span>geex-arts.com</span>
        <span>hello@geex-arts.com</span>
      </div>

      <section className={styles.board}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>Calendar</div>
          <div className={styles.monthGrid}>
            {[...Array(35)].map((_, idx) => (
              <span key={idx} className={idx === 9 ? styles.activeDay : styles.dayCell}>
                {idx < 2 ? "" : idx - 1}
              </span>
            ))}
          </div>
          <div className={styles.taskList}>
            <h3>Tasks</h3>
            <p>Buy Sunlite</p>
            <p>Get radi</p>
            <p>Go to mouvi</p>
          </div>
        </aside>

        <section className={styles.calendarPane}>
          <div className={styles.calendarTop}>
            <h3>May 2025</h3>
            <button type="button" className={styles.share}>Share</button>
          </div>

          <article className={styles.dayBlock}>
            <div className={styles.dayNumber}>03</div>
            <div className={styles.dayEvents}>
              <div className={styles.eventRow}>
                <time>10:00</time>
                <div>
                  <h4>Learn Design</h4>
                  <p>Design meeting check product</p>
                </div>
                <div className={styles.attendees}>
                  <CircleAvatar label="A" />
                  <CircleAvatar label="B" />
                  <CircleAvatar label="C" />
                </div>
              </div>
              <div className={styles.eventRow}>
                <time>13:30</time>
                <div>
                  <h4>Working</h4>
                  <p>Design meeting check product</p>
                </div>
                <div className={styles.attendees}>
                  <CircleAvatar label="D" />
                </div>
              </div>
              <div className={styles.eventRow}>
                <time>17:30</time>
                <div>
                  <h4>Coffe time</h4>
                  <p>Google Meet</p>
                </div>
              </div>
            </div>
          </article>

          <article className={styles.dayBlock}>
            <div className={styles.dayNumber}>04</div>
            <div className={styles.dayEvents}>
              <div className={styles.eventRow}>
                <time>18:30</time>
                <div>
                  <h4>Read Book</h4>
                  <p>Design meeting check product</p>
                </div>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

