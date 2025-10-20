// Load and display conference data
fetch("src/data.json")
  .then((response) => response.json())
  .then((data) => {
    console.log("Conference Data:", data);
    displayDeadlinesView(data.conferences, data.humans);
    displayDetailsView(data.conferences);
  })
  .catch((error) => {
    console.error("Error loading conference data:", error);
  });

// Format date as "June 5, 2025"
function formatDate(dateString) {
  return dateFns.format(new Date(dateString), "MMMM d, yyyy");
}

// Calculate relative time from now to a date
function getRelativeTime(dateString) {
  const deadline = new Date(dateString);
  const now = new Date();

  // Check if deadline is in the past
  if (dateFns.isPast(deadline) && !dateFns.isToday(deadline)) {
    return dateFns.formatDistance(deadline, now, { addSuffix: true });
  }

  // For future dates or today
  return dateFns.formatDistance(now, deadline);
}

// Check if deadline is less than 7 days away
function isUrgent(dateString) {
  const deadline = new Date(dateString);
  const now = new Date();
  const diffTime = deadline - now;
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return daysRemaining < 7 && daysRemaining >= 0;
}

// Get the next upcoming deadline for a conference
function getNextDeadline(conference) {
  const now = new Date();
  const upcomingDeadlines = conference.deadlines
    .map((d) => ({ ...d, date: new Date(d.date) }))
    .filter((d) => dateFns.isFuture(d.date) || dateFns.isToday(d.date))
    .sort((a, b) => a.date - b.date);

  return upcomingDeadlines.length > 0 ? upcomingDeadlines[0] : null;
}

// Display Format 1: Next deadline with relative time
function displayDeadlinesView(conferences, humans) {
  const container = document.getElementById("deadlines-view");

  // Create a map of human names to their data
  const humanMap = {};
  humans.forEach((human) => {
    humanMap[human.name] = human;
  });

  // Get conferences with upcoming deadlines
  const conferencesWithDeadlines = conferences
    .map((conf) => ({
      conference: conf,
      nextDeadline: getNextDeadline(conf),
    }))
    .filter((item) => item.nextDeadline !== null)
    .sort((a, b) => a.nextDeadline.date - b.nextDeadline.date);

  if (conferencesWithDeadlines.length === 0) {
    container.innerHTML = "<p>No upcoming deadlines</p>";
    return;
  }

  // Prepare data for template
  const items = conferencesWithDeadlines.map((item) => ({
    deadline: item.nextDeadline,
    conference: item.conference,
    acronym: item.conference.acronym,
    relativeTime: getRelativeTime(item.nextDeadline.date),
    isUrgent: isUrgent(item.nextDeadline.date),
    interestedPeople: item.conference.interested.map((name) => humanMap[name]),
  }));

  // Render template
  const template = document.getElementById("deadlines-template").innerHTML;
  const rendered = ejs.render(template, { items });
  container.innerHTML = rendered;
}

// Display Format 2: All conference details
function displayDetailsView(conferences) {
  const container = document.getElementById("details-view");

  // Prepare data for template
  const preparedConferences = conferences.map((conf) => {
    const startDate = formatDate(conf.dates[0]);
    const endDate = formatDate(conf.dates[1]);
    const dateRange =
      conf.dates[0] === conf.dates[1] ? startDate : `${startDate} - ${endDate}`;

    // Sort deadlines by date
    const sortedDeadlines = [...conf.deadlines]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((d) => ({
        title: d.title,
        formattedDate: formatDate(d.date),
      }));

    return {
      name: conf.name,
      acronym: conf.acronym,
      dateRange: dateRange,
      location: conf.location.join(", "),
      url: conf.url,
      deadlines: sortedDeadlines,
    };
  });

  // Render template
  const template = document.getElementById("details-template").innerHTML;
  const rendered = ejs.render(template, { conferences: preparedConferences });
  container.innerHTML = rendered;
}
