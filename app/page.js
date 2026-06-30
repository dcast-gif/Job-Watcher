"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [activePage, setActivePage] = useState("home");
  const [storedTab, setStoredTab] = useState("terms");
  const [menuOpen, setMenuOpen] = useState(false);

  const [termInput, setTermInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [websiteNicknameInput, setWebsiteNicknameInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const [terms, setTerms] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [disabledWebsites, setDisabledWebsites] = useState([]);
  const [locations, setLocations] = useState([]);
  const [results, setResults] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);

  const [isSearching, setIsSearching] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [openDiagnostics, setOpenDiagnostics] = useState({});
  const [latestResultsOpen, setLatestResultsOpen] = useState(true);
const [statsOpen, setStatsOpen] = useState(true);
const [latestSheetOpen, setLatestSheetOpen] = useState(false);
  useEffect(() => {
    setTerms(
      JSON.parse(localStorage.getItem("jobWatcherTerms") || "[]").sort((a, b) =>
        a.localeCompare(b)
      )
    );

    setWebsites(
      JSON.parse(localStorage.getItem("jobWatcherWebsites") || "[]").sort(
        (a, b) => getWebsiteDisplayName(a).localeCompare(getWebsiteDisplayName(b))
      )
    );

    setDisabledWebsites(
      JSON.parse(localStorage.getItem("jobWatcherDisabledWebsites") || "[]")
    );

    setLocations(
      JSON.parse(localStorage.getItem("jobWatcherLocations") || "[]").sort(
        (a, b) => a.localeCompare(b)
      )
    );

    setResults(JSON.parse(localStorage.getItem("jobWatcherResults") || "[]"));
    setSavedJobs(JSON.parse(localStorage.getItem("jobWatcherSavedJobs") || "[]"));
    setAppliedJobs(JSON.parse(localStorage.getItem("jobWatcherAppliedJobs") || "[]"));
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

  function clearAuditTrail() {
    localStorage.removeItem("jobWatcherAuditTrail");
    setAuditTrail([]);
  }

  function toggleSavedJob(job) {
    const alreadySaved = savedJobs.some((savedJob) => savedJob.url === job.url);

    const updatedSavedJobs = alreadySaved
      ? savedJobs.filter((savedJob) => savedJob.url !== job.url)
      : [job, ...savedJobs];

    setSavedJobs(updatedSavedJobs);
    localStorage.setItem("jobWatcherSavedJobs", JSON.stringify(updatedSavedJobs));
  }

  function applyForJob(job) {
    const alreadyApplied = appliedJobs.some((appliedJob) => appliedJob.url === job.url);

    if (alreadyApplied) {
  alert("This job is already in Applied Jobs.");
  return;
}

const comments = window.prompt("Application Notes", "");
    if (comments === null) return;

    const appliedJob = {
      ...job,
      additionalComments: comments.trim(),
      appliedAt: new Date().toISOString(),
      status: "Applied"
    };

    const updatedAppliedJobs = [appliedJob, ...appliedJobs];
    const updatedSavedJobs = savedJobs.filter((savedJob) => savedJob.url !== job.url);
    const updatedResults = results.filter((result) => result.url !== job.url);

    setAppliedJobs(updatedAppliedJobs);
    setSavedJobs(updatedSavedJobs);
    setResults(updatedResults);

    localStorage.setItem("jobWatcherAppliedJobs", JSON.stringify(updatedAppliedJobs));
    localStorage.setItem("jobWatcherSavedJobs", JSON.stringify(updatedSavedJobs));
    localStorage.setItem("jobWatcherResults", JSON.stringify(updatedResults));
  }

  function updateAppliedStatus(job, newStatus) {
    const updatedAppliedJobs = appliedJobs.map((appliedJob) =>
      appliedJob.url === job.url ? { ...appliedJob, status: newStatus } : appliedJob
    );

    setAppliedJobs(updatedAppliedJobs);
    localStorage.setItem("jobWatcherAppliedJobs", JSON.stringify(updatedAppliedJobs));
  }
  function updateAppliedComments(job) {
  const comments = window.prompt(
    "Edit Application Notes",
    job.additionalComments || ""
  );

  if (comments === null) return;

  const updatedAppliedJobs = appliedJobs.map((appliedJob) =>
    appliedJob.url === job.url
      ? { ...appliedJob, additionalComments: comments.trim() }
      : appliedJob
  );

  setAppliedJobs(updatedAppliedJobs);
  localStorage.setItem("jobWatcherAppliedJobs", JSON.stringify(updatedAppliedJobs));
}
function moveAppliedJobToSaved(job) {
  const updatedAppliedJobs = appliedJobs.filter(
    (appliedJob) => appliedJob.url !== job.url
  );

  const jobToSave = {
    ...job
  };

  delete jobToSave.additionalComments;
  delete jobToSave.appliedAt;
  delete jobToSave.status;

  const alreadySaved = savedJobs.some((savedJob) => savedJob.url === job.url);

  const updatedSavedJobs = alreadySaved
    ? savedJobs
    : [jobToSave, ...savedJobs];

  setAppliedJobs(updatedAppliedJobs);
  setSavedJobs(updatedSavedJobs);

  localStorage.setItem("jobWatcherAppliedJobs", JSON.stringify(updatedAppliedJobs));
  localStorage.setItem("jobWatcherSavedJobs", JSON.stringify(updatedSavedJobs));
}

function deleteAppliedJob(job) {
  const updatedAppliedJobs = appliedJobs.filter(
    (appliedJob) => appliedJob.url !== job.url
  );

  setAppliedJobs(updatedAppliedJobs);
  localStorage.setItem("jobWatcherAppliedJobs", JSON.stringify(updatedAppliedJobs));
}
  function exportJobs(jobs, filename) {
    if (jobs.length === 0) {
      alert("No jobs to export.");
      return;
    }

    const headers = [
      "Title",
      "Company",
      "Salary",
      "Job Title",
      "Status",
      "Found",
      "Applied",
      "Application Notes",
      "URL"
    ];

    const rows = jobs.map((job) => [
      job.title || "",
      getWebsiteDisplayName(job.website || ""),
      job.salary || "",
      job.term || "",
      job.status || "",
      job.foundAt || "",
      job.appliedAt || "",
      job.additionalComments || "",
      job.url || ""
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }
function exportStoredInfo() {
  const websiteNames = JSON.parse(
    localStorage.getItem("jobWatcherWebsiteNames") || "{}"
  );

  const data = {
    jobTitles: terms,
    websites,
    websiteNames,
    disabledWebsites,
    locations,
    exportedAt: new Date().toISOString()
  };

  const text = [
    "JOB TITLES",
    ...terms,
    "",
    "WEBSITES",
    ...websites.map((website) => `${getWebsiteDisplayName(website)} - ${website}`),
    "",
    "LOCATIONS",
    ...locations
  ].join("\n");

  const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "job-watcher-stored-info.txt";
  link.click();

  URL.revokeObjectURL(url);
}
  function saveTerm() {
    const cleanTerm = termInput.trim();
    if (!cleanTerm || terms.includes(cleanTerm)) return;

    const updatedTerms = [...terms, cleanTerm].sort((a, b) => a.localeCompare(b));
    setTerms(updatedTerms);
    localStorage.setItem("jobWatcherTerms", JSON.stringify(updatedTerms));
    setTermInput("");
  }

  function saveWebsite() {
    let cleanWebsite = websiteInput.trim();
    const nickname = websiteNicknameInput.trim();

    if (!cleanWebsite) return;

    cleanWebsite = cleanWebsite.replace(/^https?:\/\//, "").replace(/\/$/, "");

    if (websites.includes(cleanWebsite)) return;

    const updatedWebsites = [...websites, cleanWebsite].sort((a, b) =>
      getWebsiteDisplayName(a).localeCompare(getWebsiteDisplayName(b))
    );

    setWebsites(updatedWebsites);
    localStorage.setItem("jobWatcherWebsites", JSON.stringify(updatedWebsites));

    const websiteNames = JSON.parse(
      localStorage.getItem("jobWatcherWebsiteNames") || "{}"
    );

    websiteNames[cleanWebsite] = nickname || getWebsiteDisplayName(cleanWebsite);
    localStorage.setItem("jobWatcherWebsiteNames", JSON.stringify(websiteNames));

    setWebsiteInput("");
    setWebsiteNicknameInput("");
  }

  function saveLocation() {
    const cleanLocation = locationInput.trim();
    if (!cleanLocation || locations.includes(cleanLocation)) return;

    const updatedLocations = [...locations, cleanLocation].sort((a, b) =>
      a.localeCompare(b)
    );

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
    const updatedWebsites = websites.filter((website) => website !== websiteToDelete);
    setWebsites(updatedWebsites);
    localStorage.setItem("jobWatcherWebsites", JSON.stringify(updatedWebsites));

    const websiteNames = JSON.parse(
      localStorage.getItem("jobWatcherWebsiteNames") || "{}"
    );
    delete websiteNames[websiteToDelete];
    localStorage.setItem("jobWatcherWebsiteNames", JSON.stringify(websiteNames));

    const updatedDisabledWebsites = disabledWebsites.filter(
      (website) => website !== websiteToDelete
    );
    setDisabledWebsites(updatedDisabledWebsites);
    localStorage.setItem(
      "jobWatcherDisabledWebsites",
      JSON.stringify(updatedDisabledWebsites)
    );
  }

  function toggleWebsiteDisabled(website) {
    const updatedDisabledWebsites = disabledWebsites.includes(website)
      ? disabledWebsites.filter((item) => item !== website)
      : [...disabledWebsites, website];

    setDisabledWebsites(updatedDisabledWebsites);
    localStorage.setItem(
      "jobWatcherDisabledWebsites",
      JSON.stringify(updatedDisabledWebsites)
    );
  }

  function deleteLocation(locationToDelete) {
    const updatedLocations = locations.filter(
      (location) => location !== locationToDelete
    );
    setLocations(updatedLocations);
    localStorage.setItem("jobWatcherLocations", JSON.stringify(updatedLocations));
  }

  async function runSearch() {
    const enabledWebsites = websites.filter(
      (website) => !disabledWebsites.includes(website)
    );

    if (terms.length === 0 || enabledWebsites.length === 0) return;

    setIsSearching(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms, websites: enabledWebsites, locations })
      });

      const data = await response.json();

      const debugInfo = data.debug || [];
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
      localStorage.setItem("jobWatcherAuditTrail", JSON.stringify(updatedAuditTrail));

      localStorage.setItem("jobWatcherActiveResults", JSON.stringify(foundResults));
    } catch (error) {
      console.error(error);
      alert("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  const interviewCount = appliedJobs.filter((job) => job.status === "Interview").length;
  const finalStageCount = appliedJobs.filter((job) => job.status === "Final Stage").length;
  const rejectedCount = appliedJobs.filter((job) => job.status === "Rejected").length;
  const offerCount = appliedJobs.filter((job) => job.status === "Offer").length;
const appliedCount = appliedJobs.filter((job) => job.status === "Applied").length;
const activeReviewCount = savedJobs.length + results.length;
  return (
    <main className="container">
      <header className="topBar">
        <button className="menuButton" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
        <h1>Job Dashboard</h1>
      </header>

   <>
  <div
    className={`menuOverlay ${menuOpen ? "menuOverlayOpen" : ""}`}
    onClick={() => setMenuOpen(false)}
  />

  <nav className={`sideDrawer ${menuOpen ? "sideDrawerOpen" : ""}`}>
    <div className="drawerHeader">
      <h2>Job Dashboard</h2>
      <p>Your job search hub</p>
    </div>

 <button onClick={() => goToPage("home")}>Home</button>
<button
  className={activePage === "stored" ? "bottomNavActive" : ""}
  onClick={() => goToPage("stored")}
>Stored Info</button>
<button
  className={activePage === "saved" ? "bottomNavActive" : ""}
  onClick={() => goToPage("saved")}
>Saved Jobs</button>
<button
  className={activePage === "applied" ? "bottomNavActive" : ""}
  onClick={() => goToPage("applied")}
>Applied Jobs</button>
<button onClick={() => goToPage("audit")}>Audit Trail</button>

<button onClick={resetSearchState}>Reset Search State</button>

<button onClick={() => setShowDiagnostics(!showDiagnostics)}>
  {showDiagnostics ? "Hide Diagnostics" : "Show Diagnostics"}
</button>
  </nav>
</>

      {activePage === "home" && (
        <>
           <section className="dashboardHero">
  <div className="heroTop">
    <div>
      <h2>Good afternoon, Dylan 👋</h2>
      <p>Here’s your job search overview</p>
    </div>

    <div className="avatarCircle">DW</div>
  </div>

  <div className="heroStats">
    <div>
  <span className="heroIcon">
  <Icon name="briefcase" />
</span>
      <strong>{savedJobs.length}</strong>
      <p>Saved jobs</p>
      <small>{activeReviewCount} need review</small>
    </div>

    <div>
    <span className="heroIcon">
  <Icon name="calendar" />
</span>
      <strong>{interviewCount}</strong>
      <p>Interviews</p>
      <small>{interviewCount > 0 ? "Keep it up!" : "Keep applying"}</small>
    </div>

    <div>
    <span className="heroIcon">
  <Icon name="chart" />
</span>
      <strong>{appliedJobs.length}</strong>
      <p>Applications</p>
      <small>This month</small>
    </div>
  </div>

  <div className="heroMessage">
    <span>⭐</span>
    <div>
      <strong>Keep applying — you’re doing great.</strong>
      <p>Consistency is the key to landing the right role.</p>
    </div>
  </div>
</section>
       <section className="searchActionCard">
  <div className="searchActionLeft">
    <div className="searchIconCircle">⌕</div>

    <div>
      <h2>Run Search</h2>
      <p>
        {terms.length} job titles • {locations.length} locations •{" "}
        {websites.filter((website) => !disabledWebsites.includes(website)).length} websites
      </p>
    </div>
  </div>

  <button className="searchNowButton" onClick={runSearch} disabled={isSearching}>
    {isSearching ? "Searching..." : "Search Now →"}
  </button>


</section>
<section className="progressCard">
  <div className="progressHeader">
    <h2>Application Progress</h2>
    <span>This month</span>
  </div>

  <div className="progressSteps">
    <div>
      <div className="progressIcon">☆</div>
      <strong>{savedJobs.length}</strong>
      <span>Saved</span>
    </div>

    <div>
      <div className="progressIcon">➤</div>
      <strong>{appliedJobs.length}</strong>
      <span>Applied</span>
    </div>

    <div>
      <div className="progressIcon">♙</div>
      <strong>{interviewCount}</strong>
      <span>Interview</span>
    </div>

    <div>
      <div className="progressIcon">⚑</div>
      <strong>{finalStageCount}</strong>
      <span>Final Stage</span>
    </div>

    <div>
      <div className="progressIcon">♕</div>
      <strong>{offerCount}</strong>
      <span>Offers</span>
    </div>
  </div>
</section>
  <section className="latestMatchesCard">
  <div className="latestMatchesHeader">
    <h2>Latest Job Matches</h2>
 <button onClick={() => setLatestSheetOpen(true)}>
  View all
</button>
  </div>

  {results.length === 0 ? (
    <p>No new successful matches from the latest search.</p>
  ) : (
    <div className="latestMatchesList">
      {results.slice(0, 3).map((job, index) => (
        <div className="latestMatchItem" key={`${job.url}-${index}`}>
          <div className="companyLogoBox">
            {getWebsiteDisplayName(job.website).slice(0, 2).toLowerCase()}
          </div>

          <div className="latestMatchInfo">
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              {job.title}
            </a>
            <span>{getWebsiteDisplayName(job.website)}</span>
            {job.salary && <small>{job.salary}</small>}
          </div>

        <div className="latestMatchActions">
  <button
    className="latestSaveButton"
    onClick={() => toggleSavedJob(job)}
  >
    {savedJobs.some((savedJob) => savedJob.url === job.url) ? "★" : "☆"}
  </button>

  <span>{timeAgo(job.foundAt)}</span>

  <button onClick={() => applyForJob(job)}>
    {appliedJobs.some((appliedJob) => appliedJob.url === job.url)
      ? "Applied"
      : "Apply"}
  </button>
</div>
        </div>
      ))}
    </div>
  )}
</section>
{latestSheetOpen && (
  <>
    <div
      className="sheetBackdrop"
      onClick={() => setLatestSheetOpen(false)}
    />

    <section className="bottomSheet">
     <div
  className="sheetHandle"
  onClick={() => setLatestSheetOpen(false)}
/>

      <div className="sheetHeader">
        <h2>Latest Job Matches</h2>
        <button onClick={() => setLatestSheetOpen(false)}>Close</button>
      </div>

      <div className="latestMatchesList">
        {results.map((job, index) => (
          <div className="latestMatchItem" key={`${job.url}-${index}`}>
            <div className="companyLogoBox">
              {getWebsiteDisplayName(job.website).slice(0, 2).toLowerCase()}
            </div>

            <div className="latestMatchInfo">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                {job.title}
              </a>
              <span>{getWebsiteDisplayName(job.website)}</span>
              {job.salary && <small>{job.salary}</small>}
            </div>

            <div className="latestMatchActions">
              <button
                className="latestSaveButton"
                onClick={() => toggleSavedJob(job)}
              >
                {savedJobs.some((savedJob) => savedJob.url === job.url) ? "★" : "☆"}
              </button>

              <span>{timeAgo(job.foundAt)}</span>

              <button onClick={() => applyForJob(job)}>
                {appliedJobs.some((appliedJob) => appliedJob.url === job.url)
                  ? "Applied"
                  : "Apply"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  </>
)}
          {showDiagnostics && (
            <section className="card">
              <h2>Search Diagnostics</h2>

              {diagnostics.length === 0 ? (
                <p>No diagnostics yet. Run a search first.</p>
              ) : (
                <div className="list">
                  {diagnostics.map((item, index) => (
                 <div
  className="listItem"
  key={`${item.website}-${index}`}
>
<h3
  onClick={() =>
    setOpenDiagnostics((prev) => ({
      ...prev,
      [item.website]: !prev[item.website]
    }))
  }
  style={{
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: openDiagnostics[item.website] ? "16px" : "0"
  }}
>
  <span>{getWebsiteDisplayName(item.website)}</span>

  <span className="toggleBox">
    {openDiagnostics[item.website] ? "⌃" : "⌄"}
  </span>
</h3>

  {openDiagnostics[item.website] && (
                      <span>
                        
                        Platform: {item.platform || "Unknown"}
                        <br />
                        Page links: {item.pageLinks}
                        <br />
                        Sitemap links: {item.sitemapLinks}
                        <br />
                        Greenhouse links: {item.greenhouseLinks || 0}
                        <br />
                        Checked: {item.totalCandidateLinks}
                        <br />
                        Findings:{" "}
                        {item.findings && item.findings.length > 0
                          ? item.findings.join(", ")
                          : "None"}
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
Checked URLs:
<br />
{item.checkedUrls && item.checkedUrls.length > 0 ? (
  item.checkedUrls.map((url) => (
    <span key={url}>
      {url}
      <br />
    </span>
  ))
) : (
  <span>None</span>
)}
                      </span>
                    )}
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
<section className="storedHero">
  <h2>Stored Info</h2>
  <p>Manage your saved job titles, websites and locations for smarter searches.</p>

  <button onClick={exportStoredInfo}>
    Export Stored Info
  </button>

      <div className="storedTabs">
        <button
          className={storedTab === "terms" ? "storedTabActive" : ""}
          onClick={() => setStoredTab("terms")}
        >
          💼 Job Titles
        </button>

        <button
          className={storedTab === "websites" ? "storedTabActive" : ""}
          onClick={() => setStoredTab("websites")}
        >
          🌐 Websites
        </button>

        <button
          className={storedTab === "locations" ? "storedTabActive" : ""}
          onClick={() => setStoredTab("locations")}
        >
          📍 Locations
        </button>
      </div>
    </section>

    {storedTab === "terms" && (
      <StoredList
        title="Job Titles"
        inputValue={termInput}
        onInputChange={setTermInput}
        placeholder="e.g. Management Accountant"
        saveLabel="+ Add Job Title"
        onSave={saveTerm}
        items={terms}
        onDelete={deleteTerm}
        emptyMessage="No job titles saved yet."
      />
    )}

    {storedTab === "websites" && (
      <StoredList
        title="Websites"
        inputValue={websiteInput}
        onInputChange={setWebsiteInput}
        extraInputValue={websiteNicknameInput}
        onExtraInputChange={setWebsiteNicknameInput}
        extraPlaceholder="Nickname, e.g. Sony Music"
        placeholder="e.g. careers.umusic.com"
        saveLabel="+ Add Website"
        onSave={saveWebsite}
        items={websites}
        onDelete={deleteWebsite}
        emptyMessage="No websites saved yet."
        isWebsiteList
        disabledItems={disabledWebsites}
        onToggleDisabled={toggleWebsiteDisabled}
      />
    )}

    {storedTab === "locations" && (
      <StoredList
        title="Locations"
        inputValue={locationInput}
        onInputChange={setLocationInput}
        placeholder="e.g. London"
        saveLabel="+ Add Location"
        onSave={saveLocation}
        items={locations}
        onDelete={deleteLocation}
        emptyMessage="No locations saved yet."
      />
    )}
  </>
)}
  {activePage === "saved" && (
  <section className="savedPageCard">
    <div className="pageSectionHeader">
      <div>
        <h2>Saved Jobs</h2>
        <p>{savedJobs.length} saved role{savedJobs.length === 1 ? "" : "s"}</p>
      </div>

      <button onClick={() => exportJobs(savedJobs, "job-dashboard-saved-jobs.csv")}>
        Export
      </button>
    </div>

    {savedJobs.length === 0 ? (
      <p>No saved jobs yet.</p>
    ) : (
      <div className="latestMatchesList">
        {savedJobs.map((job, index) => (
          <div className="latestMatchItem" key={`${job.url}-${index}`}>
            <div className="companyLogoBox">
              {getWebsiteDisplayName(job.website).slice(0, 2).toLowerCase()}
            </div>

            <div className="latestMatchInfo">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                {job.title}
              </a>
              <span>{getWebsiteDisplayName(job.website)}</span>
              {job.salary && <small>{job.salary}</small>}
            </div>

            <div className="latestMatchActions">
              <button
                className="latestSaveButton"
                onClick={() => toggleSavedJob(job)}
              >
                ★
              </button>

              <span>{timeAgo(job.foundAt)}</span>

              <button onClick={() => applyForJob(job)}>
                {appliedJobs.some((appliedJob) => appliedJob.url === job.url)
                  ? "Applied"
                  : "Apply"}
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
)}
   {activePage === "applied" && (
  <section className="savedPageCard">
    <div className="pageSectionHeader">
      <div>
        <h2>Applications</h2>
        <p>{appliedJobs.length} role{appliedJobs.length === 1 ? "" : "s"} tracked</p>
      </div>

      <button onClick={() => exportJobs(appliedJobs, "job-dashboard-applied-jobs.csv")}>
        Export
      </button>
    </div>

    <div className="applicationSummaryPills">
      <span>Applied: {appliedJobs.filter((job) => job.status === "Applied").length}</span>
      <span>Interview: {interviewCount}</span>
      <span>Final: {finalStageCount}</span>
      <span>Offers: {offerCount}</span>
    </div>

    {appliedJobs.length === 0 ? (
      <p>No applied jobs yet.</p>
    ) : (
      <div className="latestMatchesList">
        {appliedJobs.map((job, index) => (
          <div className="appliedMatchItem" key={`${job.url}-${index}`}>
            <div className="companyLogoBox">
              {getWebsiteDisplayName(job.website).slice(0, 2).toLowerCase()}
            </div>

            <div className="latestMatchInfo">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                {job.title}
              </a>
              <span>{getWebsiteDisplayName(job.website)}</span>
              {job.salary && <small>{job.salary}</small>}

              <div className="appliedMetaLine">
                <span>{job.status || "Applied"}</span>
                <span>{timeAgo(job.appliedAt)}</span>
              </div>
            </div>

            <div className="appliedActions">
              <select
                value={job.status || "Applied"}
                onChange={(event) => updateAppliedStatus(job, event.target.value)}
              >
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Final Stage">Final Stage</option>
                <option value="Rejected">Rejected</option>
                <option value="Offer">Offer</option>
              </select>

              <button onClick={() => updateAppliedComments(job)}>
                Notes
              </button>

              <button onClick={() => moveAppliedJobToSaved(job)}>
                Move to Saved
              </button>

              <button onClick={() => deleteAppliedJob(job)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
)}

      {activePage === "audit" && (
        <section className="card">
          <h2>Audit Trail ({auditTrail.length})</h2>

          <button onClick={clearAuditTrail} style={{ marginBottom: "16px" }}>
            Clear Audit Trail
          </button>

          {auditTrail.length === 0 ? (
            <p>No successful matches yet.</p>
          ) : (
            <ResultsTable
              results={auditTrail}
              savedJobs={savedJobs}
              appliedJobs={appliedJobs}
              onToggleSaved={toggleSavedJob}
              onApplyJob={applyForJob}
            />
          )}
        </section>
      )}
   <nav className="bottomNav">
  <button
    className={activePage === "home" ? "bottomNavActive" : ""}
    onClick={() => goToPage("home")}
  >
  <span><Icon name="home" /></span>
    Dashboard
  </button>

  <button
    className={activePage === "stored" ? "bottomNavActive" : ""}
    onClick={() => goToPage("stored")}
  >
   <span><Icon name="search" /></span>
    Search
  </button>

  <button
    className={activePage === "saved" ? "bottomNavActive" : ""}
    onClick={() => goToPage("saved")}
  >
 <span><Icon name="saved" /></span>
    Saved
  </button>

  <button
    className={activePage === "applied" ? "bottomNavActive" : ""}
    onClick={() => goToPage("applied")}
  >
   <span><Icon name="applications" /></span>
    Applications
  </button>
</nav>
    </main>
  );
}
function Icon({ name }) {
  const icons = {
    home: (
      <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5Z" />
    ),
    search: (
      <path d="M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21" />
    ),
    saved: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z" />
    ),
    applications: (
      <path d="M20 6 9 17l-5-5" />
    ),
    briefcase: (
  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 9h18v10H3V9Zm0 3h18" />
),

calendar: (
  <path d="M7 3v4M17 3v4M4 7h16v14H4V7Zm0 4h16" />
),

chart: (
  <>
    <path d="M4 20h16" />
    <path d="m6 15 4-4 3 2 5-6" />
  </>
),

star: (
  <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z" />
),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className="appIcon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}
function StoredList({
  title,
  inputValue,
  onInputChange,
  extraInputValue,
  onExtraInputChange,
  extraPlaceholder,
  placeholder,
  saveLabel,
  onSave,
  items,
  onDelete,
  emptyMessage,
  isWebsiteList = false,
  disabledItems = [],
  onToggleDisabled
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

      {onExtraInputChange && (
        <input
          type="text"
          value={extraInputValue}
          onChange={(event) => onExtraInputChange(event.target.value)}
          placeholder={extraPlaceholder}
        />
      )}

      <button onClick={onSave}>{saveLabel}</button>

      <div style={{ marginTop: "18px" }}>
        {items.length === 0 ? (
          <p>{emptyMessage}</p>
        ) : (
          <div className="list">
            {items.map((item) => (
              <div className="listItem" key={item}>
                <span>{isWebsiteList ? getWebsiteDisplayName(item) : item}</span>

                <div className="buttonGroup">
                  {isWebsiteList && onToggleDisabled && (
                    <button
                      className={`smallButton ${
  disabledItems.includes(item)
    ? "disabledWebsiteButton"
    : "enabledWebsiteButton"
}`}
                      onClick={() => onToggleDisabled(item)}
                    >
                      {disabledItems.includes(item) ? "Disabled" : "Enabled"}
                    </button>
                  )}

               <button
  className="smallButton"
  onClick={() => onToggleDisabled(item)}
>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function getWebsiteDisplayName(website) {
  const clean = website
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];

  const savedNames =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("jobWatcherWebsiteNames") || "{}")
      : {};

  if (savedNames[website] || savedNames[clean]) {
    return savedNames[website] || savedNames[clean];
  }

  const overrides = {
    "sonymusic.co.uk": "Sony Music",
    "markssattin.co.uk": "Marks Sattin",
    "jobs.goodmanmasson.com": "Goodman Masson",
    "wmg.wd1.myworkdayjobs.com": "Warner Music Group",
    "lifeatspotify.com": "Spotify",
    "saucerecruitment.com": "Sauce Recruitment",
    "absolute-recruit.com": "Absolute Recruit",
    "wedorecruitment.com": "We Do Recruitment",
    "umusiccareers.com": "Universal Music"
  };

  if (overrides[clean]) return overrides[clean];

  const parts = clean.split(".");
  const mainName =
    parts[0] === "jobs" || parts[0] === "careers" ? parts[1] : parts[0];

  return mainName
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function timeAgo(dateString) {
  if (!dateString) return "";

  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "Just now";

  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString();
}

function ResultsTable({
  results,
  savedJobs = [],
  appliedJobs = [],
  onToggleSaved,
  onApplyJob,
  onUpdateStatus,
  onUpdateComments,
  onMoveAppliedToSaved,
  onDeleteApplied,
  showAppliedFields = false
}) {
  return (
    <div className="resultCards">
      {results.map((result, index) => {
        const isSaved = savedJobs.some((savedJob) => savedJob.url === result.url);
        const isApplied = appliedJobs.some(
          (appliedJob) => appliedJob.url === result.url
        );

        return (
          <div className="resultCard" key={`${result.term}-${result.url}-${index}`}>
            {onApplyJob && !isApplied && (
              <button
                className="applyJobButton"
                onClick={() => onApplyJob(result)}
              >
                Applied
              </button>
            )}

            {onToggleSaved && !showAppliedFields && (
              <button
                className="saveJobButton"
                onClick={() => onToggleSaved(result)}
                aria-label={isSaved ? "Unsave job" : "Save job"}
              >
                {isSaved ? "★" : "☆"}
              </button>
            )}

            <a
              className="resultTitle"
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {result.title}
            </a>

            <div className="resultMeta">
              <div>
                <strong>Company</strong>
                <span>{getWebsiteDisplayName(result.website)}</span>
              </div>

              {result.salary && (
                <div>
                  <strong>Salary</strong>
                  <span>{result.salary}</span>
                </div>
              )}

              <div>
                <strong>Job Title</strong>
                <span>{result.term}</span>
              </div>

              <div>
                <strong>Found</strong>
                <span>{timeAgo(result.foundAt)}</span>
              </div>

              {showAppliedFields && (
                <>
                  <div>
                    <strong>Applied</strong>
                    <span>{formatDate(result.appliedAt)}</span>
                  </div>

               <div>
  <strong>Current Status</strong>
  <span>{result.status || "Applied"}</span>
</div>

<div>
  <strong>Change Status</strong>
  <select
    value={result.status || "Applied"}
                      onChange={(event) =>
                        onUpdateStatus(result, event.target.value)
                      }
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interview">Interview</option>
                      <option value="Final Stage">Final Stage</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Offer">Offer</option>
                    </select>
                  </div>
{onMoveAppliedToSaved && (
  <button
    style={{ marginTop: "10px" }}
    onClick={() => onMoveAppliedToSaved(result)}
  >
    Move back to Saved
  </button>
)}

{onDeleteApplied && (
  <button
    style={{ marginTop: "10px" }}
    onClick={() => onDeleteApplied(result)}
  >
    Remove from Applied
  </button>
)}
                  <div>
  <strong>Application Notes</strong>
  <span>{result.additionalComments || "None"}</span>
</div>

{onUpdateComments && (
  <button
    className="smallButton"
    onClick={() => onUpdateComments(result)}
  >
    Edit Notes
  </button>
)}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}