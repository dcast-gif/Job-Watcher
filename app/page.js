export default function HomePage() {
  return (
    <main className="container">
      <h1>Job Watcher</h1>

      <div className="card">
        <h2>Add Search Term</h2>

        <input
          type="text"
          placeholder="e.g. Management Accountant"
        />

        <button>Save Term</button>
      </div>

      <div className="card">
        <h2>Add Website</h2>

        <input
          type="text"
          placeholder="e.g. careers.umusic.com"
        />

        <button>Save Website</button>
      </div>

      <div className="card">
        <h2>Search</h2>

        <button>Run Search</button>
      </div>

      <div className="card">
        <h2>Latest Results</h2>

        <p>No results yet.</p>
      </div>
    </main>
  );
}