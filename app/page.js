"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [activePage, setActivePage] = useState("home");
  const [storedTab, setStoredTab] = useState("terms");
  const [menuOpen, setMenuOpen] = useState(false);

  const [termInput, setTermInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const [terms, setTerms] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [locations, setLocations] = useState([]);
  const [results, setResults] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);

  const [isSearching, setIsSearching] = useState(false);
const [showDiagnostics, setShowDiagnostics] = useState(false);
  useEffect(() => {
    setTerms(JSON.parse(localStorage.getItem("jobWatcherTerms") || "[]"));
    setWebsites(JSON.parse(localStorage.getItem("jobWatcherWebsites") || "[]"));
    setLocations(JSON.parse(localStorage.getItem("jobWatcherLocations") || "[]"));
    setResults(JSON.parse(localStorage.getItem("jobWatcherResults") || "[]"));
    setAuditTrail(JSON.parse(localStorage.getItem("jobWatcherAuditTrail") || "[]"));
setDiagnostics(JSON.parse(localStorage.getItem("jobWatcherDiagnostics") || "[]"));
    }, []);

  function goToPage(page) {
    setActivePage(page);
    setMenuOpen(false);
  }

  function resetSearchState() {
    localStorage.removeItem("jobWatcherActiveResults");
    localStorage.removeItem("jobWatcherResults");
    setResults([]);
    alert("Search state reset. Next search will treat all matches as new.");
  }

  function saveTerm() {
    const cleanTerm = termInput.trim();
    if (!cleanTerm) return;
    if (terms.includes(cleanTerm)) return;

    const updatedTerms = [...terms, cleanTerm];
    setTerms(updatedTerms);
    localStorage.setItem("jobWatcherTerms", JSON.stringify(updatedTerms));
    setTermInput("");
  }

  function saveWebsite() {
    let cleanWebsite = websiteInput.trim();
    if (!cleanWebsite) return;

    cleanWebsite = cleanWebsite.replace(/^https?:\/\//, "");
    cleanWebsite = cleanWebsite.replace(/\/$/, "");

    if (websites.includes(cleanWebsite)) return;

    const updatedWebsites = [...websites, cleanWebsite];
    setWebsites(updatedWebsites);
    localStorage.setItem("jobWatcherWebsites", JSON.stringify(updatedWebsites));
    setWebsiteInput("");
  }

  function saveLocation() {
    const cleanLocation = locationInput.trim();
    if (!cleanLocation) return;
    if (locations.includes(cleanLocation)) return;

    const updatedLocations = [...locations, cleanLocation];
    setLocations(updatedLocations);
    localStorage.setItem("jobWatcherLocations", JSON.stringify(updatedLocations));
    setLocationInput("");
  }

  function deleteTerm(termToDelete) {
    const updatedTerms = terms.filter((term) => term !== termToDelete);
    setTerms(updatedTerms);
    localStorage.setItem("jobWatcherTerms", JSON.stringify(updatedTerms));
  }

  function deleteWebsite(websiteToDelete) {
    const updatedWebsites = websites.filter(
      (website) => website !== websiteToDelete
    );
    setWebsites(updatedWebsites);
    localStorage.setItem("jobWatcherWebsites", JSON.stringify(updatedWebsites));
  }

  function deleteLocation(locationToDelete) {
    const updatedLocations = locations.filter(
      (location) => location !== locationToDelete
    );
    setLocations(updatedLocations);
    localStorage.setItem("jobWatcherLocations", JSON.stringify(updatedLocations));
  }

  async function runSearch() {
    if (terms.length === 0 || websites.length === 0) return;

    setIsSearching(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          terms,
          websites,
          locations
        })
      });

      const data = await response.json();
      console.log("JOB WATCHER DEBUG", data.debug);
      const debugInfo = data.debug || [];
      if (debugInfo.length > 0) {
  alert(debugInfo[0].possibleUrls.join("\n"));
}
setDiagnostics(debugInfo);
localStorage.setItem("jobWatcherDiagnostics", JSON.stringify(debugInfo));
      const foundResults = data.results || [];

      const previousActiveResults = JSON.parse(
        localStorage.getItem("jobWatcherActiveResults") || "[]"
      );

      const previousActiveKeys = previousActiveResults.map(
        (result) => `${result.term}|${result.website}|${result.url}`
      );

      const newResults = foundResults.filter((result) => {
        const key = `${result.term}|${result.website}|${result.url}`;
        return !previousActiveKeys.includes(key);
      });

      setResults(newResults);
      localStorage.setItem("jobWatcherResults", JSON.stringify(newResults));

      const updatedAuditTrail = [...newResults, ...auditTrail];
      setAuditTrail(updatedAuditTrail);
      localStorage.setItem(
        "jobWatcherAuditTrail",
        JSON.stringify(updatedAuditTrail)
      );

      localStorage.setItem(
        "jobWatcherActiveResults",
        JSON.stringify(foundResults)
      );
    } catch (error) {
      console.error(error);
      alert("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main className="container">
      <header className="topBar">
        <button className="menuButton" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        <h1>Job Watcher</h1>
      </header>

      {menuOpen && (
        <nav className="sideMenu">
          <button onClick={() => goToPage("home")}>Home</button>
          <button onClick={() => goToPage("stored")}>Stored Info</button>
          <button onClick={() => goToPage("audit")}>Audit Trail</button>
        </nav>
      )}

      {activePage === "home" && (
        <>
          <section className="card">
            <h2>Search</h2>
            <p>
              Search all saved terms across all saved websites. If location
              filters are saved, results must also match at least one location.
            </p>

            <button onClick={runSearch} disabled={isSearching}>
              {isSearching ? "Searching..." : "Run Search"}
            </button>

            <button onClick={resetSearchState} style={{ marginTop: "10px" }}>
              Reset Search State
            </button>
            <button
  onClick={() => setShowDiagnostics(!showDiagnostics)}
  style={{ marginTop: "10px" }}
>
  {showDiagnostics ? "Hide Diagnostics" : "Show Diagnostics"}
</button>
          </section>

          <section className="card">
            <h2>Latest Results ({results.length})</h2>
            {results.length === 0 ? (
              <p>No new successful matches from the latest search.</p>
            ) : (
              <ResultsTable results={results} />
            )}
          </section>
        {showDiagnostics && (
<section className="card">
  <h2>Search Diagnostics</h2>

  {diagnostics.length === 0 ? (
    <p>No diagnostics yet. Run a search first.</p>
  ) : (
    <div className="list">
      {diagnostics.map((item, index) => (
        <div className="listItem" key={`${item.website}-${index}`}>
          <span>
            <strong>{item.website}</strong>
            <br />
Platform: {item.platform || "Unknown"}
            <br />
            Page links: {item.pageLinks}
            <br />
            Sitemap links: {item.sitemapLinks}
            <br />
            Checked: {item.totalCandidateLinks}
            <br />
Findings: {item.findings && item.findings.length > 0 ? item.findings.join(", ") : "None"}
<br />
Possible URLs:
<br />
{item.possibleUrls && item.possibleUrls.length > 0 ? (
  item.possibleUrls.map((url) => (
    <span key={url}>
      {url}
      <br />
    </span>
  ))
) : (
  <span>None</span>
)}
<br />
<br />
Probe Preview:
<br />
{item.harmonicPreview || "None"}
          </span>
        </div>
      ))}
    </div>
  )}
</section>
)}
        </>
      )}

      {activePage === "stored" && (
        <>
          <section className="card">
            <h2>Stored Info</h2>

            <div className="tabBar">
              <button onClick={() => setStoredTab("terms")}>
                Terms ({terms.length})
              </button>
              <button onClick={() => setStoredTab("websites")}>
                Websites ({websites.length})
              </button>
              <button onClick={() => setStoredTab("locations")}>
                Locations ({locations.length})
              </button>
            </div>
          </section>

          {storedTab === "terms" && (
            <StoredList
              title="Search Terms"
              inputValue={termInput}
              onInputChange={setTermInput}
              placeholder="e.g. Management Accountant"
              saveLabel="Save Term"
              onSave={saveTerm}
              items={terms}
              onDelete={deleteTerm}
              emptyMessage="No terms saved yet."
            />
          )}

          {storedTab === "websites" && (
            <StoredList
              title="Websites"
              inputValue={websiteInput}
              onInputChange={setWebsiteInput}
              placeholder="e.g. careers.umusic.com"
              saveLabel="Save Website"
              onSave={saveWebsite}
              items={websites}
              onDelete={deleteWebsite}
              emptyMessage="No websites saved yet."
            />
          )}

          {storedTab === "locations" && (
            <StoredList
              title="Location Filters"
              inputValue={locationInput}
              onInputChange={setLocationInput}
              placeholder="e.g. London"
              saveLabel="Save Location"
              onSave={saveLocation}
              items={locations}
              onDelete={deleteLocation}
              emptyMessage="No location filters saved yet."
            />
          )}
        </>
      )}

      {activePage === "audit" && (
        <section className="card">
          <h2>Audit Trail ({auditTrail.length})</h2>
          {auditTrail.length === 0 ? (
            <p>No successful matches yet.</p>
          ) : (
            <ResultsTable results={auditTrail} />
          )}
        </section>
      )}
    </main>
  );
}

function StoredList({
  title,
  inputValue,
  onInputChange,
  placeholder,
  saveLabel,
  onSave,
  items,
  onDelete,
  emptyMessage
}) {
  return (
    <section className="card">
      <h2>{title}</h2>

      <input
        type="text"
        value={inputValue}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder={placeholder}
      />

      <button onClick={onSave}>{saveLabel}</button>

      <div style={{ marginTop: "18px" }}>
        {items.length === 0 ? (
          <p>{emptyMessage}</p>
        ) : (
          <div className="list">
            {items.map((item) => (
              <div className="listItem" key={item}>
                <span>{item}</span>
                <button className="smallButton" onClick={() => onDelete(item)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ResultsTable({ results }) {
  return (
    <div className="tableWrapper">
      <table>
        <thead>
          <tr>
            <th>Term</th>
            <th>Website</th>
            <th>Result</th>
            <th>Date Found</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={`${result.term}-${result.url}-${index}`}>
              <td>{result.term}</td>
              <td>{result.website}</td>
              <td>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {result.title}
                </a>
              </td>
              <td>{new Date(result.foundAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}